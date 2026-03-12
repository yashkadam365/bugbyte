"""Document text extraction service — handles PDF, URL, notes, screenshots."""
import os
from PyPDF2 import PdfReader
import requests
from bs4 import BeautifulSoup


async def extract_text(evidence_type: str, content: str, file_url: str) -> str:
    """Extract plain text from the evidence source."""
    try:
        if evidence_type == "pdf" and file_url:
            return extract_from_pdf(file_url)
        elif evidence_type == "url":
            return extract_from_url(content)
        elif evidence_type == "note":
            return content
        elif evidence_type == "screenshot":
            # For hackathon demo, screenshots are treated as notes with OCR placeholder
            return content or "[Screenshot uploaded — OCR not implemented in demo]"
        else:
            return content
    except Exception as e:
        return f"[Text extraction error: {str(e)}]. Original content: {content}"


def extract_from_pdf(file_path: str) -> str:
    """Extract text from a PDF file."""
    if not os.path.exists(file_path):
        return "[PDF file not found]"
    reader = PdfReader(file_path)
    text_parts = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            text_parts.append(text)
    return "\n".join(text_parts) if text_parts else "[No text extracted from PDF]"


def extract_from_url(url: str) -> str:
    """Extract text from a URL via web scraping."""
    try:
        resp = requests.get(url, timeout=15, headers={
            "User-Agent": "NEXUS-Investigator/1.0"
        })
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        # Remove scripts and styles
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()

        text = soup.get_text(separator="\n", strip=True)
        # Truncate to 10k chars for LLM context
        return text[:10000] if len(text) > 10000 else text
    except Exception as e:
        return f"[URL extraction error: {str(e)}]"
