"""Evidence impact ranking service — Layer 4."""
from database import evidence_collection, claims_collection, entities_collection, relationships_collection


async def calculate_impact_scores(case_id: str):
    """Recalculate impact scores for all evidence in a case.
    
    Score (0-100) based on:
    - Unique facts contributed (30%)
    - Cross-document connections created (25%)
    - Source credibility (20%)
    - Contradiction or corroboration power (15%)
    - Entity coverage (10%)
    """
    # Get all evidence for the case
    evidence_list = []
    cursor = evidence_collection.find({"caseId": case_id})
    async for ev in cursor:
        evidence_list.append(ev)

    if not evidence_list:
        return

    # Get total entities in case
    total_entities = await entities_collection.count_documents({"caseId": case_id})
    total_relationships = await relationships_collection.count_documents({"caseId": case_id})

    for ev in evidence_list:
        ev_id = str(ev["_id"])
        score = 0.0

        # 1. Unique facts — claims count (30%)
        claim_count = await claims_collection.count_documents({"evidenceId": ev_id})
        fact_score = min(claim_count / 5.0, 1.0) * 30  # 5+ claims = max
        score += fact_score

        # 2. Cross-document connections (25%)
        # Count how many claims reference entities that appear in other docs
        ev_claims = []
        claims_cursor = claims_collection.find({"evidenceId": ev_id})
        async for claim in claims_cursor:
            ev_claims.append(claim)

        connection_count = 0
        for claim in ev_claims:
            for entity_name in claim.get("entities", []):
                # Check if entity appears in other evidence claims
                other_count = await claims_collection.count_documents({
                    "caseId": case_id,
                    "evidenceId": {"$ne": ev_id},
                    "entities": entity_name
                })
                if other_count > 0:
                    connection_count += 1

        connection_score = min(connection_count / 8.0, 1.0) * 25
        score += connection_score

        # 3. Source credibility (20%)
        cred = ev.get("credibility", "unverified")
        cred_map = {"primary": 20, "secondary": 12, "unverified": 5}
        score += cred_map.get(cred, 5)

        # 4. Contradiction/corroboration power (15%)
        contradiction_count = 0
        corroboration_count = 0
        for claim in ev_claims:
            contradicted = claim.get("contradictedBy", [])
            corroborated = claim.get("corroboratedBy", [])
            contradiction_count += len(contradicted)
            corroboration_count += len(corroborated)
        power = contradiction_count + corroboration_count
        power_score = min(power / 4.0, 1.0) * 15
        score += power_score

        # 5. Entity coverage (10%)
        ev_entities = set()
        for claim in ev_claims:
            for ent in claim.get("entities", []):
                ev_entities.add(ent)
        if total_entities > 0:
            coverage = len(ev_entities) / total_entities
            score += min(coverage, 1.0) * 10
        else:
            score += 5  # Default if no entities yet

        # Clamp to 0-100
        score = max(0, min(100, round(score, 1)))

        # Update evidence document
        await evidence_collection.update_one(
            {"_id": ev["_id"]},
            {"$set": {"impactScore": score}}
        )
