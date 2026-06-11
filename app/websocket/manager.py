import asyncio
import json
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self._lock = asyncio.Lock()
        self.active_connections: dict[int, list[WebSocket]] = {}
        self.ship_subscribers: dict[int, set[int]] = {}
        self.cargo_subscribers: dict[int, set[int]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        async with self._lock:
            if user_id not in self.active_connections:
                self.active_connections[user_id] = []
            self.active_connections[user_id].append(websocket)
        logger.info("WebSocket connected: user_id=%d", user_id)

    def _clean_subscribers(self, user_id: int):
        for ship_id in list(self.ship_subscribers.keys()):
            self.ship_subscribers[ship_id].discard(user_id)
            if not self.ship_subscribers[ship_id]:
                del self.ship_subscribers[ship_id]
        for cargo_id in list(self.cargo_subscribers.keys()):
            self.cargo_subscribers[cargo_id].discard(user_id)
            if not self.cargo_subscribers[cargo_id]:
                del self.cargo_subscribers[cargo_id]

    async def disconnect(self, websocket: WebSocket, user_id: int):
        async with self._lock:
            if user_id in self.active_connections:
                try:
                    self.active_connections[user_id].remove(websocket)
                except ValueError:
                    pass
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
            self._clean_subscribers(user_id)
        logger.info("WebSocket disconnected: user_id=%d", user_id)

    async def _remove_dead(self, dead: list[tuple[int, WebSocket]]):
        if not dead:
            return
        async with self._lock:
            for user_id, ws in dead:
                if user_id in self.active_connections:
                    try:
                        self.active_connections[user_id].remove(ws)
                    except ValueError:
                        pass
                    if not self.active_connections[user_id]:
                        del self.active_connections[user_id]

    async def send_personal(self, user_id: int, message: dict[str, Any]):
        data = json.dumps(message, default=str)
        async with self._lock:
            connections = list(self.active_connections.get(user_id, []))
        dead = []
        for ws in connections:
            try:
                await ws.send_text(data)
            except Exception:
                dead.append((user_id, ws))
        await self._remove_dead(dead)

    async def broadcast(self, message: dict[str, Any]):
        data = json.dumps(message, default=str)
        async with self._lock:
            all_users = list(self.active_connections.items())
        dead = []
        for user_id, conns in all_users:
            for ws in conns[:]:
                try:
                    await ws.send_text(data)
                except Exception:
                    dead.append((user_id, ws))
        await self._remove_dead(dead)

    async def broadcast_ship_update(self, ship_id: int, message: dict[str, Any]):
        data = json.dumps(message, default=str)
        async with self._lock:
            subscribers = set(self.ship_subscribers.get(ship_id, set()))
        dead = []
        for user_id in subscribers:
            async with self._lock:
                conns = list(self.active_connections.get(user_id, []))
            for ws in conns:
                try:
                    await ws.send_text(data)
                except Exception:
                    dead.append((user_id, ws))
        await self._remove_dead(dead)

    async def broadcast_cargo_update(self, cargo_id: int, message: dict[str, Any]):
        data = json.dumps(message, default=str)
        async with self._lock:
            subscribers = set(self.cargo_subscribers.get(cargo_id, set()))
        dead = []
        for user_id in subscribers:
            async with self._lock:
                conns = list(self.active_connections.get(user_id, []))
            for ws in conns:
                try:
                    await ws.send_text(data)
                except Exception:
                    dead.append((user_id, ws))
        await self._remove_dead(dead)

    async def subscribe_ship(self, user_id: int, ship_id: int):
        async with self._lock:
            if ship_id not in self.ship_subscribers:
                self.ship_subscribers[ship_id] = set()
            self.ship_subscribers[ship_id].add(user_id)

    async def subscribe_cargo(self, user_id: int, cargo_id: int):
        async with self._lock:
            if cargo_id not in self.cargo_subscribers:
                self.cargo_subscribers[cargo_id] = set()
            self.cargo_subscribers[cargo_id].add(user_id)

    # New broadcast methods
    async def broadcast_weather_alert(self, port: str, message: dict):
        data = json.dumps(message, default=str)
        async with self._lock:
            all_users = list(self.active_connections.items())
        dead = []
        for user_id, conns in all_users:
            for ws in conns[:]:
                try:
                    await ws.send_text(data)
                except Exception:
                    dead.append((user_id, ws))
        await self._remove_dead(dead)

    async def broadcast_incident_update(self, incident_id: int, message: dict):
        data = json.dumps(message, default=str)
        async with self._lock:
            all_users = list(self.active_connections.items())
        dead = []
        for user_id, conns in all_users:
            for ws in conns[:]:
                try:
                    await ws.send_text(data)
                except Exception:
                    dead.append((user_id, ws))
        await self._remove_dead(dead)

    async def broadcast_ro_ro_update(self, vehicle_id: int, message: dict):
        data = json.dumps(message, default=str)
        async with self._lock:
            all_users = list(self.active_connections.items())
        dead = []
        for user_id, conns in all_users:
            for ws in conns[:]:
                try:
                    await ws.send_text(data)
                except Exception:
                    dead.append((user_id, ws))
        await self._remove_dead(dead)

    async def broadcast_berth_status(self, berth_id: int, message: dict):
        data = json.dumps(message, default=str)
        async with self._lock:
            all_users = list(self.active_connections.items())
        dead = []
        for user_id, conns in all_users:
            for ws in conns[:]:
                try:
                    await ws.send_text(data)
                except Exception:
                    dead.append((user_id, ws))
        await self._remove_dead(dead)


manager = ConnectionManager()
