from fastapi import WebSocket
from typing import Dict, Set
import json


class WebSocketManager:
    """Manages WebSocket connections per case for real-time updates."""

    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, case_id: str):
        await websocket.accept()
        if case_id not in self.active_connections:
            self.active_connections[case_id] = set()
        self.active_connections[case_id].add(websocket)

    def disconnect(self, websocket: WebSocket, case_id: str):
        if case_id in self.active_connections:
            self.active_connections[case_id].discard(websocket)
            if not self.active_connections[case_id]:
                del self.active_connections[case_id]

    async def broadcast(self, case_id: str, message: dict):
        if case_id in self.active_connections:
            dead = set()
            for ws in self.active_connections[case_id]:
                try:
                    await ws.send_json(message)
                except Exception:
                    dead.add(ws)
            for ws in dead:
                self.active_connections[case_id].discard(ws)


ws_manager = WebSocketManager()
