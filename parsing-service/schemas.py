"""
Pydantic schemas for Peitho parsing service.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


# ──────────────────────────────────────────────────────────────
# Enums (must mirror DB enums)
# ──────────────────────────────────────────────────────────────

class TenderCategory(str, Enum):
    IT_SERVICES = "IT_SERVICES"
    CONSTRUCTION = "CONSTRUCTION"
    CONSULTING = "CONSULTING"
    SUPPLIES = "SUPPLIES"


class TenderLanguage(str, Enum):
    sq = "sq"
    en = "en"
    sq_en = "sq_en"


class EvaluationMethod(str, Enum):
    LOWEST_PRICE = "LOWEST_PRICE"
    BEST_VALUE = "BEST_VALUE"
    QUALITY_ONLY = "QUALITY_ONLY"


class SubmissionFormat(str, Enum):
    ELECTRONIC = "ELECTRONIC"
    PHYSICAL = "PHYSICAL"
    BOTH = "BOTH"


class RequirementCategory(str, Enum):
    ADMINISTRATIVE_ELIGIBILITY = "ADMINISTRATIVE_ELIGIBILITY"
    PROFESSIONAL_CAPACITY = "PROFESSIONAL_CAPACITY"
    TECHNICAL_CAPACITY = "TECHNICAL_CAPACITY"
    FINANCIAL_CAPACITY = "FINANCIAL_CAPACITY"
    TECHNICAL_PROPOSAL = "TECHNICAL_PROPOSAL"
    FINANCIAL_PROPOSAL = "FINANCIAL_PROPOSAL"
    EVALUATION_CRITERIA = "EVALUATION_CRITERIA"
    SUBMISSION_REQUIREMENTS = "SUBMISSION_REQUIREMENTS"


# ──────────────────────────────────────────────────────────────
# Extraction models
# ──────────────────────────────────────────────────────────────

class TenderRequirement(BaseModel):
    requirement_id: str = Field(
        ...,
        description="Sequential ID like REQ-001, REQ-002, etc.",
        examples=["REQ-001"],
    )
    category: RequirementCategory = Field(
        ...,
        description="Category of the requirement.",
    )
    requirement_text: str = Field(
        ...,
        description="Full text of the requirement in the original language.",
    )
    evidence_needed: Optional[str] = Field(
        None,
        description="Description of document/evidence the bidder must provide.",
    )
    is_mandatory: bool = Field(
        True,
        description="Whether this requirement is mandatory (True) or optional (False).",
    )
    evaluation_weight: Optional[float] = Field(
        None,
        description="Weight as percentage (0-100) if this requirement is scored.",
    )
    source_page: Optional[int] = Field(
        None,
        description="1-based page number where this requirement appears.",
    )
    source_section: Optional[str] = Field(
        None,
        description="Section or article number/title where requirement appears.",
    )


class TenderMetadata(BaseModel):
    title: Optional[str] = Field(None, description="Official tender title.")
    contracting_authority: Optional[str] = Field(
        None, description="Name of the contracting authority / procuring entity."
    )
    category: Optional[TenderCategory] = Field(
        None, description="Best-fit category for this tender."
    )
    estimated_value_amount: Optional[float] = Field(
        None, description="Estimated contract value as a number."
    )
    estimated_value_currency: Optional[str] = Field(
        "EUR", description="Currency code, e.g. EUR, ALL, USD."
    )
    submission_deadline: Optional[str] = Field(
        None,
        description="Submission deadline as ISO-8601 datetime string, e.g. 2024-09-30T14:00:00.",
    )
    language: Optional[TenderLanguage] = Field(
        None,
        description="Primary language(s) of the document: sq (Albanian), en (English), or sq_en (bilingual).",
    )
    evaluation_method: Optional[EvaluationMethod] = Field(
        None, description="Method used to evaluate bids."
    )
    evaluation_weight_technical: Optional[int] = Field(
        None, description="Technical evaluation weight as integer percentage (0-100)."
    )
    evaluation_weight_financial: Optional[int] = Field(
        None, description="Financial evaluation weight as integer percentage (0-100)."
    )
    submission_format: Optional[SubmissionFormat] = Field(
        None, description="How bids must be submitted."
    )
    documents_required: Optional[List[str]] = Field(
        None, description="List of documents required for submission."
    )
    lots: Optional[int] = Field(
        None, description="Number of lots in this tender (1 if single lot)."
    )


class ExtractionResult(BaseModel):
    metadata: TenderMetadata
    requirements: List[TenderRequirement] = Field(
        default_factory=list,
        description="All extracted requirements.",
    )
    parsing_confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score from 0.0 to 1.0 for the extraction quality.",
    )
    parsing_warnings: List[str] = Field(
        default_factory=list,
        description="Any warnings about unclear or missing information.",
    )


# ──────────────────────────────────────────────────────────────
# API request / response models
# ──────────────────────────────────────────────────────────────

class ParseResponse(BaseModel):
    tender_id: str = Field(..., description="UUID of the created tender record.")
    organization_id: str = Field(..., description="UUID of the organization.")
    title: Optional[str] = Field(None)
    contracting_authority: Optional[str] = Field(None)
    status: str = Field("PARSED")
    parsing_confidence: float
    parsing_warnings: List[str]
    requirements_count: int
    checklist_items_count: int
    pdf_storage_path: str
    created_at: str

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}
