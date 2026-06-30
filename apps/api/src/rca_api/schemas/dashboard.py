from datetime import datetime

from pydantic import BaseModel


class SyncLogResponse(BaseModel):
    id: str
    inicio: datetime
    fim: datetime | None = None
    status: str
    novos: int = 0
    atualizados: int = 0
    erro: str | None = None


class SyncStatusResponse(BaseModel):
    ultima_sync: datetime | None = None
    status: str | None = None
    proxima_execucao: datetime | None = None


class EtapaResumo(BaseModel):
    etapa: str
    total: int
    valor_medio: float = 0
    tempo_medio_dias: float = 0


class FunilResumo(BaseModel):
    etapas: list[EtapaResumo]
    total_clientes: int
    taxa_conversao: float
    valor_pipeline: float
