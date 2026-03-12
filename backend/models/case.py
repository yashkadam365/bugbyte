from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CaseCreate(BaseModel):
    title: str
    description: str = ""
    status: str = "active"
    tags: list[str] = []
    createdBy: str = "investigator"
    collaborators: list[str] = []


class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[list[str]] = None
    collaborators: Optional[list[str]] = None


class CaseResponse(BaseModel):
    id: str = Field(alias="_id")
    title: str
    description: str
    status: str
    tags: list[str]
    createdBy: str
    collaborators: list[str]
    evidenceCount: int = 0
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True
