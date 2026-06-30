from rca_api.core.exceptions import ForbiddenError, NotFoundError
from rca_api.schemas.auth import UsuarioCreate, UsuarioUpdate


class UsuarioService:
    def __init__(self, supabase_client):
        self._db = supabase_client

    def listar(self) -> list[dict]:
        result = self._db.table("usuarios").select("*").order("nome").execute()
        return result.data or []

    def criar(self, dados: UsuarioCreate) -> dict:
        email = f"{dados.username.lower()}@rca.local"
        auth_data = {
            "email": email,
            "password": dados.password,
            "email_confirm": True,
            "user_metadata": {
                "nome": dados.nome,
                "perfil": dados.perfil,
            },
        }
        auth_resp = self._db.auth.admin.create_user(auth_data)
        if not auth_resp.user:
            raise RuntimeError("Falha ao criar usuário no Auth")
        user_id = auth_resp.user.id

        self._db.table("usuarios").update({
            "username": dados.username,
            "nome": dados.nome,
            "perfil": dados.perfil,
        }).eq("id", user_id).execute()

        result = self._db.table("usuarios").select("*").eq("id", user_id).single().execute()
        return result.data

    def atualizar(self, usuario_id: str, dados: UsuarioUpdate) -> dict:
        perfil = self._db.table("usuarios").select("id").eq("id", usuario_id).single().execute()
        if not perfil.data:
            raise NotFoundError("Usuário")

        update = {}
        if dados.username is not None:
            update["username"] = dados.username
        if dados.nome is not None:
            update["nome"] = dados.nome
        if dados.perfil is not None:
            update["perfil"] = dados.perfil
        if dados.ativo is not None:
            update["ativo"] = dados.ativo

        if update:
            result = self._db.table("usuarios").update(update).eq("id", usuario_id).execute()
            return result.data[0]
        return perfil.data

    def remover(self, usuario_id: str) -> None:
        perfil = self._db.table("usuarios").select("id, perfil").eq("id", usuario_id).single().execute()
        if not perfil.data:
            raise NotFoundError("Usuário")

        self._db.auth.admin.delete_user(usuario_id)

    def alterar_senha(self, usuario_id: str, nova_senha: str) -> None:
        self._db.auth.admin.update_user_by_id(usuario_id, {"password": nova_senha})
