from fastapi import APIRouter, Depends

from rca_api.core.exceptions import AppError, ForbiddenError
from rca_api.dependencies import AdminDep, CurrentUserDep, get_supabase_client
from rca_api.schemas.auth import UsuarioCreate, UsuarioUpdate
from rca_api.services.usuario_service import UsuarioService

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


def get_service() -> UsuarioService:
    return UsuarioService(get_supabase_client())


@router.get("")
async def listar_usuarios(
    _: AdminDep,
    service: UsuarioService = Depends(get_service),
):
    return service.listar()


@router.post("", status_code=201)
async def criar_usuario(
    dados: UsuarioCreate,
    _: AdminDep,
    service: UsuarioService = Depends(get_service),
):
    try:
        return service.criar(dados)
    except Exception as exc:
        raise AppError(str(exc))


@router.patch("/{usuario_id}")
async def atualizar_usuario(
    usuario_id: str,
    dados: UsuarioUpdate,
    _: AdminDep,
    service: UsuarioService = Depends(get_service),
):
    return service.atualizar(usuario_id, dados)


@router.delete("/{usuario_id}", status_code=204)
async def remover_usuario(
    usuario_id: str,
    _: AdminDep,
    service: UsuarioService = Depends(get_service),
):
    service.remover(usuario_id)
