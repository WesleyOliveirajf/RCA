from fastapi import APIRouter, Depends

from rca_api.dependencies import CurrentUserDep, get_supabase_client
from rca_api.repositories.pipeline_repository import PipelineRepository
from rca_api.schemas.pipeline import (
    DesqualificarLeadRequest,
    DesqualificarLeadResponse,
    LiberarLeadResponse,
    MoverCardRequest,
    MoverCardResponse,
    PipelineCardCreate,
    PipelineCardResponse,
    PipelineCardUpdate,
)
from rca_api.services.pipeline_service import PipelineService

router = APIRouter(prefix="/pipeline", tags=["pipeline"])


def get_service() -> PipelineService:
    return PipelineService(PipelineRepository(get_supabase_client()))


@router.get("", response_model=list[PipelineCardResponse])
async def listar_pipeline(user: CurrentUserDep, service: PipelineService = Depends(get_service)):
    return service.listar(user)


@router.get("/meus", response_model=list[PipelineCardResponse])
async def meus_cards(user: CurrentUserDep, service: PipelineService = Depends(get_service)):
    return service.listar(user)


@router.post("/cards", response_model=PipelineCardResponse, status_code=201)
async def criar_card(
    dados: PipelineCardCreate,
    user: CurrentUserDep,
    service: PipelineService = Depends(get_service),
):
    return service.criar(dados, user)


@router.patch("/cards/{card_id}", response_model=PipelineCardResponse)
async def atualizar_card(
    card_id: str,
    dados: PipelineCardUpdate,
    user: CurrentUserDep,
    service: PipelineService = Depends(get_service),
):
    return service.atualizar(card_id, dados, user)


@router.post("/cards/{card_id}/mover", response_model=MoverCardResponse)
async def mover_card(
    card_id: str,
    dados: MoverCardRequest,
    user: CurrentUserDep,
    service: PipelineService = Depends(get_service),
):
    result = await service.mover(card_id, dados, user)
    return MoverCardResponse(**{k: result[k] for k in MoverCardResponse.model_fields})


@router.post("/cards/{card_id}/liberar", response_model=LiberarLeadResponse)
async def liberar_lead(
    card_id: str,
    user: CurrentUserDep,
    service: PipelineService = Depends(get_service),
):
    result = service.liberar(card_id, user)
    return LiberarLeadResponse(
        card_id=result["card_id"],
        liberado=result["liberado"],
        liberado_por=result["liberado_por"],
        liberado_em=result["liberado_em"],
    )


@router.post("/cards/{card_id}/desqualificar", response_model=DesqualificarLeadResponse)
async def desqualificar_lead(
    card_id: str,
    dados: DesqualificarLeadRequest,
    user: CurrentUserDep,
    service: PipelineService = Depends(get_service),
):
    return await service.desqualificar(card_id, dados, user)


@router.delete("/cards/{card_id}", status_code=204)
async def remover_card(
    card_id: str,
    user: CurrentUserDep,
    service: PipelineService = Depends(get_service),
):
    service.remover(card_id, user)
