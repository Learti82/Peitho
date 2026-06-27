"""
Peitho Parsing Service — FastAPI application.
"""
from __future__ import annotations

import logging
import os
import tempfile
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from extractor import extract_requirements
from parser import extract_text_from_pdf
from schemas import ParseResponse

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")


# ──────────────────────────────────────────────────────────────
# Supabase client (lazy init so tests don't fail without creds)
# ──────────────────────────────────────────────────────────────

_supabase_client = None


def get_supabase():
    global _supabase_client
    if _supabase_client is None:
        from supabase import create_client
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    return _supabase_client


# ──────────────────────────────────────────────────────────────
# App
# ──────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Peitho Parsing Service starting up")
    yield
    logger.info("Peitho Parsing Service shutting down")


app = FastAPI(
    title="Peitho Parsing Service",
    description="AI-powered tender document parser",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────

def _validate_jwt(jwt_token: str) -> str:
    """
    Validate a Supabase JWT and return the user ID.
    Uses the Supabase admin API to verify the token.
    Raises HTTPException 401 if invalid.
    """
    try:
        sb = get_supabase()
        response = sb.auth.get_user(jwt_token)
        if response is None or response.user is None:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return response.user.id
    except HTTPException:
        raise
    except Exception as e:
        logger.error("JWT validation error: %s", e)
        raise HTTPException(status_code=401, detail="Token validation failed") from e


def _upload_pdf_to_storage(
    supabase,
    file_bytes: bytes,
    organization_id: str,
    tender_id: str,
) -> str:
    """
    Upload the PDF to Supabase Storage.
    Returns the storage path.
    """
    storage_path = f"{organization_id}/{tender_id}/original.pdf"
    try:
        supabase.storage.from_("tender-documents").upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": "application/pdf", "upsert": "true"},
        )
        logger.info("PDF uploaded to storage: %s", storage_path)
        return storage_path
    except Exception as e:
        logger.error("Storage upload failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to upload PDF: {e}") from e


def _insert_tender(supabase, tender_id: str, organization_id: str, extraction, pdf_storage_path: str) -> dict:
    """Insert tender record into Supabase."""
    meta = extraction.metadata

    submission_deadline = None
    if meta.submission_deadline:
        try:
            # Ensure timezone-aware ISO string
            dt = datetime.fromisoformat(meta.submission_deadline)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            submission_deadline = dt.isoformat()
        except ValueError:
            logger.warning("Could not parse submission_deadline: %s", meta.submission_deadline)

    tender_data = {
        "id": tender_id,
        "organization_id": organization_id,
        "title": meta.title,
        "contracting_authority": meta.contracting_authority,
        "category": meta.category.value if meta.category else None,
        "estimated_value_amount": meta.estimated_value_amount,
        "estimated_value_currency": meta.estimated_value_currency or "EUR",
        "submission_deadline": submission_deadline,
        "language": meta.language.value if meta.language else None,
        "evaluation_method": meta.evaluation_method.value if meta.evaluation_method else None,
        "evaluation_weight_technical": meta.evaluation_weight_technical,
        "evaluation_weight_financial": meta.evaluation_weight_financial,
        "submission_format": meta.submission_format.value if meta.submission_format else None,
        "documents_required": meta.documents_required or [],
        "lots": meta.lots,
        "parsing_confidence": extraction.parsing_confidence,
        "parsing_warnings": extraction.parsing_warnings,
        "pdf_storage_path": pdf_storage_path,
        "status": "PARSED",
        "completion_percentage": 0,
    }

    result = supabase.table("tenders").insert(tender_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to insert tender record")
    logger.info("Tender inserted: %s", tender_id)
    return result.data[0]


def _insert_requirements(supabase, tender_id: str, requirements: list) -> list[dict]:
    """Insert all requirements, return list of inserted rows."""
    if not requirements:
        return []

    rows = []
    for req in requirements:
        rows.append({
            "tender_id": tender_id,
            "requirement_id": req.requirement_id,
            "category": req.category.value,
            "requirement_text": req.requirement_text,
            "evidence_needed": req.evidence_needed,
            "is_mandatory": req.is_mandatory,
            "evaluation_weight": req.evaluation_weight,
            "source_page": req.source_page,
            "source_section": req.source_section,
        })

    result = supabase.table("tender_requirements").insert(rows).execute()
    if result.data is None:
        raise HTTPException(status_code=500, detail="Failed to insert requirements")
    logger.info("Inserted %d requirements", len(result.data))
    return result.data


def _insert_checklist_items(supabase, tender_id: str, requirement_rows: list[dict]) -> list[dict]:
    """Create a checklist item for each requirement."""
    if not requirement_rows:
        return []

    rows = [
        {
            "tender_id": tender_id,
            "requirement_id": row["id"],
            "status": "NOT_STARTED",
            "notes": None,
            "assigned_to": None,
        }
        for row in requirement_rows
    ]

    result = supabase.table("checklist_items").insert(rows).execute()
    if result.data is None:
        raise HTTPException(status_code=500, detail="Failed to insert checklist items")
    logger.info("Inserted %d checklist items", len(result.data))
    return result.data


# ──────────────────────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "peitho-parsing-service"}


@app.post("/parse-tender", response_model=ParseResponse)
async def parse_tender(
    file: UploadFile = File(..., description="PDF tender document"),
    organization_id: str = Form(..., description="Organization UUID"),
    supabase_jwt: str = Form(..., description="Supabase user JWT for authentication"),
):
    """
    Parse a tender PDF and store all extracted data in Supabase.

    Steps:
    1. Validate Supabase JWT
    2. Save PDF to temp file
    3. Extract text (PyMuPDF + OCR fallback)
    4. Extract requirements via Claude API
    5. Upload PDF to Supabase Storage
    6. Insert tender, requirements, and checklist items into DB
    7. Return ParseResponse
    """
    # 1. Validate JWT
    user_id = _validate_jwt(supabase_jwt)
    if user_id != organization_id:
        raise HTTPException(
            status_code=403,
            detail="organization_id does not match authenticated user",
        )

    # 2. Validate file
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    if len(file_bytes) > 50 * 1024 * 1024:  # 50 MB
        raise HTTPException(status_code=400, detail="File too large (max 50 MB)")

    tender_id = str(uuid.uuid4())
    logger.info(
        "Processing tender %s for org %s (file: %s, %d bytes)",
        tender_id,
        organization_id,
        file.filename,
        len(file_bytes),
    )

    # 3. Save to temp file and extract text
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        text = extract_text_from_pdf(tmp_path)
    except Exception as e:
        logger.error("PDF text extraction failed: %s", e)
        raise HTTPException(
            status_code=422,
            detail=f"Failed to extract text from PDF: {e}",
        ) from e
    finally:
        import os as _os
        try:
            _os.unlink(tmp_path)
        except OSError:
            pass

    if not text.strip():
        raise HTTPException(
            status_code=422,
            detail="No text could be extracted from the PDF (may be image-only or encrypted)",
        )

    # 4. Extract requirements via Claude
    try:
        extraction = extract_requirements(text)
    except Exception as e:
        logger.error("Extraction failed: %s", e)
        raise HTTPException(
            status_code=500,
            detail=f"AI extraction failed: {e}",
        ) from e

    supabase = get_supabase()

    # 5. Upload PDF to storage
    pdf_storage_path = _upload_pdf_to_storage(supabase, file_bytes, organization_id, tender_id)

    # 6a. Insert tender
    tender_row = _insert_tender(supabase, tender_id, organization_id, extraction, pdf_storage_path)

    # 6b. Insert requirements
    req_rows = _insert_requirements(supabase, tender_id, extraction.requirements)

    # 6c. Insert checklist items
    checklist_rows = _insert_checklist_items(supabase, tender_id, req_rows)

    # 7. Return response
    return ParseResponse(
        tender_id=tender_id,
        organization_id=organization_id,
        title=extraction.metadata.title,
        contracting_authority=extraction.metadata.contracting_authority,
        status="PARSED",
        parsing_confidence=extraction.parsing_confidence,
        parsing_warnings=extraction.parsing_warnings,
        requirements_count=len(req_rows),
        checklist_items_count=len(checklist_rows),
        pdf_storage_path=pdf_storage_path,
        created_at=tender_row.get("created_at", datetime.now(timezone.utc).isoformat()),
    )
