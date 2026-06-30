from datetime import UTC, datetime

from rca_api.core.logging import get_logger
from rca_api.integrations.sisplan import buscar_clientes_inativos
from rca_api.repositories.cliente_repository import ClienteRepository
from rca_api.repositories.pipeline_repository import PipelineRepository
from rca_api.repositories.sync_repository import SyncLogRepository
from rca_api.services.prioridade_service import calcular_prioridade

logger = get_logger(__name__)


def _mapear_row(data: dict) -> dict:
    return {
        "sisplan_id": str(data["sisplan_id"]),
        "razao_social": data["razao_social"],
        "nome_fantasia": data.get("nome_fantasia"),
        "cnpj": data.get("cnpj"),
        "telefone": data.get("telefone"),
        "email": data.get("email"),
        "endereco": data.get("endereco"),
        "cidade": data.get("cidade"),
        "estado": data.get("estado"),
        "segmento": data.get("segmento"),
        "ultima_compra": data.get("ultima_compra"),
        "valor_historico": float(data.get("valor_historico") or 0),
        "qtd_compras": int(data.get("qtd_compras") or 0),
        "status": "inativo",
        "sincronizado_em": datetime.now(UTC).isoformat(),
    }


class SisplanSyncService:
    def __init__(
        self,
        cliente_repo: ClienteRepository,
        pipeline_repo: PipelineRepository,
        sync_repo: SyncLogRepository,
    ):
        self._cliente_repo = cliente_repo
        self._pipeline_repo = pipeline_repo
        self._sync_repo = sync_repo

    async def executar(self) -> dict:
        inicio = datetime.now(UTC)
        log = {"inicio": inicio.isoformat(), "status": "executando", "novos": 0, "atualizados": 0}

        min_meses = int(self._sync_repo.buscar_config("inatividade_meses_min", "6"))
        max_meses = int(self._sync_repo.buscar_config("inatividade_meses_max", "12"))

        try:
            rows = buscar_clientes_inativos(min_meses, max_meses)
            novos, atualizados = 0, 0

            for row in rows:
                cliente_data = _mapear_row(row)
                existente = self._cliente_repo.buscar_por_sisplan_id(cliente_data["sisplan_id"])

                if existente:
                    self._cliente_repo.atualizar(
                        existente["id"],
                        {
                            "razao_social": cliente_data["razao_social"],
                            "nome_fantasia": cliente_data.get("nome_fantasia"),
                            "cnpj": cliente_data.get("cnpj"),
                            "telefone": cliente_data.get("telefone"),
                            "email": cliente_data.get("email"),
                            "endereco": cliente_data.get("endereco"),
                            "cidade": cliente_data.get("cidade"),
                            "estado": cliente_data.get("estado"),
                            "segmento": cliente_data.get("segmento"),
                            "ultima_compra": cliente_data["ultima_compra"],
                            "valor_historico": cliente_data["valor_historico"],
                            "qtd_compras": cliente_data["qtd_compras"],
                            "sincronizado_em": cliente_data["sincronizado_em"],
                        },
                    )
                    atualizados += 1
                else:
                    novo = self._cliente_repo.inserir(cliente_data)
                    prioridade = calcular_prioridade(cliente_data)
                    if not self._pipeline_repo.buscar_por_cliente_id(novo["id"]):
                        card_payload = {
                            "cliente_id": novo["id"],
                            "etapa": "inativos",
                            "prioridade": prioridade,
                        }
                        admin = self._cliente_repo.buscar_primeiro_admin()
                        if admin:
                            card_payload["responsavel_id"] = admin["id"]
                        self._pipeline_repo.criar(card_payload)
                    novos += 1

            log.update({"status": "sucesso", "novos": novos, "atualizados": atualizados})

        except Exception as exc:
            logger.exception("Erro no sync SISPLAN")
            log.update({"status": "erro", "erro": str(exc)})

        log["fim"] = datetime.now(UTC).isoformat()
        return self._sync_repo.salvar(log)

    def status(self) -> dict | None:
        return self._sync_repo.ultimo()

    def logs(self, limite: int = 10) -> list[dict]:
        return self._sync_repo.listar_recentes(limite)
