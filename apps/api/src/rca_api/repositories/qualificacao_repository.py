from supabase import Client


class QualificacaoRepository:
    def __init__(self, supabase: Client):
        self._db = supabase

    def criar(self, dados: dict) -> dict:
        result = self._db.table("qualificacoes").insert(dados).execute()
        return result.data[0]

    def buscar_por_id(self, qualificacao_id: str) -> dict | None:
        result = (
            self._db.table("qualificacoes")
            .select("*")
            .eq("id", qualificacao_id)
            .maybe_single()
            .execute()
        )
        return result.data

    def listar_por_card(self, card_id: str) -> list[dict]:
        result = (
            self._db.table("qualificacoes")
            .select("*")
            .eq("card_id", card_id)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data or []

    def listar_todas(self) -> list[dict]:
        result = (
            self._db.table("qualificacoes")
            .select("*, pipeline_cards(*)")
            .order("created_at", desc=True)
            .execute()
        )
        return result.data or []

    def listar_pendentes(self) -> list[dict]:
        result = (
            self._db.table("qualificacoes")
            .select("*, pipeline_cards(*)")
            .is_("aprovado", "null")
            .execute()
        )
        return result.data or []

    def atualizar_aprovacao(self, qualificacao_id: str, aprovado: bool, observacoes: str | None) -> dict:
        result = (
            self._db.table("qualificacoes")
            .update({"aprovado": aprovado, "observacoes": observacoes})
            .eq("id", qualificacao_id)
            .execute()
        )
        return result.data[0]
