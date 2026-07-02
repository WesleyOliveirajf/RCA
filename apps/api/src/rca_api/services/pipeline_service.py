from datetime import date, datetime, timedelta, timezone

from rca_api.core.exceptions import AppError, ForbiddenError, NotFoundError
from rca_api.core.security import (
    pode_acessar_cliente,
    pode_excluir_card,
    pode_interagir_com_card,
    pode_mover_para_etapa,
    pode_ver_card,
    precisa_liberacao_para_mover,
)
from rca_api.integrations.n8n import notificar_n8n
from rca_api.repositories.pipeline_repository import PipelineRepository
from rca_api.schemas.auth import CurrentUser
from rca_api.schemas.pipeline import (
    MoverCardRequest,
    PipelineCardCreate,
    PipelineCardUpdate,
    DesqualificarLeadRequest,
)

NUTRICAO_MOTIVOS = {"timing_ruim", "decisor_errado"}


class PipelineService:
    def __init__(self, repo: PipelineRepository):
        self._repo = repo

    def listar(self, user: CurrentUser) -> list[dict]:
        if user.perfil in ("supervisor", "admin", "superadmin"):
            return self._repo.listar_todos()
        return self._repo.listar_por_responsavel_ou_funil_aberto(user.id)

    def obter(self, card_id: str, user: CurrentUser) -> dict:
        card = self._repo.buscar_por_id(card_id)
        if not card:
            raise NotFoundError("Card")
        if not pode_ver_card(user.perfil, card.get("responsavel_id"), user.id, card.get("etapa")):
            raise ForbiddenError()
        return card

    def criar(self, dados: PipelineCardCreate, user: CurrentUser) -> dict:
        payload = dados.model_dump()
        if not payload.get("responsavel_id"):
            payload["responsavel_id"] = user.id
        return self._repo.criar(payload)

    def atualizar(self, card_id: str, dados: PipelineCardUpdate, user: CurrentUser) -> dict:
        self.obter(card_id, user)
        return self._repo.atualizar(card_id, dados.model_dump(exclude_none=True))

    async def mover(self, card_id: str, dados: MoverCardRequest, user: CurrentUser) -> dict:
        card = self.obter(card_id, user)
        etapa_anterior = card["etapa"]

        if not pode_interagir_com_card(
            user.perfil, card.get("responsavel_id"), user.id, etapa_anterior
        ):
            raise ForbiddenError("Sem permissão para mover este card")

        if not pode_mover_para_etapa(
            user.perfil, card.get("responsavel_id"), user.id, dados.etapa_destino
        ):
            raise ForbiddenError("Sem permissão para mover para esta etapa")

        if precisa_liberacao_para_mover(
            etapa_anterior, dados.etapa_destino, card.get("liberado")
        ):
            raise ForbiddenError(
                "Lead precisa ser liberado por um administrador antes de avançar"
            )

        update = {"etapa": dados.etapa_destino}
        if dados.posicao is not None:
            update["posicao"] = dados.posicao
        if dados.notas:
            update["notas"] = dados.notas

        atualizado = self._repo.atualizar(card_id, update)
        self._repo.registrar_atividade(
            card_id,
            user.id,
            "mover",
            {"de": etapa_anterior, "para": dados.etapa_destino},
        )

        evento = "card_movido"
        if dados.etapa_destino == "pos_venda":
            evento = "pos_venda"
        elif dados.etapa_destino == "lead_qualificado":
            evento = "lead_qualificado"
        elif dados.etapa_destino == "negociacao":
            evento = "negociacao"
        elif dados.etapa_destino == "banco_potenciais":
            evento = "banco_potenciais"

        webhook_ok = await notificar_n8n(
            evento,
            {"card_id": card_id, "cliente_id": card["cliente_id"], "etapa": dados.etapa_destino},
        )

        return {
            "card_id": card_id,
            "etapa_anterior": etapa_anterior,
            "etapa_nova": dados.etapa_destino,
            "webhook_disparado": webhook_ok,
            "card": atualizado,
        }

    def liberar(self, card_id: str, user: CurrentUser) -> dict:
        if user.perfil not in ("admin", "superadmin"):
            raise ForbiddenError("Somente administradores podem liberar leads")

        card = self.obter(card_id, user)
        if card.get("etapa") != "lead_qualificado":
            raise AppError("O card precisa estar na etapa Lead Qualificado para ser liberado")
        if card.get("liberado"):
            raise AppError("Este lead já foi liberado")

        liberado_em = datetime.now(timezone.utc)
        atualizado = self._repo.atualizar(
            card_id,
            {
                "liberado": True,
                "liberado_por": user.id,
                "liberado_em": liberado_em.isoformat(),
            },
        )
        self._repo.registrar_atividade(
            card_id,
            user.id,
            "liberar_lead",
            {"etapa": "lead_qualificado"},
        )

        return {
            "card_id": card_id,
            "liberado": True,
            "liberado_por": user.id,
            "liberado_em": liberado_em,
            "card": atualizado,
        }

    async def desqualificar(
        self,
        card_id: str,
        dados: DesqualificarLeadRequest,
        user: CurrentUser,
    ) -> dict:
        card = self.obter(card_id, user)
        if not pode_interagir_com_card(user.perfil, card.get("responsavel_id"), user.id, card.get("etapa")):
            raise ForbiddenError("Sem permissão para desqualificar este lead")

        hoje = date.today()
        agora = datetime.now(timezone.utc)
        cliente_id = card["cliente_id"]
        checklist = dados.checklist.model_dump()

        if dados.motivo in NUTRICAO_MOTIVOS:
            acao = "nutricao_90_dias"
            segmento = f"nutricao_{dados.motivo}"
            tarefa = self._repo.criar_tarefa(
                {
                    "card_id": card_id,
                    "cliente_id": cliente_id,
                    "usuario_id": user.id,
                    "titulo": "Requalificar este lead em 90 dias",
                    "tipo": "requalificacao",
                    "vencimento": (hoje + timedelta(days=90)).isoformat(),
                }
            )
            nutricao = self._repo.upsert_nutricao(
                {
                    "card_id": card_id,
                    "cliente_id": cliente_id,
                    "motivo": dados.motivo,
                    "segmento": segmento,
                    "sequencia_email": "educacional_requalificacao",
                    "ativo": True,
                }
            )
            cliente_update = {
                "status": "desqualificado",
                "desqualificado_motivo": dados.motivo,
                "desqualificado_em": agora.isoformat(),
                "nutricao_segmento": segmento,
                "comunicacao_ativa": True,
                "retencao_ate": None,
                "anonimizar_apos": None,
            }
            webhook_ok = await notificar_n8n(
                "sequencia_email_educacional",
                {
                    "card_id": card_id,
                    "cliente_id": cliente_id,
                    "motivo": dados.motivo,
                    "segmento": segmento,
                    "sequencia": "educacional_requalificacao",
                },
            )
        else:
            acao = "retencao_curta_lgpd"
            retencao_ate = hoje + timedelta(days=365)
            tarefa = self._repo.criar_tarefa(
                {
                    "card_id": card_id,
                    "cliente_id": cliente_id,
                    "usuario_id": user.id,
                    "titulo": "Revisar retenção LGPD deste lead",
                    "tipo": "lgpd_revisao",
                    "vencimento": retencao_ate.isoformat(),
                }
            )
            nutricao = None
            cliente_update = {
                "status": "desqualificado",
                "desqualificado_motivo": dados.motivo,
                "desqualificado_em": agora.isoformat(),
                "nutricao_segmento": None,
                "comunicacao_ativa": False,
                "retencao_ate": retencao_ate.isoformat(),
                "anonimizar_apos": retencao_ate.isoformat(),
            }
            webhook_ok = False

        self._repo.atualizar_cliente(cliente_id, cliente_update)
        atualizado = self._repo.atualizar(
            card_id,
            {
                "etapa": "desqualificados",
                "notas": dados.observacoes,
                "proximo_contato": None,
            },
        )
        desqualificacao = self._repo.registrar_desqualificacao(
            {
                "card_id": card_id,
                "cliente_id": cliente_id,
                "usuario_id": user.id,
                "motivo": dados.motivo,
                "checklist": checklist,
                "observacoes": dados.observacoes,
                "acao_automatica": acao,
                "retencao_ate": cliente_update.get("retencao_ate"),
                "anonimizar_apos": cliente_update.get("anonimizar_apos"),
            }
        )
        self._repo.registrar_atividade(
            card_id,
            user.id,
            "desqualificar_lead",
            {
                "motivo": dados.motivo,
                "acao_automatica": acao,
                "desqualificacao_id": desqualificacao["id"],
            },
        )

        return {
            "card_id": card_id,
            "cliente_id": cliente_id,
            "motivo": dados.motivo,
            "acao_automatica": acao,
            "tarefa_id": tarefa["id"],
            "nutricao_id": nutricao["id"] if nutricao else None,
            "webhook_disparado": webhook_ok,
            "card": atualizado,
        }

    def remover(self, card_id: str, user: CurrentUser) -> None:
        card = self.obter(card_id, user)
        if not pode_excluir_card(
            user.perfil,
            card.get("responsavel_id"),
            user.id,
            card.get("etapa"),
        ):
            raise ForbiddenError("Somente gestores podem excluir cards")
        self._repo.remover(card_id)
