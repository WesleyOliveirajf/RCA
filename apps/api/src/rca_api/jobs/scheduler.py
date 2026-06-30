from datetime import UTC, datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from rca_api.core.logging import get_logger
from rca_api.dependencies import get_supabase_client
from rca_api.repositories.cliente_repository import ClienteRepository
from rca_api.repositories.pipeline_repository import PipelineRepository
from rca_api.repositories.sync_repository import SyncLogRepository
from rca_api.services.sisplan_sync_service import SisplanSyncService

logger = get_logger(__name__)
scheduler = AsyncIOScheduler()


async def _job_sync():
    service = SisplanSyncService(
        ClienteRepository(get_supabase_client()),
        PipelineRepository(get_supabase_client()),
        SyncLogRepository(get_supabase_client()),
    )
    await service.executar()


def configurar_scheduler() -> None:
    from rca_api.config import get_settings

    if not get_settings().supabase_service_key:
        logger.warning("SUPABASE_SERVICE_KEY ausente — scheduler de sync não iniciado")
        return

    sync_repo = SyncLogRepository(get_supabase_client())
    intervalo = int(sync_repo.buscar_config("sync_intervalo_horas", "6"))

    scheduler.add_job(
        _job_sync,
        "interval",
        hours=intervalo,
        id="sync_sisplan",
        replace_existing=True,
        next_run_time=datetime.now(UTC),
    )
    scheduler.start()
    logger.info("Scheduler iniciado — sync a cada %sh", intervalo)


def encerrar_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler encerrado")
