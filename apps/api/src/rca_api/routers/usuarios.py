from fastapi import APIRouter

from rca_api.dependencies import AdminDep, get_supabase_client

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


@router.get("")
async def listar_usuarios(_: AdminDep):
    result = get_supabase_client().table("usuarios").select("*").order("nome").execute()
    return result.data or []
