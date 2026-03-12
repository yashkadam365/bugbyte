"""AI Pipeline Orchestrator — Chains all 4 layers after evidence upload."""
from datetime import datetime
from bson import ObjectId

from database import (
    evidence_collection, claims_collection, entities_collection,
    relationships_collection, timeline_events_collection
)
from services.document_processor import extract_text
from services.summarizer import generate_summary, classify_credibility
from services.claim_extractor import extract_claims
from services.entity_extractor import extract_entities, extract_timeline_events
from services.contradiction import detect_contradictions
from services.dead_end import detect_dead_ends
from services.impact_ranker import calculate_impact_scores
from websocket_manager import ws_manager


async def run_pipeline(case_id: str, evidence_id: str):
    """Run the full 4-layer AI pipeline for a newly uploaded evidence document."""
    try:
        # Fetch the evidence document
        evidence = await evidence_collection.find_one({"_id": ObjectId(evidence_id)})
        if not evidence:
            return

        print(f"[Pipeline] Starting for evidence {evidence_id} in case {case_id}")

        # ============================================================
        # LAYER 1 — DOCUMENT MEMORY
        # ============================================================

        # Step 1: Text Extraction
        text = await extract_text(
            evidence["type"],
            evidence["content"],
            evidence["fileUrl"]
        )

        # Update evidence with extracted text
        await evidence_collection.update_one(
            {"_id": ObjectId(evidence_id)},
            {"$set": {"content": text}}
        )

        # Broadcast processing status
        await ws_manager.broadcast(case_id, {
            "type": "pipeline_progress",
            "evidenceId": evidence_id,
            "step": "text_extracted",
            "message": "Text extracted from document"
        })

        # Step 2: AI Summary
        summary = await generate_summary(text)
        await evidence_collection.update_one(
            {"_id": ObjectId(evidence_id)},
            {"$set": {"summary": summary}}
        )

        # Step 5: Source Credibility
        credibility = await classify_credibility(text)
        await evidence_collection.update_one(
            {"_id": ObjectId(evidence_id)},
            {"$set": {"credibility": credibility}}
        )

        await ws_manager.broadcast(case_id, {
            "type": "pipeline_progress",
            "evidenceId": evidence_id,
            "step": "summary_generated",
            "message": "Summary and credibility assessed"
        })

        # Step 3: Claim Extraction
        raw_claims = await extract_claims(text)
        claim_ids = []
        now = datetime.utcnow()

        for claim_data in raw_claims:
            claim_doc = {
                "caseId": case_id,
                "evidenceId": evidence_id,
                "statement": claim_data["statement"],
                "entities": claim_data.get("entities", []),
                "date": claim_data.get("date"),
                "confidence": claim_data.get("confidence", 0.5),
                "credibility": credibility,
                "contradictedBy": [],
                "corroboratedBy": [],
                "createdAt": now,
            }
            result = await claims_collection.insert_one(claim_doc)
            claim_ids.append(str(result.inserted_id))

        # Update evidence with claim IDs
        await evidence_collection.update_one(
            {"_id": ObjectId(evidence_id)},
            {"$set": {"claims": claim_ids}}
        )

        # Step 4: Entity Extraction
        raw_entities = await extract_entities(text)
        for entity_data in raw_entities:
            # Upsert entity (merge if same name exists)
            existing = await entities_collection.find_one({
                "caseId": case_id,
                "name": entity_data["name"]
            })
            if existing:
                await entities_collection.update_one(
                    {"_id": existing["_id"]},
                    {
                        "$inc": {"documentCount": 1},
                        "$set": {"noveltyScore": max(0, existing.get("noveltyScore", 1.0) - 0.15)},
                        "$addToSet": {"aliases": {"$each": entity_data.get("aliases", [])}}
                    }
                )
            else:
                await entities_collection.insert_one({
                    "caseId": case_id,
                    "name": entity_data["name"],
                    "type": entity_data.get("type", "unknown"),
                    "aliases": entity_data.get("aliases", []),
                    "documentCount": 1,
                    "noveltyScore": 1.0,
                    "createdAt": now,
                })

        # Create relationships between co-occurring entities
        entity_names = [e["name"] for e in raw_entities]
        for i in range(len(entity_names)):
            for j in range(i + 1, len(entity_names)):
                src = await entities_collection.find_one({"caseId": case_id, "name": entity_names[i]})
                tgt = await entities_collection.find_one({"caseId": case_id, "name": entity_names[j]})
                if src and tgt:
                    existing_rel = await relationships_collection.find_one({
                        "caseId": case_id,
                        "sourceEntityId": str(src["_id"]),
                        "targetEntityId": str(tgt["_id"]),
                    })
                    if not existing_rel:
                        await relationships_collection.insert_one({
                            "caseId": case_id,
                            "sourceEntityId": str(src["_id"]),
                            "targetEntityId": str(tgt["_id"]),
                            "sourceName": entity_names[i],
                            "targetName": entity_names[j],
                            "type": "co_occurrence",
                            "confidence": 0.6,
                            "createdAt": now,
                        })

        # Step 6: Timeline Event Extraction
        raw_events = await extract_timeline_events(text)
        for event_data in raw_events:
            await timeline_events_collection.insert_one({
                "caseId": case_id,
                "evidenceId": evidence_id,
                "date": event_data.get("date"),
                "approxDate": event_data.get("approxDate"),
                "description": event_data["description"],
                "entitiesInvolved": event_data.get("entitiesInvolved", []),
                "createdAt": now,
            })

        await ws_manager.broadcast(case_id, {
            "type": "pipeline_progress",
            "evidenceId": evidence_id,
            "step": "claims_entities_extracted",
            "message": f"Extracted {len(raw_claims)} claims, {len(raw_entities)} entities, {len(raw_events)} timeline events"
        })

        # ============================================================
        # LAYER 2 — CONTRADICTION DETECTION
        # ============================================================
        contradictions = await detect_contradictions(case_id, raw_claims)

        # Update claims with contradiction links
        for contradiction in contradictions:
            existing_id = contradiction.get("existingClaimId", "")
            new_idx = contradiction.get("newClaimIndex", 0)

            # Parse new claim index
            if isinstance(new_idx, str) and new_idx.startswith("NEW-"):
                new_idx = int(new_idx.replace("NEW-", ""))
            elif isinstance(new_idx, str):
                try:
                    new_idx = int(new_idx)
                except ValueError:
                    continue

            if 0 <= new_idx < len(claim_ids) and existing_id:
                new_claim_id = claim_ids[new_idx]
                # Link both claims
                await claims_collection.update_one(
                    {"_id": ObjectId(new_claim_id)},
                    {"$addToSet": {"contradictedBy": existing_id}}
                )
                try:
                    await claims_collection.update_one(
                        {"_id": ObjectId(existing_id)},
                        {"$addToSet": {"contradictedBy": new_claim_id}}
                    )
                except Exception:
                    pass

        if contradictions:
            await ws_manager.broadcast(case_id, {
                "type": "contradictions_found",
                "evidenceId": evidence_id,
                "count": len(contradictions),
                "contradictions": contradictions,
                "message": f"⚠️ {len(contradictions)} contradiction(s) detected!"
            })

        # ============================================================
        # LAYER 3 — DEAD END DETECTION
        # ============================================================
        signals = await detect_dead_ends(case_id)

        if signals:
            await ws_manager.broadcast(case_id, {
                "type": "health_updated",
                "signals": len(signals),
                "message": f"Investigation health: {len(signals)} signal(s) detected"
            })

        # ============================================================
        # LAYER 4 — EVIDENCE IMPACT RANKING
        # ============================================================
        await calculate_impact_scores(case_id)

        # Mark evidence as completed
        await evidence_collection.update_one(
            {"_id": ObjectId(evidence_id)},
            {"$set": {"status": "completed", "updatedAt": datetime.utcnow()}}
        )

        # Final broadcast
        await ws_manager.broadcast(case_id, {
            "type": "pipeline_complete",
            "evidenceId": evidence_id,
            "message": "AI analysis complete"
        })

        print(f"[Pipeline] Complete for evidence {evidence_id}")

    except Exception as e:
        print(f"[Pipeline] Error: {e}")
        # Mark as failed
        await evidence_collection.update_one(
            {"_id": ObjectId(evidence_id)},
            {"$set": {"status": "failed", "updatedAt": datetime.utcnow()}}
        )
        await ws_manager.broadcast(case_id, {
            "type": "pipeline_error",
            "evidenceId": evidence_id,
            "message": f"Pipeline error: {str(e)}"
        })
