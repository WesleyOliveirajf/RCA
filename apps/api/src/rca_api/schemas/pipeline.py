from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

from rca_api.schemas.cliente import EtapaPipeline, Prioridade

MotivoDesqualificacao = Literal["timing_ruim", "decisor_errado", "nao_icp", "outro"]


class ChecklistDesqualificacao(BaseModel):
    necessidade_identificada: bool
    potencial_ou_orcamento_validado: bool
    decisor_mapeado: bool
    timing_mapeado: bool


class PipelineCardResponse(BaseModel):
    id: str
    cliente_id: str
    etapa: EtapaPipeline
    responsavel_id: str | None = None
    score: int = 0
    prioridade: Prioridade = "media"
    posicao: int = 0
    proximo_contato: date | None = None
    notas: str | None = None
    valor_proposta: Decimal | None = None
    liberado: bool = False
    liberado_por: str | None = None
    liberado_em: datetime | None = None
    tem_interesse: bool | None = None
    catalogo_enviado: bool | None = None
    atualizacao_cadastral: bool | None = None
    tipo_contato_cliente: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class PipelineCardCreate(BaseModel):
    cliente_id: str
    responsavel_id: str | None = None


class PipelineCardUpdate(BaseModel):
    notas: str | None = None
    prioridade: Prioridade | None = None
    proximo_contato: date | None = None
    valor_proposta: Decimal | None = None
    responsavel_id: str | None = None
    tem_interesse: bool | None = None
    catalogo_enviado: bool | None = None
    atualizacao_cadastral: bool | None = None
    tipo_contato_cliente: str | None = None


class MoverCardRequest(BaseModel):
    etapa_destino: EtapaPipeline
    posicao: int | None = None
    notas: str | None = None


class MoverCardResponse(BaseModel):
    card_id: str
    etapa_anterior: EtapaPipeline
    etapa_nova: EtapaPipeline
    webhook_disparado: bool = False


class LiberarLeadResponse(BaseModel):
    card_id: str
    liberado: bool = True
    liberado_por: str
    liberado_em: datetime


class DesqualificarLeadRequest(BaseModel):
    motivo: MotivoDesqualificacao
    checklist: ChecklistDesqualificacao
    observacoes: str = Field(min_length=10)


class DesqualificarLeadResponse(BaseModel):
    card_id: str
    cliente_id: str
    motivo: MotivoDesqualificacao
    acao_automatica: str
    tarefa_id: str | None = None
    nutricao_id: str | None = None
    webhook_disparado: bool = False
    card: PipelineCardResponse


class PipelineGroupedResponse(BaseModel):
    etapas: dict[EtapaPipeline, list[PipelineCardResponse]]
