import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_payment_gate_blocks_arrived(client: AsyncClient, client_token: str, admin_token: str, db_session):
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

    await client.patch(
        f"/cargo/{cargo_id}/status",
        json={"status": "approved"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    await client.post(
        "/payments/",
        json={"type": "cargo_fee", "amount": 100.0, "cargo_id": cargo_id},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    response = await client.patch(
        f"/cargo/{cargo_id}/status",
        json={"status": "arrived"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 400
    assert "payment" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_payment_gate_blocks_delivered(client: AsyncClient, client_token: str, admin_token: str, db_session):
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

    await client.patch(
        f"/cargo/{cargo_id}/status",
        json={"status": "approved"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    await client.post(
        "/payments/",
        json={"type": "cargo_fee", "amount": 100.0, "cargo_id": cargo_id},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    response = await client.patch(
        f"/cargo/{cargo_id}/status",
        json={"status": "delivered"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 400
    assert "payment" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_payment_gate_assign_ship_blocked(client: AsyncClient, client_token: str, admin_token: str, db_session):
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

    await client.patch(
        f"/cargo/{cargo_id}/status",
        json={"status": "approved"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    await client.post(
        "/payments/",
        json={"type": "cargo_fee", "amount": 100.0, "cargo_id": cargo_id},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    ship_resp = await client.post(
        "/ship/create",
        json={"name": "Gate Ship 3", "capacity": 300.0},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    ship_id = ship_resp.json()["id"]

    response = await client.post(
        "/cargo/assign-ship",
        json={"cargo_id": cargo_id, "ship_id": ship_id},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 400
    assert "payment" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_payment_gate_allows_with_paid(client: AsyncClient, client_token: str, admin_token: str, db_session):
    create_resp = await client.post(
        "/cargo/create",
        json={
            "cargo_type": "food",
            "weight": 30.0,
            "origin": "Aktau",
            "destination": "Baku",
        },
        headers={"Authorization": f"Bearer {client_token}"},
    )
    cargo_id = create_resp.json()["id"]

    await client.patch(
        f"/cargo/{cargo_id}/status",
        json={"status": "approved"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    pay_resp = await client.post(
        "/payments/",
        json={"type": "cargo_fee", "amount": 100.0, "cargo_id": cargo_id},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert pay_resp.status_code == 201
    payment_id = pay_resp.json()["id"]

    mark_resp = await client.post(
        f"/payments/{payment_id}/pay",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert mark_resp.status_code == 200
    assert mark_resp.json()["status"] == "paid"

    ship_resp = await client.post(
        "/ship/create",
        json={"name": "Gate Ship 4", "capacity": 100.0},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    ship_id = ship_resp.json()["id"]

    assign_resp = await client.post(
        "/cargo/assign-ship",
        json={"cargo_id": cargo_id, "ship_id": ship_id},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert assign_resp.status_code == 200

    response = await client.patch(
        f"/cargo/{cargo_id}/status",
        json={"status": "arrived"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "arrived"
