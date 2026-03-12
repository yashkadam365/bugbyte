"""Contradiction detection service — Layer 2."""
import json
from openai import AsyncOpenAI
from config import get_settings
from database import claims_collection

settings = get_settings()
client = AsyncOpenAI(api_key=settings.openai_api_key, base_url=settings.openai_base_url)


async def detect_contradictions(case_id: str, new_claims: list[dict]) -> list[dict]:
    """Compare new claims against existing claims in the case to find contradictions.
    
    Returns list of contradiction dicts: {claimA, claimB, type, confidence, reason, suggestedAction}
    """
    if not new_claims:
        return []

    # Fetch existing claims for this case
    existing_claims = []
    cursor = claims_collection.find({"caseId": case_id})
    async for claim in cursor:
        existing_claims.append({
            "id": str(claim["_id"]),
            "statement": claim["statement"],
            "date": claim.get("date"),
            "entities": claim.get("entities", []),
        })

    if not existing_claims:
        return []

    # Build context for LLM
    existing_text = "\n".join(
        [f"[{c['id']}] {c['statement']} (date: {c.get('date', 'N/A')})" for c in existing_claims[-30:]]
    )
    new_text = "\n".join(
        [f"[NEW-{i}] {c['statement']} (date: {c.get('date', 'N/A')})" for i, c in enumerate(new_claims)]
    )

    try:
        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {
                    "role": "system",
                    "content": """You are a contradiction detection analyst. Compare NEW claims against EXISTING claims.
Identify contradictions of these types:
- date_conflict: events in impossible chronological order
- identity_conflict: different roles/locations for same entity
- financial_conflict: transaction values don't match
- statement_conflict: opposing factual assertions
- existence_conflict: one claims entity exists, another denies it

For each contradiction found, provide:
- existingClaimId: the ID of the existing claim
- newClaimIndex: the index of the new claim (NEW-0, NEW-1, etc.)
- type: contradiction type
- confidence: 0.0 to 1.0
- reason: explanation of the contradiction
- suggestedAction: what the investigator should do

Respond with JSON: {"contradictions": [...]}
If no contradictions found, respond: {"contradictions": []}"""
                },
                {
                    "role": "user",
                    "content": f"EXISTING CLAIMS:\n{existing_text}\n\nNEW CLAIMS:\n{new_text}"
                }
            ],
            temperature=0.2,
            max_tokens=2000,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content.strip()
        parsed = json.loads(content)
        contradictions = parsed.get("contradictions", [])

        valid = []
        for c in contradictions:
            if isinstance(c, dict) and "reason" in c:
                valid.append({
                    "existingClaimId": c.get("existingClaimId", ""),
                    "newClaimIndex": c.get("newClaimIndex", 0),
                    "type": c.get("type", "statement_conflict"),
                    "confidence": float(c.get("confidence", 0.5)),
                    "reason": c["reason"],
                    "suggestedAction": c.get("suggestedAction", "Investigate further"),
                })
        return valid
    except Exception as e:
        print(f"Contradiction detection error: {e}")
        return []
