from supabase import Client

from rca_api.schemas.cliente import ClienteFilter


class ClienteRepository:
    def __init__(self, supabase: Client):
        self._db = supabase

    def listar(self, filtros: ClienteFilter, cliente_ids: list[str] | None = None) -> list[dict]:
        query = self._db.table("clientes").select("*")
        if cliente_ids is not None:
            query = query.in_("id", cliente_ids)
        if filtros.status:
            query = query.eq("status", filtros.status)
        if filtros.cidade:
            query = query.eq("cidade", filtros.cidade)
        if filtros.segmento:
            query = query.eq("segmento", filtros.segmento)
        query = query.order(filtros.ordem, desc=filtros.direcao == "desc")
        result = query.range(filtros.offset, filtros.offset + filtros.limite - 1).execute()
        return result.data or []

    def buscar_por_id(self, cliente_id: str) -> dict | None:
        result = self._db.table("clientes").select("*").eq("id", cliente_id).maybe_single().execute()
        return result.data

    def buscar_por_sisplan_id(self, sisplan_id: str) -> dict | None:
        result = (
            self._db.table("clientes").select("id").eq("sisplan_id", sisplan_id).maybe_single().execute()
        )
        return result.data

    def inserir(self, dados: dict) -> dict:
        result = self._db.table("clientes").insert(dados).execute()
        return result.data[0]

    def atualizar(self, cliente_id: str, dados: dict) -> dict:
        result = self._db.table("clientes").update(dados).eq("id", cliente_id).execute()
        return result.data[0]

    def historico_compras(self, cliente_id: str) -> list[dict]:
        result = (
            self._db.table("historico_compras")
            .select("*")
            .eq("cliente_id", cliente_id)
            .order("data_pedido", desc=True)
            .execute()
        )
        return result.data or []

    def buscar_primeiro_admin(self) -> dict | None:
        result = (
            self._db.table("usuarios")
            .select("id")
            .eq("perfil", "admin")
            .eq("ativo", True)
            .limit(1)
            .execute()
        )
        if result.data:
            return result.data[0]
        return None
