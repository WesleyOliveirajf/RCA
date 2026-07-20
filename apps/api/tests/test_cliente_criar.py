"""Testes da feature de cadastro de clientes (pré-deploy)."""

from decimal import Decimal
from unittest.mock import MagicMock

import pytest

from rca_api.core.exceptions import ForbiddenError
from rca_api.schemas.auth import CurrentUser
from rca_api.schemas.cliente import ClienteCreate
from rca_api.services.cliente_service import ClienteService


def _user(perfil: str = "vendedor", user_id: str = "user-1") -> CurrentUser:
    return CurrentUser(id=user_id, email="teste@rca.local", perfil=perfil, nome="Teste")


def test_cliente_create_model_dump_json_serializavel():
    """Garante que Decimal/date não quebram o insert no Supabase client."""
    import json

    dados = ClienteCreate(razao_social="Empresa Teste LTDA", cidade="Uberlândia")
    payload = dados.model_dump(mode="json", exclude_none=True)

    json.dumps(payload)  # não deve levantar TypeError
    assert payload["razao_social"] == "Empresa Teste LTDA"
    assert payload["valor_historico"] == "0"
    assert isinstance(payload["valor_historico"], str)
    assert payload["status"] == "inativo"


def test_criar_cliente_serializa_json_e_cria_card_inativos():
    repo = MagicMock()
    pipeline_repo = MagicMock()
    repo.inserir.return_value = {
        "id": "cli-123",
        "razao_social": "Empresa Teste LTDA",
        "status": "inativo",
        "valor_historico": 0,
    }
    pipeline_repo.criar.return_value = {"id": "card-1", "etapa": "inativos"}

    service = ClienteService(repo, pipeline_repo)
    resultado = service.criar(
        ClienteCreate(razao_social="Empresa Teste LTDA", valor_historico=Decimal("0")),
        _user("vendedor", "user-vendedor"),
    )

    assert resultado["id"] == "cli-123"
    payload = repo.inserir.call_args.args[0]
    assert not any(isinstance(v, Decimal) for v in payload.values())
    assert payload["valor_historico"] == "0"

    pipeline_repo.criar.assert_called_once()
    card_payload = pipeline_repo.criar.call_args.args[0]
    assert card_payload == {
        "cliente_id": "cli-123",
        "etapa": "inativos",
        "responsavel_id": "user-vendedor",
        "prioridade": "media",
        "posicao": 0,
        "score": 0,
    }


def test_criar_cliente_perfil_nao_autorizado():
    service = ClienteService(MagicMock(), MagicMock())
    user = MagicMock()
    user.id = "user-x"
    user.perfil = "leitura"
    with pytest.raises(ForbiddenError):
        service.criar(ClienteCreate(razao_social="X"), user)


@pytest.mark.asyncio
async def test_post_clientes_requer_auth(client):
    response = await client.post(
        "/api/clientes",
        json={"razao_social": "Empresa Sem Auth"},
    )
    assert response.status_code == 401
