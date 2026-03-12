from motor.motor_asyncio import AsyncIOMotorClient
from config import get_settings

settings = get_settings()

client = AsyncIOMotorClient(settings.mongodb_uri)
db = client[settings.database_name]

# Collections
cases_collection = db["cases"]
evidence_collection = db["evidence"]
claims_collection = db["claims"]
entities_collection = db["entities"]
relationships_collection = db["relationships"]
timeline_events_collection = db["timeline_events"]
investigation_health_collection = db["investigation_health"]


async def init_db():
    """Create indexes for optimal query performance."""
    await evidence_collection.create_index("caseId")
    await claims_collection.create_index("caseId")
    await claims_collection.create_index("evidenceId")
    await entities_collection.create_index("caseId")
    await entities_collection.create_index([("caseId", 1), ("name", 1)])
    await relationships_collection.create_index("caseId")
    await timeline_events_collection.create_index("caseId")
    await timeline_events_collection.create_index("date")
    await investigation_health_collection.create_index("caseId")
