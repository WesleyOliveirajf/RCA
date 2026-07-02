from fastapi import APIRouter, Depends

from rca_api.dependencies import CurrentUserDep, get_supabase_client
from rca_api.repositories.contato_repository import ContatoRepository
from rca_api.repositories.pipeline_repository import PipelineRepository
from rca_api.schemas.contato import (
    ContatoCreate,
    ContatoPendenteResponse,
    ContatoResponse,
    ContatoUpdate,
)
from rca_api.services.contato_service import ContatoService

router = APIRouter(prefix="/contatos", tags=["contatos"])


def get_service() -> ContatoService:
    db = get_supabase_client()
    return ContatoService(ContatoRepository(db), PipelineRepository(db))


@router.get("/pendentes", response_model=list[ContatoPendenteResponse])
async def contatos_pendentes(
    user: CurrentUserDep,
    service: ContatoService = Depends(get_service),
):
    return service.pendentes_hoje(user)


@router.get("/{cliente_id}", response_model=list[ContatoResponse])
async def listar_contatos(
    cliente_id: str,
    user: CurrentUserDep,
    service: ContatoService = Depends(get_service),
):
    return service.listar_por_cliente(cliente_id, user)


@router.get("/registro/{contato_id}", response_model=ContatoResponse)
async def obter_contato(
    contato_id: str,
    user: CurrentUserDep,
    service: ContatoService = Depends(get_service),
):
    return service.obter(contato_id, user)


@router.post("", response_model=ContatoResponse, status_code=201)
async def registrar_contato(
    dados: ContatoCreate,
    user: CurrentUserDep,
    service: ContatoService = Depends(get_service),
):
    return service.criar(dados, user)


@router.patch("/{contato_id}", response_model=ContatoResponse)
async def atualizar_contato(
    contato_id: str,
    dados: ContatoUpdate,
    user: CurrentUserDep,
    service: ContatoService = Depends(get_service),
):
    return service.atualizar(contato_id, dados, user)
