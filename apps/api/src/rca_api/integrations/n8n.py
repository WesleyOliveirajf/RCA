from datetime import UTC, datetime

import httpx

from rca_api.config import get_settings
from rca_api.core.logging import get_logger

logger = get_logger(__name__)

WEBHOOKS = {
    "card_movido": "/webhook/card-movido",
    "pos_venda": "/webhook/pos-venda",
    "lead_qualificado": "/webhook/lead-qualificado",
    "negociacao": "/webhook/negociacao",
    "banco_potenciais": "/webhook/banco-potenciais",
}


async def notificar_n8n(evento: str, dados: dict) -> bool:
    settings = get_settings()
    if not settings.n8n_webhook_url:
        logger.warning("N8N_WEBHOOK_URL não configurado — evento %s ignorado", evento)
        return False

    path = WEBHOOKS.get(evento)
    if not path:
        logger.warning("Evento N8N desconhecido: %s", evento)
        return False

    url = f"{settings.n8n_webhook_url.rstrip('/')}{path}"
    payload = {
        "evento": evento,
        "dados": dados,
        "timestamp": datetime.now(UTC).isoformat(),
    }
    headers = {}
    if settings.n8n_webhook_secret:
        headers["X-Webhook-Secret"] = settings.n8n_webhook_secret

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
        return True
    except httpx.HTTPError as exc:
        logger.error("Falha webhook N8N (%s): %s", evento, exc)
        return False
