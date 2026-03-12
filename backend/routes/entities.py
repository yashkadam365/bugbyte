from fastapi import APIRouter
from database import entities_collection

router = APIRouter(prefix="/api", tags=["entities"])


@router.get("/cases/{case_id}/entities")
async def list_entities(case_id: str):
    entities = []
    cursor = entities_collection.find({"caseId": case_id}).sort("documentCount", -1)
    async for entity in cursor:
        entity["_id"] = str(entity["_id"])
        entities.append(entity)
    return entities
