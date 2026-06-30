from functools import lru_cache
from typing import Annotated

from fastapi import Depends, Header, HTTPException, Request
from supabase import Client, create_client

from rca_api.config import Settings, get_settings
from rca_api.core.exceptions import ForbiddenError, UnauthorizedError
from rca_api.core.security import Perfil, perfil_tem_acesso
from rca_api.schemas.auth import CurrentUser


@lru_cache
def get_supabase_client(settings: Settings | None = None) -> Client:
    s = settings or get_settings()
    if not s.supabase_service_key:
        raise RuntimeError(
            "SUPABASE_SERVICE_KEY não configurada em apps/api/.env "
            "(Supabase → Project Settings → API → service_role)"
        )
    return create_client(s.supabase_url, s.supabase_service_key)


async def get_current_user(
    request: Request,
    authorization: Annotated[str | None, Header()] = None,
) -> CurrentUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedError("Token não fornecido")

    token = authorization.replace("Bearer ", "", 1)
    supabase = get_supabase_client()

    try:
        auth_response = supabase.auth.get_user(token)
    except Exception as exc:
        raise UnauthorizedError("Token inválido") from exc

    if not auth_response or not auth_response.user:
        raise UnauthorizedError("Token inválido")

    user_id = auth_response.user.id
    email = auth_response.user.email or ""

    profile = (
        supabase.table("usuarios")
        .select("id, nome, email, perfil, ativo")
        .eq("id", user_id)
        .single()
        .execute()
    )

    if not profile.data or not profile.data.get("ativo", False):
        raise ForbiddenError("Usuário inativo ou sem perfil")

    return CurrentUser(
        id=user_id,
        email=email,
        nome=profile.data["nome"],
        perfil=profile.data["perfil"],
    )


def require_perfil(minimo: Perfil):
    async def checker(user: Annotated[CurrentUser, Depends(get_current_user)]) -> CurrentUser:
        if not perfil_tem_acesso(user.perfil, minimo):
            raise ForbiddenError(f"Requer perfil {minimo} ou superior")
        return user

    return checker


CurrentUserDep = Annotated[CurrentUser, Depends(get_current_user)]
SupervisorDep = Annotated[CurrentUser, Depends(require_perfil("supervisor"))]
AdminDep = Annotated[CurrentUser, Depends(require_perfil("admin"))]
