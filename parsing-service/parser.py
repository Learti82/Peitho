"""
PDF text extraction with PyMuPDF and pytesseract OCR fallback.
"""
from __future__ import annotations

import io
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Lazy imports so the service starts even if tesseract binary is missing
try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False
    logger.warning("PyMuPDF not available")

try:
    import pytesseract
    from PIL import Image
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    logger.warning("pytesseract/Pillow not available — OCR fallback disabled")


def _ocr_page(page: "fitz.Page") -> str:
    """Render a PDF page to image and run OCR on it."""
    if not TESSERACT_AVAILABLE:
        return ""
    # Render at 2x resolution for better OCR accuracy
    mat = fitz.Matrix(2.0, 2.0)
    pix = page.get_pixmap(matrix=mat)
    img = Image.open(io.BytesIO(pix.tobytes("png")))
    text = pytesseract.image_to_string(img, lang="sqi+eng")
    return text.strip()


def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extract all text from a PDF file.

    For each page:
    - First try native text extraction via PyMuPDF.
    - If the extracted text is very short (< 50 chars), assume the page
      is scanned and fall back to pytesseract OCR.

    Returns a single string with pages delimited by "--- PAGE N ---" markers.
    """
    if not PYMUPDF_AVAILABLE:
        raise RuntimeError("PyMuPDF is required for PDF parsing")

    doc = fitz.open(pdf_path)
    pages: list[str] = []
    total_pages = len(doc)

    logger.info("Extracting text from PDF: %s (%d pages)", pdf_path, total_pages)

    for page_num in range(total_pages):
        page = doc[page_num]
        display_num = page_num + 1

        # Native text extraction
        native_text = page.get_text("text").strip()

        if len(native_text) >= 50:
            page_text = native_text
            logger.debug("Page %d: native extraction (%d chars)", display_num, len(page_text))
        else:
            # Scanned page — try OCR
            logger.info(
                "Page %d: native text too short (%d chars), trying OCR",
                display_num,
                len(native_text),
            )
            ocr_text = _ocr_page(page)
            if ocr_text:
                page_text = ocr_text
                logger.debug("Page %d: OCR extraction (%d chars)", display_num, len(page_text))
            else:
                page_text = native_text  # best we can do
                logger.warning("Page %d: OCR returned empty text", display_num)

        pages.append(f"--- PAGE {display_num} ---\n{page_text}")

    doc.close()
    full_text = "\n\n".join(pages)
    logger.info(
        "Extraction complete: %d pages, %d total chars", total_pages, len(full_text)
    )
    return full_text
