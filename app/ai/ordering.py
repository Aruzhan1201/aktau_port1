import json
import logging
import re

from app.core.config import settings
from app.schemas.cargo import AIOrderOutput

logger = logging.getLogger(__name__)

try:
    from openai import AsyncOpenAI

    _client = AsyncOpenAI(
        api_key=settings.OPENROUTER_API_KEY,
        base_url=settings.OPENROUTER_BASE_URL,
    )
except Exception as e:
    logger.warning("Failed to initialize OpenAI client: %s", e)
    _client = None


SYSTEM_PROMPT = """You are a cargo logistics assistant for Aktau Port. Extract structured cargo order details from natural language.

Return ONLY valid JSON with these fields:
- cargo_type: string (e.g., grain, oil, container, machinery, chemicals, food)
- weight: number (in tons, must be a positive number)
- origin: string (city/port name, default to "Aktau" if not specified)
- destination: string (city/port name)
- deadline: string (ISO date format YYYY-MM-DD, or null if not mentioned)

If any field is ambiguous or missing, set it to null and include the missing field name in a "missing_fields" array.

Examples:
Input: "Need to transport 50 tons of grain from Aktau to Baku before June 20"
Output: {"cargo_type": "grain", "weight": 50, "origin": "Aktau", "destination": "Baku", "deadline": "2026-06-20", "missing_fields": []}

Input: "Send my cargo to Istanbul"
Output: {"cargo_type": null, "weight": null, "origin": null, "destination": "Istanbul", "deadline": null, "missing_fields": ["cargo_type", "weight", "origin"]}
"""


async def parse_natural_language_order(text: str) -> AIOrderOutput:
    if _client is None:
        return _fallback_parse(text)

    try:
        response = await _client.chat.completions.create(
            model=settings.OPENROUTER_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": text},
            ],
            temperature=0.1,
            max_tokens=300,
        )
        content = (response.choices[0].message.content or "").strip()
        if content.startswith("```"):
            content = re.sub(r"^```(?:json)?\s*", "", content)
            content = re.sub(r"\s*```$", "", content)

        data = json.loads(content)
        return _build_output(data)
    except Exception as e:
        logger.error("OpenRouter AI parsing failed: %s", e)
        return _fallback_parse(text)


def _build_output(data: dict) -> AIOrderOutput:
    missing = []
    for field in ["cargo_type", "weight", "origin", "destination"]:
        if data.get(field) is None or data.get(field) == "":
            missing.append(field)

    confidence = 1.0
    if missing:
        confidence = max(0.1, 1.0 - (len(missing) * 0.25))
    if data.get("deadline") is None:
        if "deadline" not in (data.get("missing_fields") or []):
            confidence -= 0.05
            missing.append("deadline")

    confidence = round(max(0.1, min(1.0, confidence)), 2)
    requires_review = confidence < 0.7

    return AIOrderOutput(
        cargo_type=data.get("cargo_type"),
        weight=data.get("weight"),
        origin=data.get("origin"),
        destination=data.get("destination"),
        deadline=data.get("deadline"),
        confidence=confidence,
        missing_fields=missing,
        requires_review=requires_review,
    )


def _fallback_parse(text: str) -> AIOrderOutput:
    text_lower = text.lower()
    cargo_type = None
    weight = None
    origin = None
    destination = None
    deadline = None

    for word in ["grain", "oil", "container", "machinery", "chemicals", "food", "steel", "coal", "fertilizer"]:
        if word in text_lower:
            cargo_type = word
            break

    weight_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:tons?|t\b)", text_lower)
    if weight_match:
        weight = float(weight_match.group(1))

    origin_match = re.search(r"from\s+(\w+)", text_lower)
    if origin_match:
        origin = origin_match.group(1).capitalize()
    if not origin:
        origin = "Aktau"

    skip_words = {"transport", "deliver", "send", "carry", "move", "ship", "port"}
    dest_matches = re.findall(r"\bto\s+(\w+)", text_lower)
    for dm in reversed(dest_matches):
        if dm not in skip_words:
            destination = dm.capitalize()
            break

    date_match = re.search(
        r"(?:before|by|until)\s+(\d{4}-\d{2}-\d{2}|\w+\s+\d{1,2})", text_lower
    )
    if date_match:
        deadline = date_match.group(1)

    if not destination:
        words = text_lower.split()
        for i, w in enumerate(words):
            if w == "to" and i + 1 < len(words):
                cand = words[i + 1].capitalize()
                if cand.lower() not in skip_words:
                    destination = cand
                    break

    data = {
        "cargo_type": cargo_type,
        "weight": weight,
        "origin": origin,
        "destination": destination,
        "deadline": deadline,
        "missing_fields": [],
    }
    return _build_output(data)
