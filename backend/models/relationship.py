from pydantic import BaseModel, Field
from datetime import datetime


class RelationshipCreate(BaseModel):
    caseId: str
    sourceEntityId: str
    targetEntityId: str
    type: str
    confidence: float = 0.5


class RelationshipResponse(BaseModel):
    id: str = Field(alias="_id")
    caseId: str
    sourceEntityId: str
    targetEntityId: str
    type: str
    confidence: float
    createdAt: datetime

    class Config:
        populate_by_name = True
