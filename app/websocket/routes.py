import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status

from app.core.security import decode_access_token
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
                    await manager.broadcast_ship_update(
                        ship_id,
                        {
                            "type": "location_updated",
                            "ship_id": ship_id,
                            "lat": lat,
                            "lng": lng,
                        },
                    )

            elif msg_type == "subscribe_ship":
                ship_id = data.get("ship_id")
                if ship_id:
                    manager.subscribe_ship(user_id, ship_id)
                    await manager.send_personal(
                        user_id,
                        {"type": "subscribed", "entity": "ship", "id": ship_id},
                    )

            elif msg_type == "subscribe_cargo":
                cargo_id = data.get("cargo_id")
                if cargo_id:
                    manager.subscribe_cargo(user_id, cargo_id)
                    await manager.send_personal(
                        user_id,
                        {"type": "subscribed", "entity": "cargo", "id": cargo_id},
                    )

            else:
                await manager.send_personal(
                    user_id, {"type": "error", "message": f"Unknown type: {msg_type}"}
                )

    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.error("WebSocket error for user %d: %s", user_id, str(e))
        manager.disconnect(websocket, user_id)
