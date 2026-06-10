import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_cargo(client: AsyncClient, client_token: str):
    response = await client.post(
        "/cargo/create",
        json={
            "cargo_type": "grain",
            "weight": 50.0,
            "origin": "Aktau",
            "destination": "Baku",
        },
        headers={"Authorization": f"Bearer {client_token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["cargo_type"] == "grain"
    assert data["weight"] == 50.0
    assert data["status"] == "created"
    assert data["origin"] == "Aktau"
    assert data["destination"] == "Baku"


@pytest.mark.asyncio
async def test_get_cargo(client: AsyncClient, client_token: str):
    create_resp = await client.post(
        "/cargo/create",
        json={
            "cargo_type": "oil",
            "weight": 100.0,
            "origin": "Aktau",
            "destination": "Istanbul",
        },
        headers={"Authorization": f"Bearer {client_token}"},
    )
    cargo_id = create_resp.json()["id"]

    response = await client.get(
        f"/cargo/{cargo_id}",
        headers={"Authorization": f"Bearer {client_token}"},
    )
    assert response.status_code == 200
    assert response.json()["cargo_type"] == "oil"


@pytest.mark.asyncio
async def test_cargo_access_denied(client: AsyncClient, client_token: str, admin_token: str):
    create_resp = await client.post(
        "/cargo/create",
        json={
            "cargo_type": "steel",
            "weight": 200.0,
            "origin": "Aktau",
            "destination": "Tehran",
        },
        headers={"Authorization": f"Bearer {client_token}"},
    )
    cargo_id = create_resp.json()["id"]

    other_user_token = None
    reg_resp = await client.post(
        "/auth/register",
        json={
            "name": "Other Client",
            "email": "other@test.com",
            "password": "pass123",
            "role": "client",
        },
    )
    if reg_resp.status_code == 201:
        login_resp = await client.post(
            "/auth/login",
            json={"email": "other@test.com", "password": "pass123"},
        )
        other_user_token = login_resp.json()["access_token"]
        response = await client.get(
            f"/cargo/{cargo_id}",
            headers={"Authorization": f"Bearer {other_user_token}"},
        )
        assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_cargo_status(client: AsyncClient, client_token: str, admin_token: str):
    create_resp = await client.post(
        "/cargo/create",
        json={
            "cargo_type": "grain",
            "weight": 75.0,
            "origin": "Aktau",
            "destination": "Baku",
        },
        headers={"Authorization": f"Bearer {client_token}"},
    )
    cargo_id = create_resp.json()["id"]

    response = await client.patch(
        f"/cargo/{cargo_id}/status",
        json={"status": "approved", "notes": "Approved by admin"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "approved"
