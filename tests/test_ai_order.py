import pytest
from httpx import AsyncClient

from app.ai.ordering import parse_natural_language_order, _fallback_parse


@pytest.mark.asyncio
async def test_fallback_parse_valid():
    result = await parse_natural_language_order(
        "Need to transport 50 tons of grain from Aktau to Baku before June 20"
    )
    assert result.weight == 50.0
    assert result.origin == "Aktau"
    assert result.destination == "Baku"
    assert result.confidence >= 0.7


@pytest.mark.asyncio
async def test_fallback_parse_missing_fields():
    result = await parse_natural_language_order("Send my cargo")
    assert result.confidence < 0.7
    assert result.requires_review is True
    assert len(result.missing_fields) > 0


@pytest.mark.asyncio
async def test_ai_order_endpoint_low_confidence(client: AsyncClient, client_token: str):
    response = await client.post(
        "/ai-order/",
        json={"text": "Send cargo"},
        headers={"Authorization": f"Bearer {client_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["requires_review"] is True
    assert data["confidence"] < 0.7


@pytest.mark.asyncio
async def test_ai_order_endpoint_high_confidence(client: AsyncClient, client_token: str):
    response = await client.post(
        "/ai-order/",
        json={"text": "Need to transport 50 tons of grain from Aktau to Baku before June 20"},
        headers={"Authorization": f"Bearer {client_token}"},
    )
    data = response.json()
    assert data["cargo_type"] == "grain"
    assert data["weight"] == 50.0
    assert data["origin"] == "Aktau"
