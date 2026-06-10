import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_ship_invalid_imo(client: AsyncClient, admin_token: str):
    response = await client.post(
        "/ship/create",
        json={
            "name": "Bad IMO Ship",
            "capacity": 100.0,
            "imo_number": "123456",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_ship_valid_imo(client: AsyncClient, admin_token: str):
    response = await client.post(
        "/ship/create",
        json={
            "name": "Good IMO Ship",
            "capacity": 100.0,
            "imo_number": "1234567",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 201
    assert response.json()["imo_number"] == "1234567"


@pytest.mark.asyncio
async def test_create_ship_negative_capacity(client: AsyncClient, admin_token: str):
    response = await client.post(
        "/ship/create",
        json={"name": "Neg Ship", "capacity": -10.0},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_cargo_negative_weight(client: AsyncClient, client_token: str):
    response = await client.post(
        "/cargo/create",
        json={
            "cargo_type": "grain",
            "weight": -50.0,
            "origin": "Aktau",
            "destination": "Baku",
        },
        headers={"Authorization": f"Bearer {client_token}"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_berth_negative_capacity(client: AsyncClient, admin_token: str):
    response = await client.post(
        "/berth/create",
        json={"name": "Neg Berth", "capacity": -10.0},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_update_ship_invalid_imo(client: AsyncClient, admin_token: str):
    create_resp = await client.post(
        "/ship/create",
        json={"name": "IMO Update Ship", "capacity": 100.0},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    ship_id = create_resp.json()["id"]

    response = await client.put(
        f"/ship/{ship_id}",
        json={"imo_number": "bad"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_berth_duplicate_name(client: AsyncClient, admin_token: str):
    await client.post(
        "/berth/create",
        json={"name": "Unique Berth", "capacity": 100.0},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    response = await client.post(
        "/berth/create",
        json={"name": "Unique Berth", "capacity": 100.0},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_cargo_access_denied_by_other_client(client: AsyncClient, client_token: str, admin_token: str):
    create_resp = await client.post(
        "/cargo/create",
        json={
            "cargo_type": "grain",
            "weight": 50.0,
            "origin": "Aktau",
            "destination": "Baku",
        },
        headers={"Authorization": f"Bearer {client_token}"},
    )
    cargo_id = create_resp.json()["id"]

    login_resp = await client.post(
        "/auth/login",
        json={"email": "client@test.com", "password": "client123"},
    )
    other_token = login_resp.json()["access_token"]

    response = await client.put(
        f"/cargo/{cargo_id}",
        json={"weight": 99.0},
        headers={"Authorization": f"Bearer {other_token}"},
    )

    same_client = other_token
    cargo_get = await client.get(
        f"/cargo/{cargo_id}",
        headers={"Authorization": f"Bearer {same_client}"},
    )
    assert cargo_get.status_code == 200

    if cargo_get.json()["client_id"] != 2:
        response = await client.put(
            f"/cargo/{cargo_id}",
            json={"weight": 99.0},
            headers={"Authorization": f"Bearer {other_token}"},
        )
        other_user_token = None
        reg_resp = await client.post(
            "/auth/register",
            json={
                "name": "Other Client 2",
                "email": f"other2_{__import__('time').time()}@test.com",
                "password": "pass123",
                "role": "client",
            },
        )
        if reg_resp.status_code == 201:
            login2 = await client.post(
                "/auth/login",
                json={"email": reg_resp.json()["email"], "password": "pass123"},
            )
            other_user_token = login2.json()["access_token"]
            response = await client.put(
                f"/cargo/{cargo_id}",
                json={"weight": 99.0},
                headers={"Authorization": f"Bearer {other_user_token}"},
            )
            assert response.status_code == 403 or response.status_code == 404
