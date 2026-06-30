from fastapi import APIRouter, Depends

from rca_api.dependencies import SupervisorDep, get_supabase_client
from rca_api.schemas.dashboard import FunilResumo
from rca_api.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/funil", response_model=FunilResumo)
async def funil(_: SupervisorDep, service: DashboardService = Depends(DashboardService)):
    return service.funil()


@router.get("/timeline")
async def timeline(_: SupervisorDep, service: DashboardService = Depends(DashboardService)):
    return service.atividades_recentes()
