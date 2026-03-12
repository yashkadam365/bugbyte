from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class EntityCreate(BaseModel):
    caseId: str
    name: str
    type: str  # person, organization, location, date, event
    aliases: list[str] = []


class EntityResponse(BaseModel):
    id: str = Field(alias="_id")
    caseId: str
    name: str
    type: str
    aliases: list[str]
    documentCount: int
    noveltyScore: float
    createdAt: datetime

    class Config:
        populate_by_name = True
