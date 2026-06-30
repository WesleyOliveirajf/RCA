from supabase import Client


class ContatoRepository:
    def __init__(self, supabase: Client):
        self._db = supabase

    def listar_por_cliente(self, cliente_id: str) -> list[dict]:
        result = (
            self._db.table("contatos")
            .select("*")
            .eq("cliente_id", cliente_id)
            .order("data_contato", desc=True)
            .execute()
        )
        return result.data or []

    def buscar_por_id(self, contato_id: str) -> dict | None:
        result = self._db.table("contatos").select("*").eq("id", contato_id).maybe_single().execute()
        return result.data

    def criar(self, dados: dict) -> dict:
        result = self._db.table("contatos").insert(dados).execute()
        return result.data[0]

    def atualizar(self, contato_id: str, dados: dict) -> dict:
        result = self._db.table("contatos").update(dados).eq("id", contato_id).execute()
        return result.data[0]

    def pendentes_hoje(self) -> list[dict]:
        result = self._db.from_("v_contatos_hoje").select("*").execute()
        return result.data or []
