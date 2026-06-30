from supabase import Client


class PipelineRepository:
    def __init__(self, supabase: Client):
        self._db = supabase

    def listar_todos(self) -> list[dict]:
        result = self._db.table("pipeline_cards").select("*").order("posicao").execute()
        return result.data or []

    def listar_por_responsavel(self, responsavel_id: str) -> list[dict]:
        result = (
            self._db.table("pipeline_cards")
            .select("*")
            .eq("responsavel_id", responsavel_id)
            .order("posicao")
            .execute()
        )
        return result.data or []

    def listar_por_responsavel_ou_funil_aberto(self, responsavel_id: str) -> list[dict]:
        result = (
            self._db.table("pipeline_cards")
            .select("*")
            .or_(
                "etapa.in.(inativos,primeiro_contato,lead_qualificado),"
                f"responsavel_id.eq.{responsavel_id}"
            )
            .order("posicao")
            .execute()
        )
        return result.data or []

    def buscar_por_id(self, card_id: str) -> dict | None:
        result = self._db.table("pipeline_cards").select("*").eq("id", card_id).maybe_single().execute()
        return result.data

    def buscar_por_cliente_id(self, cliente_id: str) -> dict | None:
        result = (
            self._db.table("pipeline_cards")
            .select("*")
            .eq("cliente_id", cliente_id)
            .maybe_single()
            .execute()
        )
        return result.data

    def criar(self, dados: dict) -> dict:
        result = self._db.table("pipeline_cards").insert(dados).execute()
        return result.data[0]

    def atualizar(self, card_id: str, dados: dict) -> dict:
        result = self._db.table("pipeline_cards").update(dados).eq("id", card_id).execute()
        return result.data[0]

    def atualizar_cliente(self, cliente_id: str, dados: dict) -> dict:
        result = self._db.table("clientes").update(dados).eq("id", cliente_id).execute()
        return result.data[0]

    def registrar_desqualificacao(self, dados: dict) -> dict:
        result = self._db.table("lead_desqualificacoes").insert(dados).execute()
        return result.data[0]

    def criar_tarefa(self, dados: dict) -> dict:
        result = self._db.table("lead_tarefas").insert(dados).execute()
        return result.data[0]

    def upsert_nutricao(self, dados: dict) -> dict:
        result = self._db.table("lead_nutricao").upsert(
            dados,
            on_conflict="cliente_id",
        ).execute()
        return result.data[0]

    def remover(self, card_id: str) -> None:
        self._db.table("pipeline_cards").delete().eq("id", card_id).execute()

    def registrar_atividade(self, card_id: str, usuario_id: str, acao: str, detalhes: dict | None = None) -> None:
        self._db.table("atividades").insert(
            {
                "card_id": card_id,
                "usuario_id": usuario_id,
                "acao": acao,
                "detalhes": detalhes or {},
            }
        ).execute()
