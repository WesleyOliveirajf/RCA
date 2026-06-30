from pydantic import BaseModel, EmailStr

from rca_api.core.security import Perfil


class CurrentUser(BaseModel):
    id: str
    email: EmailStr | str
    nome: str
    perfil: Perfil
