from fastapi import APIRouter, HTTPException
from bson import ObjectId
from datetime import datetime
from database import cases_collection, evidence_collection
from models.case import CaseCreate, CaseUpdate, CaseResponse

router = APIRouter(prefix="/api/cases", tags=["cases"])


def serialize_case(case: dict) -> dict:
    case["_id"] = str(case["_id"])
    return case


@router.post("")
async def create_case(case: CaseCreate):
    now = datetime.utcnow()
    doc = {
        **case.model_dump(),
        "evidenceCount": 0,
        "createdAt": now,
        "updatedAt": now,
    }
    result = await cases_collection.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


@router.get("")
async def list_cases():
    cases = []
    cursor = cases_collection.find().sort("updatedAt", -1)
    async for case in cursor:
        # Count evidence
        count = await evidence_collection.count_documents({"caseId": str(case["_id"])})
        case["evidenceCount"] = count
        cases.append(serialize_case(case))
    return cases


@router.get("/{case_id}")
async def get_case(case_id: str):
    case = await cases_collection.find_one({"_id": ObjectId(case_id)})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    count = await evidence_collection.count_documents({"caseId": case_id})
    case["evidenceCount"] = count
    return serialize_case(case)


@router.put("/{case_id}")
async def update_case(case_id: str, updates: CaseUpdate):
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    update_data["updatedAt"] = datetime.utcnow()
    result = await cases_collection.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")
    case = await cases_collection.find_one({"_id": ObjectId(case_id)})
    return serialize_case(case)


@router.delete("/{case_id}")
async def delete_case(case_id: str):
    result = await cases_collection.delete_one({"_id": ObjectId(case_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")
    # Cleanup related data
    await evidence_collection.delete_many({"caseId": case_id})
    return {"message": "Case deleted"}
