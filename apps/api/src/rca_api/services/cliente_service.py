from rca_api.core.exceptions import ForbiddenError, NotFoundError
from rca_api.core.security import pode_acessar_cliente
from rca_api.repositories.cliente_repository import ClienteRepository
from rca_api.repositories.pipeline_repository import PipelineRepository
from rca_api.schemas.auth import CurrentUser
from rca_api.schemas.cliente import ClienteCreate, ClienteFilter, ClienteUpdate


class ClienteService:
    def __init__(self, repo: ClienteRepository, pipeline_repo: PipelineRepository):
        self._repo = repo
        self._pipeline_repo = pipeline_repo

    def _validar_acesso(self, user: CurrentUser, cliente_id: str) -> None:
        if user.perfil in ("supervisor", "admin", "superadmin"):
            return
        cards = self._pipeline_repo.listar_por_cliente(cliente_id)
        if not pode_acessar_cliente(user.perfil, user.id, cards):
            raise ForbiddenError("Sem permissão para acessar este cliente")

    def listar(self, filtros: ClienteFilter, user: CurrentUser) -> list[dict]:
        if user.perfil in ("supervisor", "admin", "superadmin"):
            return self._repo.listar(filtros)
        cliente_ids = self._pipeline_repo.listar_cliente_ids_acessiveis(user.id)
        if not cliente_ids:
            return []
        return self._repo.listar(filtros, cliente_ids=cliente_ids)

    def obter(self, cliente_id: str, user: CurrentUser) -> dict:
        self._validar_acesso(user, cliente_id)
        cliente = self._repo.buscar_por_id(cliente_id)
        if not cliente:
            raise NotFoundError("Cliente")
        return cliente

    def criar(self, dados: ClienteCreate, user: CurrentUser) -> dict:
        if user.perfil not in ("supervisor", "admin", "superadmin", "vendedor"):
            raise ForbiddenError("Sem permissão para criar clientes")
        payload = dados.model_dump(mode="json", exclude_none=True)
        cliente = self._repo.inserir(payload)
        self._pipeline_repo.criar(
            {
                "cliente_id": cliente["id"],
                "etapa": "inativos",
                "responsavel_id": user.id,
                "prioridade": "media",
                "posicao": 0,
                "score": 0,
            }
        )
        return cliente

    def atualizar(self, cliente_id: str, dados: ClienteUpdate, user: CurrentUser) -> dict:
        self._validar_acesso(user, cliente_id)
        return self._repo.atualizar(cliente_id, dados.model_dump(mode="json", exclude_none=True))

    def historico(self, cliente_id: str, user: CurrentUser) -> list[dict]:
        self._validar_acesso(user, cliente_id)
        return self._repo.historico_compras(cliente_id)
