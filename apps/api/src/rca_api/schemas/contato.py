from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

TipoContato = Literal["ligacao", "whatsapp", "email", "visita", "pos_venda", "sistema"]
ResultadoContato = Literal[
    "sem_resposta",
    "interessado",
    "sem_interesse",
    "agendar_retorno",
    "pedido_realizado",
    "reclamacao",
    "outro",
]


class ContatoCreate(BaseModel):
    cliente_id: str
    card_id: str | None = None
    tipo: TipoContato
    nome_contato: str | None = None
    area_contato: str | None = None
    resumo: str = Field(min_length=3)
    resultado: ResultadoContato | None = None
    duracao_minutos: int | None = Field(default=None, ge=0)
    proximo_contato: date | None = None


class ContatoUpdate(BaseModel):
    tipo: TipoContato | None = None
    nome_contato: str | None = None
    area_contato: str | None = None
    resumo: str | None = Field(default=None, min_length=3)
    resultado: ResultadoContato | None = None
    duracao_minutos: int | None = Field(default=None, ge=0)


class ContatoResponse(BaseModel):
    id: str
    cliente_id: str
    card_id: str | None = None
    usuario_id: str
    tipo: TipoContato
    nome_contato: str | None = None
    area_contato: str | None = None
    resumo: str
    resultado: ResultadoContato | None = None
    duracao_minutos: int | None = None
    data_contato: datetime


class ContatoPendenteResponse(BaseModel):
    card_id: str
    nome_fantasia: str | None
    telefone: str | None
    etapa: str
    prioridade: str
    proximo_contato: date
    responsavel: str | None = None
