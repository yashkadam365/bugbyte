from fastapi import APIRouter
from database import claims_collection

router = APIRouter(prefix="/api", tags=["claims"])


@router.get("/cases/{case_id}/claims")
async def list_claims(case_id: str):
    claims = []
    cursor = claims_collection.find({"caseId": case_id}).sort("createdAt", -1)
    async for claim in cursor:
        claim["_id"] = str(claim["_id"])
        claims.append(claim)
    return claims


@router.get("/evidence/{evidence_id}/claims")
async def get_claims_for_evidence(evidence_id: str):
    claims = []
    cursor = claims_collection.find({"evidenceId": evidence_id}).sort("createdAt", -1)
    async for claim in cursor:
        claim["_id"] = str(claim["_id"])
        claims.append(claim)
    return claims
