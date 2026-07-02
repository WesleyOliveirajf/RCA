from rca_api.core.exceptions import ForbiddenError, NotFoundError
from rca_api.core.security import pode_acessar_cliente, pode_ver_card
from rca_api.repositories.contato_repository import ContatoRepository
from rca_api.repositories.pipeline_repository import PipelineRepository
from rca_api.schemas.auth import CurrentUser
from rca_api.schemas.contato import ContatoCreate, ContatoUpdate


class ContatoService:
    def __init__(self, contato_repo: ContatoRepository, pipeline_repo: PipelineRepository):
        self._contato_repo = contato_repo
        self._pipeline_repo = pipeline_repo

    def _validar_acesso_cliente(self, user: CurrentUser, cliente_id: str) -> None:
        if user.perfil in ("supervisor", "admin", "superadmin"):
            return
        cards = self._pipeline_repo.listar_por_cliente(cliente_id)
        if not pode_acessar_cliente(user.perfil, user.id, cards):
            raise ForbiddenError("Sem permissão para acessar contatos deste cliente")

    def _validar_acesso_contato(self, user: CurrentUser, contato: dict) -> None:
        if contato.get("usuario_id") == user.id:
            return
        self._validar_acesso_cliente(user, contato["cliente_id"])

    def listar_por_cliente(self, cliente_id: str, user: CurrentUser) -> list[dict]:
        self._validar_acesso_cliente(user, cliente_id)
        return self._contato_repo.listar_por_cliente(cliente_id)

    def obter(self, contato_id: str, user: CurrentUser) -> dict:
        contato = self._contato_repo.buscar_por_id(contato_id)
        if not contato:
            raise NotFoundError("Contato")
        self._validar_acesso_contato(user, contato)
        return contato

    def criar(self, dados: ContatoCreate, user: CurrentUser) -> dict:
        self._validar_acesso_cliente(user, dados.cliente_id)
        payload = dados.model_dump(exclude={"proximo_contato"})
        payload["usuario_id"] = user.id
        contato = self._contato_repo.criar(payload)

        if dados.proximo_contato and dados.card_id:
            card = self._pipeline_repo.buscar_por_id(dados.card_id)
            if not card or not pode_ver_card(
                user.perfil,
                card.get("responsavel_id"),
                user.id,
                card.get("etapa"),
            ):
                raise ForbiddenError("Sem permissão para atualizar este card")
            self._pipeline_repo.atualizar(
                dados.card_id,
                {"proximo_contato": dados.proximo_contato.isoformat()},
            )

        return contato

    def atualizar(self, contato_id: str, dados: ContatoUpdate, user: CurrentUser) -> dict:
        contato = self.obter(contato_id, user)
        if contato.get("usuario_id") != user.id and user.perfil not in (
            "supervisor",
            "admin",
            "superadmin",
        ):
            raise ForbiddenError("Somente o autor ou gestores podem editar este contato")
        return self._contato_repo.atualizar(contato_id, dados.model_dump(exclude_none=True))

    def pendentes_hoje(self, user: CurrentUser) -> list[dict]:
        if user.perfil in ("supervisor", "admin", "superadmin"):
            return self._contato_repo.pendentes_hoje()
        return self._contato_repo.pendentes_hoje(user.id)
