from fastapi import APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks
from bson import ObjectId
from datetime import datetime
from database import evidence_collection, cases_collection
from models.evidence import EvidenceCreate
from services.ai_pipeline import run_pipeline
import os
import aiofiles
from config import get_settings

router = APIRouter(prefix="/api", tags=["evidence"])
settings = get_settings()


def serialize_evidence(ev: dict) -> dict:
    ev["_id"] = str(ev["_id"])
    return ev


@router.post("/cases/{case_id}/evidence")
async def upload_evidence(
    case_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile | None = File(None),
    type: str = Form("note"),
    content: str = Form(""),
    title: str = Form(""),
    url: str = Form(""),
):
    # Verify case exists
    case = await cases_collection.find_one({"_id": ObjectId(case_id)})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    file_url = ""
    evidence_content = content

    # Handle file upload
    if file:
        os.makedirs(settings.upload_dir, exist_ok=True)
        file_path = os.path.join(settings.upload_dir, f"{case_id}_{file.filename}")
        async with aiofiles.open(file_path, "wb") as f:
            data = await file.read()
            await f.write(data)
        file_url = file_path
        if not title:
            title = file.filename

    # Handle URL input
    if type == "url" and url:
        evidence_content = url
        if not title:
            title = url[:80]

    if not title:
        title = f"Evidence {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}"

    now = datetime.utcnow()
    doc = {
        "caseId": case_id,
        "type": type,
        "title": title,
        "content": evidence_content,
        "fileUrl": file_url,
        "summary": "",
        "credibility": "unverified",
        "impactScore": 0.0,
        "claims": [],
        "status": "processing",
        "createdAt": now,
        "updatedAt": now,
    }
    result = await evidence_collection.insert_one(doc)
    evidence_id = str(result.inserted_id)
    doc["_id"] = evidence_id

    # Update case timestamp
    await cases_collection.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": {"updatedAt": now}}
    )

    # Run AI pipeline in background
    background_tasks.add_task(run_pipeline, case_id, evidence_id)

    return doc


@router.get("/cases/{case_id}/evidence")
async def list_evidence(case_id: str):
    evidence_list = []
    cursor = evidence_collection.find({"caseId": case_id}).sort("createdAt", -1)
    async for ev in cursor:
        evidence_list.append(serialize_evidence(ev))
    return evidence_list


@router.get("/evidence/{evidence_id}")
async def get_evidence(evidence_id: str):
    ev = await evidence_collection.find_one({"_id": ObjectId(evidence_id)})
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence not found")
    return serialize_evidence(ev)


@router.delete("/evidence/{evidence_id}")
async def delete_evidence(evidence_id: str):
    ev = await evidence_collection.find_one({"_id": ObjectId(evidence_id)})
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence not found")
    await evidence_collection.delete_one({"_id": ObjectId(evidence_id)})
    return {"message": "Evidence deleted"}
