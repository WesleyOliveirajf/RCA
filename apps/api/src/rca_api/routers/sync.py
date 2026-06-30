from fastapi import APIRouter, Depends, Request

from rca_api.core.middleware import limiter
from rca_api.dependencies import AdminDep, get_supabase_client
from rca_api.repositories.cliente_repository import ClienteRepository
from rca_api.repositories.pipeline_repository import PipelineRepository
from rca_api.repositories.sync_repository import SyncLogRepository
from rca_api.schemas.dashboard import SyncLogResponse, SyncStatusResponse
from rca_api.services.sisplan_sync_service import SisplanSyncService

router = APIRouter(prefix="/sync", tags=["sync"])


def get_service() -> SisplanSyncService:
    db = get_supabase_client()
    return SisplanSyncService(ClienteRepository(db), PipelineRepository(db), SyncLogRepository(db))


@router.post("/executar", response_model=SyncLogResponse)
@limiter.limit("3/hour")
async def executar_sync(
    request: Request,
    _: AdminDep,
    service: SisplanSyncService = Depends(get_service),
):
    return await service.executar()


@router.get("/status", response_model=SyncStatusResponse)
async def status_sync(
    _: AdminDep,
    service: SisplanSyncService = Depends(get_service),
):
    ultimo = service.status()
    if not ultimo:
        return SyncStatusResponse()
    return SyncStatusResponse(ultima_sync=ultimo.get("inicio"), status=ultimo.get("status"))


@router.get("/log", response_model=list[SyncLogResponse])
async def log_sync(
    _: AdminDep,
    service: SisplanSyncService = Depends(get_service),
):
    return service.logs()
