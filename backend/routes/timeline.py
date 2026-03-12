from fastapi import APIRouter
from database import timeline_events_collection

router = APIRouter(prefix="/api", tags=["timeline"])


@router.get("/cases/{case_id}/timeline")
async def list_timeline_events(case_id: str):
    events = []
    cursor = timeline_events_collection.find({"caseId": case_id}).sort("date", 1)
    async for event in cursor:
        event["_id"] = str(event["_id"])
        events.append(event)
    return events
