import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status

from app.core.database import async_session_factory
from app.core.security import decode_access_token
from app.services import ship_service
from app.websocket.manager import manager

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    payload = decode_access_token(token)
    if payload is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = int(payload.get("sub", 0))
    await manager.connect(websocket, user_id)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await manager.send_personal(
                    user_id, {"type": "error", "message": "Invalid JSON"}
                )
                continue

            msg_type = data.get("type")

            if msg_type == "location_update":
                ship_id = data.get("ship_id")
                lat = data.get("lat")
                lng = data.get("lng")
                if ship_id and lat is not None and lng is not None:
                    async with async_session_factory() as ws_session:
                        updated = await ship_service.update_ship_location(
                            ws_session, ship_id, lat, lng
                        )
                        if updated:
                            await ws_session.commit()
                            await manager.broadcast_ship_update(
                                ship_id,
                                {
                                    "type": "location_updated",
                                    "ship_id": ship_id,
                                    "lat": lat,
                                    "lng": lng,
                                },
                            )
                    if not updated:
                        await manager.send_personal(
                            user_id,
                            {"type": "error", "message": f"Ship {ship_id} not found"},
                        )

            elif msg_type == "subscribe_ship":
                ship_id = data.get("ship_id")
                if ship_id:
                    async with async_session_factory() as ws_session:
                        ship = await ship_service.get_ship(ws_session, ship_id)
                        if ship:
                            await manager.subscribe_ship(user_id, ship_id)
                            await manager.send_personal(
                                user_id,
                                {"type": "subscribed", "entity": "ship", "id": ship_id},
                            )
                        else:
                            await manager.send_personal(
                                user_id,
                                {"type": "error", "message": f"Ship {ship_id} not found"},
                            )

            elif msg_type == "subscribe_cargo":
                cargo_id = data.get("cargo_id")
                if cargo_id:
                    async with async_session_factory() as ws_session:
                        from app.services import cargo_service
                        cargo = await cargo_service.get_cargo(ws_session, cargo_id)
                        if cargo:
                            await manager.subscribe_cargo(user_id, cargo_id)
                            await manager.send_personal(
                                user_id,
                                {"type": "subscribed", "entity": "cargo", "id": cargo_id},
                            )
                        else:
                            await manager.send_personal(
                                user_id,
                                {"type": "error", "message": f"Cargo {cargo_id} not found"},
                            )

            elif msg_type == "chat_message":
                to_user_id = data.get("to_user_id")
                text = data.get("text", "")
                deal_id = data.get("deal_id")
                if to_user_id and text:
                    chat_payload = {
                        "type": "chat_message",
                        "from_user_id": user_id,
                        "text": text,
                        "deal_id": deal_id,
                        "timestamp": data.get("timestamp", ""),
                    }
                    await manager.send_personal(to_user_id, chat_payload)
                    await manager.send_personal(
                        user_id, {**chat_payload, "status": "delivered"}
                    )
                else:
                    await manager.send_personal(
                        user_id,
                        {"type": "error", "message": "chat_message requires to_user_id and text"},
                    )

            elif msg_type == "deal_update":
                deal_id = data.get("deal_id")
                action = data.get("action")
                to_user_id = data.get("to_user_id")
                payload = data.get("payload", {})
                if deal_id and to_user_id:
                    await manager.send_personal(
                        to_user_id,
                        {
                            "type": "deal_update",
                            "deal_id": deal_id,
                            "action": action,
                            "payload": payload,
                            "from_user_id": user_id,
                        },
                    )

            elif msg_type == "subscribe_incidents":
                port = data.get("port")
                if port:
                    await manager.send_personal(
                        user_id,
                        {"type": "subscribed", "entity": "incidents", "port": port},
                    )

            elif msg_type == "subscribe_weather":
                port = data.get("port")
                if port:
                    await manager.send_personal(
                        user_id,
                        {"type": "subscribed", "entity": "weather", "port": port},
                    )

            elif msg_type == "subscribe_berths":
                port = data.get("port")
                if port:
                    await manager.send_personal(
                        user_id,
                        {"type": "subscribed", "entity": "berths", "port": port},
                    )

            else:
                await manager.send_personal(
                    user_id, {"type": "error", "message": f"Unknown type: {msg_type}"}
                )

    except WebSocketDisconnect:
        await manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.error("WebSocket error for user %d: %s", user_id, str(e))
        await manager.disconnect(websocket, user_id)
