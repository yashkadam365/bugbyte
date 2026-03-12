"""NEXUS — Investigation Intelligence Platform — FastAPI Backend."""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import get_settings
from database import init_db
from websocket_manager import ws_manager

from routes.cases import router as cases_router
from routes.evidence import router as evidence_router
from routes.claims import router as claims_router
from routes.entities import router as entities_router
from routes.relationships import router as relationships_router
from routes.timeline import router as timeline_router
from routes.health import router as health_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    print("🔍 NEXUS Backend started — Database initialized")
    yield
    # Shutdown
    print("NEXUS Backend shutting down")


app = FastAPI(
    title="NEXUS — Investigation Intelligence Platform",
    description="AI-powered collaborative investigation platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(cases_router)
app.include_router(evidence_router)
app.include_router(claims_router)
app.include_router(entities_router)
app.include_router(relationships_router)
app.include_router(timeline_router)
app.include_router(health_router)


@app.get("/")
async def root():
    return {
        "name": "NEXUS API",
        "version": "1.0.0",
        "status": "operational",
    }


@app.get("/api/health")
async def api_health():
    return {"status": "healthy"}


@app.websocket("/ws/{case_id}")
async def websocket_endpoint(websocket: WebSocket, case_id: str):
    await ws_manager.connect(websocket, case_id)
    try:
        while True:
            # Keep connection alive, receive any client messages
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, case_id)
