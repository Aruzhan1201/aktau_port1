import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_update_cargo(client: AsyncClient, client_token: str):
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

    update_resp = await client.put(
        f"/cargo/{cargo_id}",
        json={"weight": 75.0, "destination": "Istanbul"},
        headers={"Authorization": f"Bearer {client_token}"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["weight"] == 75.0
    assert update_resp.json()["destination"] == "Istanbul"


@pytest.mark.asyncio
async def test_delete_cargo(client: AsyncClient, client_token: str):
    create_resp = await client.post(
        "/cargo/create",
        json={
            "cargo_type": "oil",
            "weight": 100.0,
            "origin": "Aktau",
            "destination": "Baku",
        },
        headers={"Authorization": f"Bearer {client_token}"},
    )
    cargo_id = create_resp.json()["id"]

    delete_resp = await client.delete(
        f"/cargo/{cargo_id}",
        headers={"Authorization": f"Bearer {client_token}"},
    )
    assert delete_resp.status_code == 200
    assert delete_resp.json()["status"] == "cancelled"


@pytest.mark.asyncio
async def test_update_ship(client: AsyncClient, admin_token: str):
    create_resp = await client.post(
        "/ship/create",
        json={"name": "Updatable Ship", "capacity": 100.0},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    ship_id = create_resp.json()["id"]

    update_resp = await client.put(
        f"/ship/{ship_id}",
        json={"name": "Updated Ship", "capacity": 200.0},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["name"] == "Updated Ship"
    assert update_resp.json()["capacity"] == 200.0


@pytest.mark.asyncio
async def test_delete_ship(client: AsyncClient, admin_token: str):
    create_resp = await client.post(
        "/ship/create",
        json={"name": "Deletable Ship", "capacity": 100.0},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    ship_id = create_resp.json()["id"]

    delete_resp = await client.delete(
        f"/ship/{ship_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert delete_resp.status_code == 200
    assert delete_resp.json()["name"] == "Deletable Ship"


@pytest.mark.asyncio
async def test_update_berth(client: AsyncClient, admin_token: str):
    create_resp = await client.post(
        "/berth/create",
        json={"name": "Updatable Berth", "capacity": 100.0},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    berth_id = create_resp.json()["id"]

    update_resp = await client.put(
        f"/berth/{berth_id}",
        json={"name": "Updated Berth", "capacity": 200.0},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["name"] == "Updated Berth"
    assert update_resp.json()["capacity"] == 200.0


@pytest.mark.asyncio
async def test_delete_berth(client: AsyncClient, admin_token: str):
    create_resp = await client.post(
        "/berth/create",
        json={"name": "Deletable Berth", "capacity": 100.0},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    berth_id = create_resp.json()["id"]

    delete_resp = await client.delete(
        f"/berth/{berth_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert delete_resp.status_code == 200
    assert delete_resp.json()["name"] == "Deletable Berth"


@pytest.mark.asyncio
async def test_update_company(client: AsyncClient, admin_token: str):
    create_resp = await client.post(
        "/company/create",
        json={"name": "Test Company"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    company_id = create_resp.json()["id"]

    update_resp = await client.put(
        f"/company/{company_id}",
        json={"name": "Updated Company"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["name"] == "Updated Company"


@pytest.mark.asyncio
async def test_delete_company(client: AsyncClient, admin_token: str):
    create_resp = await client.post(
        "/company/create",
        json={"name": "Deletable Company"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    company_id = create_resp.json()["id"]

    delete_resp = await client.delete(
        f"/company/{company_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert delete_resp.status_code == 200
    assert delete_resp.json()["name"] == "Deletable Company"


@pytest.mark.asyncio
async def test_put_cargo_not_found(client: AsyncClient, client_token: str):
    response = await client.put(
        "/cargo/99999",
        json={"weight": 50.0},
        headers={"Authorization": f"Bearer {client_token}"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_cargo_not_found(client: AsyncClient, client_token: str):
    response = await client.delete(
        "/cargo/99999",
        headers={"Authorization": f"Bearer {client_token}"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_ship_not_found(client: AsyncClient, admin_token: str):
    response = await client.put(
        "/ship/99999",
        json={"name": "Ghost"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 404
