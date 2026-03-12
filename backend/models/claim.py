from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ClaimCreate(BaseModel):
    caseId: str
    evidenceId: str
    statement: str
    entities: list[str] = []
    date: Optional[str] = None
    confidence: float = 0.5
    credibility: str = "unverified"


class ClaimResponse(BaseModel):
    id: str = Field(alias="_id")
    caseId: str
    evidenceId: str
    statement: str
    entities: list[str]
    date: Optional[str]
    confidence: float
    credibility: str
    contradictedBy: list[str]
    corroboratedBy: list[str]
    createdAt: datetime

    class Config:
        populate_by_name = True
