from rca_api.core.exceptions import NotFoundError
from rca_api.integrations.n8n import notificar_n8n
from rca_api.repositories.pipeline_repository import PipelineRepository
from rca_api.repositories.qualificacao_repository import QualificacaoRepository
from rca_api.schemas.auth import CurrentUser
from rca_api.schemas.qualificacao import AvaliacaoLead, AprovarLeadRequest


class QualificacaoService:
    def __init__(self, qual_repo: QualificacaoRepository, pipeline_repo: PipelineRepository):
        self._qual_repo = qual_repo
        self._pipeline_repo = pipeline_repo

    def registrar(self, card_id: str, dados: AvaliacaoLead, user: CurrentUser) -> dict:
        card = self._pipeline_repo.buscar_por_id(card_id)
        if not card:
            raise NotFoundError("Card")

        payload = dados.model_dump()
        payload["card_id"] = card_id
        payload["avaliador_id"] = user.id
        qualificacao = self._qual_repo.criar(payload)

        score_total = qualificacao.get("score_total")
        if dados.aprovado:
            update = {"etapa": "lead_qualificado"}
            if score_total is not None:
                update["score"] = score_total
            self._pipeline_repo.atualizar(card_id, update)
        self._pipeline_repo.registrar_atividade(
            card_id,
            user.id,
            "analise",
            {
                "analisado": dados.aprovado,
                "score_total": score_total,
                "de": "primeiro_contato",
                "para": "lead_qualificado" if dados.aprovado else card.get("etapa"),
            },
        )
        return qualificacao

    async def aprovar(self, card_id: str, dados: AprovarLeadRequest, user: CurrentUser) -> dict:
        card = self._pipeline_repo.buscar_por_id(card_id)
        if not card:
            raise NotFoundError("Card")

        pendentes = self._qual_repo.listar_pendentes()
        qual = next((q for q in pendentes if q.get("card_id") == card_id), None)
        if not qual:
            raise NotFoundError("Qualificação pendente")

        result = self._qual_repo.atualizar_aprovacao(qual["id"], dados.aprovado, dados.observacoes)

        if dados.aprovado:
            self._pipeline_repo.atualizar(card_id, {"etapa": "lead_qualificado"})
            await notificar_n8n(
                "lead_qualificado",
                {"card_id": card_id, "cliente_id": card["cliente_id"]},
            )

        return result

    def listar_pendentes(self) -> list[dict]:
        return self._qual_repo.listar_pendentes()

    def listar_todas(self) -> list[dict]:
        return self._qual_repo.listar_todas()

    def obter(self, qualificacao_id: str) -> dict:
        qualificacao = self._qual_repo.buscar_por_id(qualificacao_id)
        if not qualificacao:
            raise NotFoundError("Qualificação")
        return qualificacao

    def listar_por_card(self, card_id: str) -> list[dict]:
        card = self._pipeline_repo.buscar_por_id(card_id)
        if not card:
            raise NotFoundError("Card")
        return self._qual_repo.listar_por_card(card_id)
