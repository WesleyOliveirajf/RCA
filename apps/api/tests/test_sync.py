import pytest


@pytest.mark.asyncio
async def test_sync_requer_admin(client):
    response = await client.post("/api/sync/executar")
    assert response.status_code == 401
