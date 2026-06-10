import json
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, list[WebSocket]] = {}
        self.ship_subscribers: dict[int, set[int]] = {}
        self.cargo_subscribers: dict[int, set[int]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info("WebSocket connected: user_id=%d", user_id)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            try:
                self.active_connections[user_id].remove(websocket)
            except ValueError:
                pass
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info("WebSocket disconnected: user_id=%d", user_id)

    async def send_personal(self, user_id: int, message: dict[str, Any]):
        if user_id not in self.active_connections:
            return
        data = json.dumps(message, default=str)
        dead = []
        for ws in self.active_connections[user_id]:
            try:
                await ws.send_text(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, user_id)

    async def broadcast(self, message: dict[str, Any]):
        data = json.dumps(message, default=str)
        for user_id in list(self.active_connections.keys()):
            dead = []
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_text(data)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self.disconnect(ws, user_id)

    async def broadcast_ship_update(self, ship_id: int, message: dict[str, Any]):
        data = json.dumps(message, default=str)
        for user_id in list(self.active_connections.keys()):
            if user_id in self.ship_subscribers.get(ship_id, set()):
                dead = []
                for ws in self.active_connections.get(user_id, []):
                    try:
                        await ws.send_text(data)
                    except Exception:
                        dead.append(ws)
                for ws in dead:
                    self.disconnect(ws, user_id)

    async def broadcast_cargo_update(self, cargo_id: int, message: dict[str, Any]):
        data = json.dumps(message, default=str)
        for user_id in list(self.active_connections.keys()):
            if user_id in self.cargo_subscribers.get(cargo_id, set()):
                dead = []
                for ws in self.active_connections.get(user_id, []):
                    try:
                        await ws.send_text(data)
                    except Exception:
                        dead.append(ws)
                for ws in dead:
                    self.disconnect(ws, user_id)

    def subscribe_ship(self, user_id: int, ship_id: int):
        if ship_id not in self.ship_subscribers:
            self.ship_subscribers[ship_id] = set()
        self.ship_subscribers[ship_id].add(user_id)

    def subscribe_cargo(self, user_id: int, cargo_id: int):
        if cargo_id not in self.cargo_subscribers:
            self.cargo_subscribers[cargo_id] = set()
        self.cargo_subscribers[cargo_id].add(user_id)


manager = ConnectionManager()
