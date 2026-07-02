from rca_api.dependencies import get_supabase_client

ETAPAS = (
    "inativos",
    "primeiro_contato",
    "lead_qualificado",
    "negociacao",
    "pos_venda",
    "banco_potenciais",
    "desqualificados",
)


class DashboardService:
    def __init__(self):
        self._db = get_supabase_client()

    def funil(self) -> dict:
        result = (
            self._db.from_("pipeline_cards")
            .select("etapa, score, clientes(valor_historico)")
            .execute()
        )
        rows = result.data or []

        agg = {
            etapa: {"etapa": etapa, "total": 0, "valor_historico_total": 0.0, "_scores": []}
            for etapa in ETAPAS
        }

        for row in rows:
            bucket = agg.get(row.get("etapa"))
            if not bucket:
                continue
            bucket["total"] += 1
            bucket["valor_historico_total"] += float(row.get("clientes", {}).get("valor_historico") or 0)
            bucket["_scores"].append(row.get("score") or 0)

        etapas = []
        for etapa in ETAPAS:
            bucket = agg[etapa]
            total = bucket["total"]
            etapas.append(
                {
                    "etapa": etapa,
                    "total": total,
                    "valor_medio": bucket["valor_historico_total"] / total if total else 0.0,
                    "valor_historico_total": bucket["valor_historico_total"],
                    "score_medio": round(sum(bucket["_scores"]) / len(bucket["_scores"]))
                    if bucket["_scores"]
                    else 0,
                }
            )

        total_clientes = len(rows)
        pos_venda = agg["pos_venda"]["total"]
        valor_pipeline = sum(e["valor_historico_total"] for e in etapas)

        return {
            "etapas": etapas,
            "total_clientes": total_clientes,
            "taxa_conversao": (pos_venda / total_clientes * 100) if total_clientes else 0.0,
            "valor_pipeline": valor_pipeline,
        }

    def atividades_recentes(self, limite: int = 20) -> list[dict]:
        result = (
            self._db.table("atividades")
            .select("*, usuarios(nome), pipeline_cards(cliente_id)")
            .order("created_at", desc=True)
            .limit(limite)
            .execute()
        )
        return result.data or []
