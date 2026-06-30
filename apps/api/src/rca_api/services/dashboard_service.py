from rca_api.dependencies import get_supabase_client


class DashboardService:
    def __init__(self):
        self._db = get_supabase_client()

    def funil(self) -> dict:
        result = self._db.from_("v_funil_resumo").select("*").execute()
        etapas = result.data or []
        total = sum(e.get("total", 0) for e in etapas)
        return {"etapas": etapas, "total_clientes": total, "taxa_conversao": 0.0, "valor_pipeline": 0.0}

    def atividades_recentes(self, limite: int = 20) -> list[dict]:
        result = (
            self._db.table("atividades")
            .select("*, usuarios(nome), pipeline_cards(cliente_id)")
            .order("created_at", desc=True)
            .limit(limite)
            .execute()
        )
        return result.data or []
