import pytest
from starlette.testclient import TestClient

from app.core.security import create_access_token
from app.main import app


@pytest.mark.xfail(reason="Requires Redis to be running")
def test_websocket_no_token():
    client = TestClient(app)
    with client.websocket_connect("/ws") as ws:
        data = ws.receive()
        assert data is not None


@pytest.mark.xfail(reason="Requires Redis to be running")
def test_websocket_with_token():
    client = TestClient(app)
    token = create_access_token({"sub": "1", "role": "client"})
    with client.websocket_connect(f"/ws?token={token}") as ws:
        data = ws.receive_json()
        assert data is not None


@pytest.mark.xfail(reason="Requires Redis to be running")
def test_websocket_subscribe_ship():
    client = TestClient(app)
    token = create_access_token({"sub": "1", "role": "client"})
    with client.websocket_connect(f"/ws?token={token}") as ws:
        ws.send_json({"type": "subscribe_ship", "ship_id": 1})
        response = ws.receive_json()
        assert response["type"] == "subscribed"
        assert response["entity"] == "ship"


@pytest.mark.xfail(reason="Requires Redis to be running")
def test_websocket_location_update():
    client = TestClient(app)
    admin_token = create_access_token({"sub": "2", "role": "admin"})
    ship_resp = client.post(
        "/ship/create",
        json={"name": "WS Test Ship", "capacity": 100.0},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert ship_resp.status_code == 201
    ship_id = ship_resp.json()["id"]

    user_token = create_access_token({"sub": "3", "role": "client"})
    with client.websocket_connect(f"/ws?token={user_token}") as ws:
        ws.send_json({
            "type": "location_update",
            "ship_id": ship_id,
            "lat": 43.2,
            "lng": 51.6,
        })
