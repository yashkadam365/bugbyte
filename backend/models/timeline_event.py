from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TimelineEventCreate(BaseModel):
    caseId: str
    evidenceId: str
    date: Optional[str] = None
    approxDate: Optional[str] = None
    description: str
    entitiesInvolved: list[str] = []


class TimelineEventResponse(BaseModel):
    id: str = Field(alias="_id")
    caseId: str
    evidenceId: str
    date: Optional[str]
    approxDate: Optional[str]
    description: str
    entitiesInvolved: list[str]
    createdAt: datetime

    class Config:
        populate_by_name = True
