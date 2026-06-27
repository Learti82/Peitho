"""
Claude API extraction logic for Peitho parsing service.
"""
from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any

import anthropic
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from schemas import ExtractionResult

logger = logging.getLogger(__name__)

# Path to the system prompt file
PROMPT_FILE = Path(__file__).parent / "prompts" / "extraction_prompt.txt"

# Maximum number of characters to send to Claude.
# Very long documents are truncated with a note to avoid token limits.
MAX_CHARS = 180_000


def _load_system_prompt() -> str:
    """Load the extraction system prompt from disk."""
    if not PROMPT_FILE.exists():
        raise FileNotFoundError(f"Extraction prompt not found at {PROMPT_FILE}")
    return PROMPT_FILE.read_text(encoding="utf-8")


def _truncate_text(text: str) -> tuple[str, bool]:
    """
    Truncate text to MAX_CHARS if necessary.
    Returns (possibly-truncated text, was_truncated).
    """
    if len(text) <= MAX_CHARS:
        return text, False
    truncated = text[:MAX_CHARS]
    # Try to cut at a page boundary for cleaner context
    last_page = truncated.rfind("--- PAGE ")
    if last_page > MAX_CHARS * 0.8:
        truncated = truncated[:last_page]
    return truncated + "\n\n[DOCUMENT TRUNCATED — additional pages not shown]", True


def _parse_json_response(content: str) -> dict[str, Any]:
    """
    Extract JSON from Claude's response.
    Handles cases where the model wraps JSON in markdown fences.
    """
    text = content.strip()

    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first line (```json or ```) and last line (```)
        inner = lines[1:-1] if lines[-1].strip() == "```" else lines[1:]
        text = "\n".join(inner).strip()

    return json.loads(text)


@retry(
    retry=retry_if_exception_type((anthropic.APIConnectionError, anthropic.RateLimitError)),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=30),
    reraise=True,
)
def _call_claude(client: anthropic.Anthropic, system_prompt: str, user_message: str) -> str:
    """Call the Claude API with retry logic."""
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=8192,
        system=system_prompt,
        messages=[
            {
                "role": "user",
                "content": user_message,
            }
        ],
    )
    return message.content[0].text


def extract_requirements(text: str) -> ExtractionResult:
    """
    Send extracted PDF text to Claude and return structured ExtractionResult.

    Raises:
        RuntimeError: if the API call fails after all retries
        ValidationError: if Claude returns JSON that doesn't match the schema
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY environment variable not set")

    client = anthropic.Anthropic(api_key=api_key)
    system_prompt = _load_system_prompt()

    truncated_text, was_truncated = _truncate_text(text)

    user_message = (
        "Please extract all tender information from the following document text "
        "and return the result as JSON matching the schema described in the system prompt.\n\n"
        f"DOCUMENT TEXT:\n\n{truncated_text}"
    )

    logger.info(
        "Calling Claude API (text length: %d chars, truncated: %s)",
        len(truncated_text),
        was_truncated,
    )

    try:
        response_text = _call_claude(client, system_prompt, user_message)
    except anthropic.APIError as e:
        logger.error("Claude API error: %s", e)
        raise RuntimeError(f"Claude API error: {e}") from e

    logger.debug("Raw Claude response (first 500 chars): %s", response_text[:500])

    try:
        data = _parse_json_response(response_text)
    except json.JSONDecodeError as e:
        logger.error("Failed to parse Claude JSON response: %s", e)
        logger.error("Response was: %s", response_text[:2000])
        raise RuntimeError(f"Claude returned invalid JSON: {e}") from e

    # Add truncation warning if applicable
    if was_truncated:
        warnings = data.get("parsing_warnings", [])
        warnings.append(
            "Document was truncated before sending to AI — some requirements from later pages may be missing."
        )
        data["parsing_warnings"] = warnings

    # Validate against Pydantic schema
    result = ExtractionResult.model_validate(data)
    logger.info(
        "Extraction complete: %d requirements, confidence=%.2f, %d warnings",
        len(result.requirements),
        result.parsing_confidence,
        len(result.parsing_warnings),
    )
    return result
