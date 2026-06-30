from fastapi import APIRouter, Depends

from rca_api.dependencies import CurrentUserDep, SupervisorDep, get_supabase_client
from rca_api.repositories.pipeline_repository import PipelineRepository
from rca_api.repositories.qualificacao_repository import QualificacaoRepository
from rca_api.schemas.qualificacao import AprovarLeadRequest, AvaliacaoLead, QualificacaoResponse
from rca_api.services.qualificacao_service import QualificacaoService

router = APIRouter(prefix="/qualificacao", tags=["qualificacao"])


def get_service() -> QualificacaoService:
    db = get_supabase_client()
    return QualificacaoService(QualificacaoRepository(db), PipelineRepository(db))


@router.get("/pendentes")
async def listar_pendentes(
    _: SupervisorDep,
    service: QualificacaoService = Depends(get_service),
):
    return service.listar_pendentes()


@router.get("/{qualificacao_id}", response_model=QualificacaoResponse)
async def obter_qualificacao(
    qualificacao_id: str,
    _: SupervisorDep,
    service: QualificacaoService = Depends(get_service),
):
    return service.obter(qualificacao_id)


@router.get("/card/{card_id}", response_model=list[QualificacaoResponse])
async def listar_qualificacoes_card(
    card_id: str,
    _: SupervisorDep,
    service: QualificacaoService = Depends(get_service),
):
    return service.listar_por_card(card_id)


@router.post("/{card_id}", response_model=QualificacaoResponse, status_code=201)
async def registrar_avaliacao(
    card_id: str,
    dados: AvaliacaoLead,
    user: CurrentUserDep,
    service: QualificacaoService = Depends(get_service),
):
    return service.registrar(card_id, dados, user)


@router.post("/{card_id}/aprovar", response_model=QualificacaoResponse)
async def aprovar_lead(
    card_id: str,
    dados: AprovarLeadRequest,
    _: SupervisorDep,
    user: CurrentUserDep,
    service: QualificacaoService = Depends(get_service),
):
    return await service.aprovar(card_id, dados, user)
