from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

StatusCliente = Literal[
    "inativo",
    "em_contato",
    "qualificado",
    "negociando",
    "reativado",
    "descartado",
    "desqualificado",
]
EtapaPipeline = str
Prioridade = Literal["baixa", "media", "alta", "urgente"]


class ClienteBase(BaseModel):
    razao_social: str
    nome_fantasia: str | None = None
    cnpj: str | None = None
    telefone: str | None = None
    email: str | None = None
    cidade: str | None = None
    estado: str | None = None
    segmento: str | None = None
    nome_contato: str | None = None
    tags: list[str] = Field(default_factory=list)


class ClienteCreate(ClienteBase):
    sisplan_id: str | None = None
    endereco: str | None = None
    ultima_compra: date | None = None
    valor_historico: Decimal = Decimal("0")
    qtd_compras: int = Field(default=0, ge=0)
    status: StatusCliente = "inativo"
    origem_inatividade: str | None = None


class ClienteResponse(ClienteBase):
    id: str
    sisplan_id: str | None = None
    ultima_compra: date | None = None
    valor_historico: Decimal = Decimal("0")
    qtd_compras: int = 0
    status: StatusCliente = "inativo"
    sincronizado_em: datetime | None = None


class ClienteFilter(BaseModel):
    status: StatusCliente | None = None
    cidade: str | None = None
    segmento: str | None = None
    ordem: str = "ultima_compra"
    direcao: Literal["asc", "desc"] = "asc"
    limite: int = Field(default=50, ge=1, le=200)
    offset: int = Field(default=0, ge=0)


class ClienteUpdate(BaseModel):
    razao_social: str | None = None
    nome_fantasia: str | None = None
    cnpj: str | None = None
    telefone: str | None = None
    email: str | None = None
    endereco: str | None = None
    cidade: str | None = None
    estado: str | None = None
    segmento: str | None = None
    tags: list[str] | None = None
    status: StatusCliente | None = None
    ultima_compra: date | None = None
    valor_historico: Decimal | None = None
    qtd_compras: int | None = Field(default=None, ge=0)
    origem_inatividade: str | None = None


class HistoricoCompraResponse(BaseModel):
    id: str
    data_pedido: date
    valor: Decimal
    itens: list[dict] | None = None
    status_pedido: str
