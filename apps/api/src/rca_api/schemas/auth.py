from pydantic import BaseModel, EmailStr, Field

from rca_api.core.security import Perfil


class CurrentUser(BaseModel):
    id: str
    email: EmailStr | str
    nome: str
    perfil: Perfil


class UsuarioCreate(BaseModel):
    username: str
    password: str = Field(min_length=6)
    nome: str
    perfil: Perfil = "vendedor"


class UsuarioUpdate(BaseModel):
    username: str | None = None
    nome: str | None = None
    perfil: Perfil | None = None
    ativo: bool | None = None
