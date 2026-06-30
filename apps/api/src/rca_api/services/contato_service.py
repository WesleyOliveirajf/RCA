from rca_api.core.exceptions import NotFoundError
from rca_api.repositories.contato_repository import ContatoRepository
from rca_api.repositories.pipeline_repository import PipelineRepository
from rca_api.schemas.auth import CurrentUser
from rca_api.schemas.contato import ContatoCreate, ContatoUpdate


class ContatoService:
    def __init__(self, contato_repo: ContatoRepository, pipeline_repo: PipelineRepository):
        self._contato_repo = contato_repo
        self._pipeline_repo = pipeline_repo

    def listar_por_cliente(self, cliente_id: str) -> list[dict]:
        return self._contato_repo.listar_por_cliente(cliente_id)

    def obter(self, contato_id: str) -> dict:
        contato = self._contato_repo.buscar_por_id(contato_id)
        if not contato:
            raise NotFoundError("Contato")
        return contato

    def criar(self, dados: ContatoCreate, user: CurrentUser) -> dict:
        payload = dados.model_dump(exclude={"proximo_contato"})
        payload["usuario_id"] = user.id
        contato = self._contato_repo.criar(payload)

        if dados.proximo_contato and dados.card_id:
            self._pipeline_repo.atualizar(
                dados.card_id,
                {"proximo_contato": dados.proximo_contato.isoformat()},
            )

        return contato

    def atualizar(self, contato_id: str, dados: ContatoUpdate) -> dict:
        self.obter(contato_id)
        return self._contato_repo.atualizar(contato_id, dados.model_dump(exclude_none=True))

    def pendentes_hoje(self) -> list[dict]:
        return self._contato_repo.pendentes_hoje()
