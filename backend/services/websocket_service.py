from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, application_id: int, websocket: WebSocket):
        await websocket.accept()
        if application_id not in self.active_connections:
            self.active_connections[application_id] = []
        self.active_connections[application_id].append(websocket)

    def disconnect(self, application_id: int, websocket: WebSocket):
        self.active_connections[application_id].remove(websocket)
        if not self.active_connections[application_id]:
            del self.active_connections[application_id]

    async def send_status(self, application_id: int, message: dict):
        if application_id in self.active_connections:
            for connection in self.active_connections[application_id]:
                await connection.send_json(message)

manager = ConnectionManager()
