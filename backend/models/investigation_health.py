from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class InvestigationHealthCreate(BaseModel):
    caseId: str
    entityId: Optional[str] = None
    status: str  # exhausted_lead, blind_spot, circular_investigation
    docsAdded: int = 0
    newFactsRecent: int = 0
    description: str = ""


class InvestigationHealthResponse(BaseModel):
    id: str = Field(alias="_id")
    caseId: str
    entityId: Optional[str]
    status: str
    docsAdded: int
    newFactsRecent: int
    description: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True
