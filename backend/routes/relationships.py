from fastapi import APIRouter
from database import relationships_collection

router = APIRouter(prefix="/api", tags=["relationships"])


@router.get("/cases/{case_id}/relationships")
async def list_relationships(case_id: str):
    rels = []
    cursor = relationships_collection.find({"caseId": case_id})
    async for rel in cursor:
        rel["_id"] = str(rel["_id"])
        rels.append(rel)
    return rels
