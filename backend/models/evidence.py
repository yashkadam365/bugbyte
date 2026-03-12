from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class EvidenceCreate(BaseModel):
    type: str  # pdf, url, note, screenshot
    content: str = ""
    fileUrl: str = ""
    title: str = ""


class EvidenceResponse(BaseModel):
    id: str = Field(alias="_id")
    caseId: str
    type: str
    title: str
    content: str
    fileUrl: str
    summary: str
    credibility: str
    impactScore: float
    claims: list[str]
    status: str  # processing, completed, failed
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True
