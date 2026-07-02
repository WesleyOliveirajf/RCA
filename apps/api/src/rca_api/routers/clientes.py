from fastapi import APIRouter, Depends

from rca_api.dependencies import CurrentUserDep, get_supabase_client
from rca_api.repositories.cliente_repository import ClienteRepository
from rca_api.repositories.pipeline_repository import PipelineRepository
from rca_api.schemas.cliente import (
    ClienteCreate,
    ClienteFilter,
    ClienteResponse,
    ClienteUpdate,
    HistoricoCompraResponse,
)
from rca_api.services.cliente_service import ClienteService

router = APIRouter(prefix="/clientes", tags=["clientes"])


def get_service() -> ClienteService:
    db = get_supabase_client()
    return ClienteService(ClienteRepository(db), PipelineRepository(db))


@router.get("", response_model=list[ClienteResponse])
async def listar_clientes(
    user: CurrentUserDep,
    filtros: ClienteFilter = Depends(),
    service: ClienteService = Depends(get_service),
):
    return service.listar(filtros, user)


@router.post("", response_model=ClienteResponse, status_code=201)
async def criar_cliente(
    dados: ClienteCreate,
    user: CurrentUserDep,
    service: ClienteService = Depends(get_service),
):
    return service.criar(dados, user)


@router.get("/{cliente_id}", response_model=ClienteResponse)
async def obter_cliente(
    cliente_id: str,
    user: CurrentUserDep,
    service: ClienteService = Depends(get_service),
):
    return service.obter(cliente_id, user)


@router.get("/{cliente_id}/historico", response_model=list[HistoricoCompraResponse])
async def historico_cliente(
    cliente_id: str,
    user: CurrentUserDep,
    service: ClienteService = Depends(get_service),
):
    return service.historico(cliente_id, user)


@router.patch("/{cliente_id}", response_model=ClienteResponse)
async def atualizar_cliente(
    cliente_id: str,
    dados: ClienteUpdate,
    user: CurrentUserDep,
    service: ClienteService = Depends(get_service),
):
    return service.atualizar(cliente_id, dados, user)
