"""Claim extraction service — Layer 1 Step 3."""
import json
from openai import AsyncOpenAI
from config import get_settings

settings = get_settings()
client = AsyncOpenAI(api_key=settings.openai_api_key)


async def extract_claims(text: str) -> list[dict]:
    """Extract individual factual claims from document text.
    
    Returns list of dicts: {statement, entities, date, confidence}
    """
    if not text or text.startswith("["):
        return []

    try:
        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {
                    "role": "system",
                    "content": """You are an investigation analyst extracting factual claims from documents.
Extract every distinct factual claim. For each claim provide:
- statement: the claim in plain English
- entities: list of entity names mentioned
- date: specific date if mentioned (ISO format YYYY-MM-DD), or null
- confidence: your confidence this is a factual claim (0.0 to 1.0)

Respond with a JSON array. Example:
[
  {"statement": "Shell Corp LLC was incorporated on March 14 2019", "entities": ["Shell Corp LLC"], "date": "2019-03-14", "confidence": 0.95},
  {"statement": "John Smith served as CEO", "entities": ["John Smith", "Shell Corp LLC"], "date": null, "confidence": 0.8}
]"""
                },
                {
                    "role": "user",
                    "content": f"Extract all factual claims from this document:\n\n{text[:5000]}"
                }
            ],
            temperature=0.2,
            max_tokens=2000,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content.strip()
        parsed = json.loads(content)

        # Handle both {"claims": [...]} and [...] formats
        if isinstance(parsed, dict) and "claims" in parsed:
            claims = parsed["claims"]
        elif isinstance(parsed, list):
            claims = parsed
        else:
            claims = list(parsed.values())[0] if parsed else []

        # Validate and normalize
        valid_claims = []
        for c in claims:
            if isinstance(c, dict) and "statement" in c:
                valid_claims.append({
                    "statement": c["statement"],
                    "entities": c.get("entities", []),
                    "date": c.get("date"),
                    "confidence": float(c.get("confidence", 0.5)),
                })
        return valid_claims

    except Exception as e:
        print(f"Claim extraction error: {e}")
        return []
