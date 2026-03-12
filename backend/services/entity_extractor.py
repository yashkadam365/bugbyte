"""Entity and timeline extraction service — Layer 1 Steps 4 & 6."""
import json
from openai import AsyncOpenAI
from config import get_settings

settings = get_settings()
client = AsyncOpenAI(api_key=settings.openai_api_key)


async def extract_entities(text: str) -> list[dict]:
    """Extract entities (person, organization, location, date, event) from text.
    
    Returns list of dicts: {name, type, aliases}
    """
    if not text or text.startswith("["):
        return []

    try:
        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {
                    "role": "system",
                    "content": """You are an investigation analyst extracting entities from documents.
Identify all named entities. For each entity provide:
- name: primary name
- type: one of person, organization, location, date, event
- aliases: list of alternative names or references

Respond with a JSON object like: {"entities": [...]}"""
                },
                {
                    "role": "user",
                    "content": f"Extract all entities from this document:\n\n{text[:5000]}"
                }
            ],
            temperature=0.2,
            max_tokens=1500,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content.strip()
        parsed = json.loads(content)
        entities = parsed.get("entities", [])

        valid = []
        for e in entities:
            if isinstance(e, dict) and "name" in e:
                valid.append({
                    "name": e["name"],
                    "type": e.get("type", "unknown"),
                    "aliases": e.get("aliases", []),
                })
        return valid
    except Exception as e:
        print(f"Entity extraction error: {e}")
        return []


async def extract_timeline_events(text: str) -> list[dict]:
    """Extract dated events from document text.
    
    Returns list of dicts: {date, approxDate, description, entitiesInvolved}
    """
    if not text or text.startswith("["):
        return []

    try:
        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {
                    "role": "system",
                    "content": """You are an investigation analyst extracting timeline events from documents.
Find all events with dates or approximate time references. For each event provide:
- date: specific date in YYYY-MM-DD format, or null
- approxDate: approximate time description if no exact date (e.g. "early 2019", "Q3 2020"), or null
- description: what happened
- entitiesInvolved: list of entity names involved

Respond with a JSON object like: {"events": [...]}"""
                },
                {
                    "role": "user",
                    "content": f"Extract timeline events from this document:\n\n{text[:5000]}"
                }
            ],
            temperature=0.2,
            max_tokens=1500,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content.strip()
        parsed = json.loads(content)
        events = parsed.get("events", [])

        valid = []
        for ev in events:
            if isinstance(ev, dict) and "description" in ev:
                valid.append({
                    "date": ev.get("date"),
                    "approxDate": ev.get("approxDate"),
                    "description": ev["description"],
                    "entitiesInvolved": ev.get("entitiesInvolved", []),
                })
        return valid
    except Exception as e:
        print(f"Timeline extraction error: {e}")
        return []
