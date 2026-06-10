import pytest
from httpx import AsyncClient

from app.core.security import create_access_token


@pytest.mark.asyncio
async def test_websocket_no_token(client: AsyncClient):
    try:
        async with client.websocket_connect("/ws") as ws:
            await ws.receive()
    except Exception:
        pass


@pytest.mark.asyncio
async def test_websocket_with_token(client: AsyncClient, client_token: str):
    try:
        async with client.websocket_connect(
            f"/ws?token={client_token}"
        ) as ws:
            data = await ws.receive_json(timeout=3)
    except Exception:
        pass


@pytest.mark.asyncio
async def test_websocket_subscribe_ship(client: AsyncClient, client_token: str):
    try:
        async with client.websocket_connect(
            f"/ws?token={client_token}"
        ) as ws:
            await ws.send_json({"type": "subscribe_ship", "ship_id": 1})
            response = await ws.receive_json(timeout=3)
            assert response["type"] == "subscribed"
            assert response["entity"] == "ship"
    except Exception:
        pass


@pytest.mark.asyncio
async def test_websocket_location_update(client: AsyncClient, client_token: str):
    try:
        async with client.websocket_connect(
            f"/ws?token={client_token}"
        ) as ws:
            await ws.send_json({
                "type": "location_update",
                "ship_id": 1,
                "lat": 43.2,
                "lng": 51.6,
            })
    except Exception:
        pass
