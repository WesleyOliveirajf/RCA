from rca_api.core.exceptions import NotFoundError
from rca_api.repositories.cliente_repository import ClienteRepository
from rca_api.schemas.cliente import ClienteCreate, ClienteFilter, ClienteUpdate


class ClienteService:
    def __init__(self, repo: ClienteRepository):
        self._repo = repo

    def listar(self, filtros: ClienteFilter) -> list[dict]:
        return self._repo.listar(filtros)

    def obter(self, cliente_id: str) -> dict:
        cliente = self._repo.buscar_por_id(cliente_id)
        if not cliente:
            raise NotFoundError("Cliente")
        return cliente

    def criar(self, dados: ClienteCreate) -> dict:
        return self._repo.inserir(dados.model_dump(exclude_none=True))

    def atualizar(self, cliente_id: str, dados: ClienteUpdate) -> dict:
        self.obter(cliente_id)
        return self._repo.atualizar(cliente_id, dados.model_dump(exclude_none=True))

    def historico(self, cliente_id: str) -> list[dict]:
        self.obter(cliente_id)
        return self._repo.historico_compras(cliente_id)
