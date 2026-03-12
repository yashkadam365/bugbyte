from fastapi import APIRouter
from database import investigation_health_collection

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/cases/{case_id}/health")
async def get_investigation_health(case_id: str):
    signals = []
    cursor = investigation_health_collection.find({"caseId": case_id}).sort("updatedAt", -1)
    async for signal in cursor:
        signal["_id"] = str(signal["_id"])
        signals.append(signal)
    return signals
