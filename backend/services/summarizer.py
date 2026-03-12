"""AI Summarization service — Layer 1 Step 2."""
import json
from openai import AsyncOpenAI
from config import get_settings

settings = get_settings()
client = AsyncOpenAI(api_key=settings.openai_api_key)


async def generate_summary(text: str) -> str:
    """Generate a 3-line summary of the document text."""
    if not text or text.startswith("["):
        return "Unable to generate summary — no valid text content."

    try:
        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {
                    "role": "system",
                    "content": "You are an investigation analyst. Generate a concise 3-line summary of the following document. Focus on key facts, entities, and dates relevant to an investigation."
                },
                {
                    "role": "user",
                    "content": f"Summarize this document in exactly 3 lines:\n\n{text[:5000]}"
                }
            ],
            temperature=0.3,
            max_tokens=300,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Summary generation failed: {str(e)}"


async def classify_credibility(text: str) -> str:
    """Classify the source credibility of the document."""
    try:
        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {
                    "role": "system",
                    "content": """Classify the credibility of this document source. Respond with ONLY one of these words:
- primary (official records, firsthand accounts, legal docs, bank statements)
- secondary (news articles, reports, summaries by third parties)
- unverified (anonymous tips, social media, unverified notes)"""
                },
                {
                    "role": "user",
                    "content": text[:3000]
                }
            ],
            temperature=0.1,
            max_tokens=20,
        )
        result = response.choices[0].message.content.strip().lower()
        if result in ("primary", "secondary", "unverified"):
            return result
        return "unverified"
    except Exception:
        return "unverified"
