"""Dead end detection service — Layer 3."""
from datetime import datetime
from database import (
    evidence_collection, claims_collection, entities_collection,
    relationships_collection, investigation_health_collection
)


async def detect_dead_ends(case_id: str):
    """Analyze investigation health and detect dead ends.
    
    Signals:
    1. Exhausted Lead — entity with many docs but no new facts
    2. Blind Spot — entities appearing together but relationship not investigated
    3. Circular Investigation — repeated analysis of same entities
    """
    now = datetime.utcnow()
    signals = []

    # --- 1. Exhausted Lead Detection ---
    entity_doc_counts = {}
    cursor = entities_collection.find({"caseId": case_id})
    async for entity in cursor:
        name = entity["name"]
        entity_id = str(entity["_id"])
        doc_count = entity.get("documentCount", 0)
        entity_doc_counts[entity_id] = {
            "name": name,
            "docCount": doc_count,
            "noveltyScore": entity.get("noveltyScore", 1.0),
        }

    for entity_id, info in entity_doc_counts.items():
        if info["docCount"] >= 5 and info["noveltyScore"] < 0.2:
            signals.append({
                "caseId": case_id,
                "entityId": entity_id,
                "status": "exhausted_lead",
                "docsAdded": info["docCount"],
                "newFactsRecent": 0,
                "description": f"Entity '{info['name']}' has {info['docCount']} documents but recent ones produced no new facts. This lead may be exhausted.",
                "createdAt": now,
                "updatedAt": now,
            })

    # --- 2. Blind Spot Detection ---
    # Find entity pairs that co-occur in claims but have no relationship
    entity_cooccurrence = {}
    claims_cursor = claims_collection.find({"caseId": case_id})
    async for claim in claims_cursor:
        ents = claim.get("entities", [])
        for i in range(len(ents)):
            for j in range(i + 1, len(ents)):
                pair = tuple(sorted([ents[i], ents[j]]))
                entity_cooccurrence[pair] = entity_cooccurrence.get(pair, 0) + 1

    # Check which pairs have no explicit relationship
    existing_rels = set()
    rels_cursor = relationships_collection.find({"caseId": case_id})
    async for rel in rels_cursor:
        pair = tuple(sorted([rel["sourceEntityId"], rel["targetEntityId"]]))
        existing_rels.add(pair)

    for pair, count in entity_cooccurrence.items():
        if count >= 3 and pair not in existing_rels:
            signals.append({
                "caseId": case_id,
                "entityId": None,
                "status": "blind_spot",
                "docsAdded": count,
                "newFactsRecent": 0,
                "description": f"Entities '{pair[0]}' and '{pair[1]}' appear together in {count} claims but their relationship hasn't been investigated.",
                "createdAt": now,
                "updatedAt": now,
            })

    # --- 3. Circular Investigation ---
    total_evidence = await evidence_collection.count_documents({"caseId": case_id})
    if total_evidence >= 6:
        # Check if recent documents reference the same entities as older ones
        recent_cursor = evidence_collection.find({"caseId": case_id}).sort("createdAt", -1).limit(5)
        recent_entities = set()
        async for ev in recent_cursor:
            claims_for_ev = claims_collection.find({"evidenceId": str(ev["_id"])})
            async for claim in claims_for_ev:
                for ent in claim.get("entities", []):
                    recent_entities.add(ent)

        if len(recent_entities) <= 2 and total_evidence >= 8:
            signals.append({
                "caseId": case_id,
                "entityId": None,
                "status": "circular_investigation",
                "docsAdded": total_evidence,
                "newFactsRecent": len(recent_entities),
                "description": f"Last {min(5, total_evidence)} documents reference only {len(recent_entities)} unique entities. Investigation may be looping.",
                "createdAt": now,
                "updatedAt": now,
            })

    # Clear old signals for this case and store new ones
    await investigation_health_collection.delete_many({"caseId": case_id})
    if signals:
        await investigation_health_collection.insert_many(signals)

    return signals
