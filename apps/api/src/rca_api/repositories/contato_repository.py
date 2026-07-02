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

    def pendentes_hoje(self, responsavel_id: str | None = None) -> list[dict]:
        query = self._db.from_("v_contatos_hoje").select("*")
        if responsavel_id:
            cards = (
                self._db.table("pipeline_cards")
                .select("id")
                .eq("responsavel_id", responsavel_id)
                .execute()
            )
            card_ids = [row["id"] for row in (cards.data or [])]
            funil = (
                self._db.table("pipeline_cards")
                .select("id")
                .in_("etapa", ["inativos", "primeiro_contato", "lead_qualificado"])
                .execute()
            )
            card_ids.extend(row["id"] for row in (funil.data or []))
            card_ids = list(dict.fromkeys(card_ids))
            if not card_ids:
                return []
            query = query.in_("card_id", card_ids)
        result = query.execute()
        return result.data or []
