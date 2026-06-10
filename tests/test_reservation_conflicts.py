import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_reserve_berth_success(client: AsyncClient, admin_token: str, db_session):
    berth_resp = await client.post(
        "/berth/create",
        json={"name": "Test Berth", "capacity": 100.0},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    berth_id = berth_resp.json()["id"]

    ship_resp = await client.post(
        "/ship/create",
        json={"name": "Test Ship", "capacity": 50.0},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    ship_id = ship_resp.json()["id"]

    reserve_resp = await client.post(
        "/berth/reserve",
        json={
            "berth_id": berth_id,
            "ship_id": ship_id,
            "arrival_time": "2026-07-01T08:00:00Z",
            "departure_time": "2026-07-03T18:00:00Z",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert reserve_resp.status_code == 200
    assert reserve_resp.json()["status"] == "active"


@pytest.mark.asyncio
async def test_reserve_berth_overlap_conflict(client: AsyncClient, admin_token: str):
    berth_resp = await client.post(
        "/berth/create",
        json={"name": "Overlap Berth", "capacity": 100.0},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    berth_id = berth_resp.json()["id"]

    ship1_resp = await client.post(
        "/ship/create",
        json={"name": "Ship One", "capacity": 50.0},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    ship1_id = ship1_resp.json()["id"]

    ship2_resp = await client.post(
        "/ship/create",
        json={"name": "Ship Two", "capacity": 50.0},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    ship2_id = ship2_resp.json()["id"]

    await client.post(
        "/berth/reserve",
        json={
            "berth_id": berth_id,
            "ship_id": ship1_id,
            "arrival_time": "2026-07-01T08:00:00Z",
            "departure_time": "2026-07-05T18:00:00Z",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    reserve_resp = await client.post(
        "/berth/reserve",
        json={
            "berth_id": berth_id,
            "ship_id": ship2_id,
            "arrival_time": "2026-07-03T08:00:00Z",
            "departure_time": "2026-07-07T18:00:00Z",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert reserve_resp.status_code == 400
    assert "overlap" in reserve_resp.json()["detail"].lower() or "occupied" in reserve_resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_reserve_berth_non_overlapping(client: AsyncClient, admin_token: str):
    berth_resp = await client.post(
        "/berth/create",
        json={"name": "NonOverlap Berth", "capacity": 100.0},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    berth_id = berth_resp.json()["id"]

    ship1_resp = await client.post(
        "/ship/create",
        json={"name": "Ship A", "capacity": 50.0},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    ship1_id = ship1_resp.json()["id"]

    ship2_resp = await client.post(
        "/ship/create",
        json={"name": "Ship B", "capacity": 50.0},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    ship2_id = ship2_resp.json()["id"]

    await client.post(
        "/berth/reserve",
        json={
            "berth_id": berth_id,
            "ship_id": ship1_id,
            "arrival_time": "2026-07-01T08:00:00Z",
            "departure_time": "2026-07-03T18:00:00Z",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    reserve_resp = await client.post(
        "/berth/reserve",
        json={
            "berth_id": berth_id,
            "ship_id": ship2_id,
            "arrival_time": "2026-07-05T08:00:00Z",
            "departure_time": "2026-07-07T18:00:00Z",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert reserve_resp.status_code == 200
    assert reserve_resp.json()["status"] == "active"


@pytest.mark.asyncio
async def test_reserve_berth_maintenance(client: AsyncClient, admin_token: str):
    berth_resp = await client.post(
        "/berth/create",
        json={"name": "Maint Berth", "capacity": 100.0},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    berth_id = berth_resp.json()["id"]

    ship_resp = await client.post(
        "/ship/create",
        json={"name": "Maint Ship", "capacity": 50.0},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    ship_id = ship_resp.json()["id"]

    await client.put(
        f"/berth/{berth_id}",
        json={"status": "maintenance"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    reserve_resp = await client.post(
        "/berth/reserve",
        json={
            "berth_id": berth_id,
            "ship_id": ship_id,
            "arrival_time": "2026-07-01T08:00:00Z",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert reserve_resp.status_code == 400
    assert "maintenance" in reserve_resp.json()["detail"].lower()
