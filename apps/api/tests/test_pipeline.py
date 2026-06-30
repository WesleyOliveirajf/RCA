import pytest


@pytest.mark.asyncio
async def test_mover_card_requer_auth(client):
    response = await client.post(
        "/api/pipeline/cards/uuid-test/mover",
        json={"etapa_destino": "lead_qualificado"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_liberar_lead_requer_auth(client):
    response = await client.post("/api/pipeline/cards/uuid-test/liberar")
    assert response.status_code == 401
