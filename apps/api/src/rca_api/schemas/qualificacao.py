from datetime import datetime

from pydantic import BaseModel, Field


class AvaliacaoLead(BaseModel):
    aprovado: bool = True
    score_interesse: int | None = Field(default=None, ge=1, le=5)
    score_volume: int | None = Field(default=None, ge=1, le=5)
    score_prazo: int | None = Field(default=None, ge=1, le=5)
    observacoes: str | None = None


class QualificacaoResponse(BaseModel):
    id: str
    card_id: str
    avaliador_id: str
    score_interesse: int | None = None
    score_volume: int | None = None
    score_prazo: int | None = None
    score_total: int | None = None
    aprovado: bool | None = None
    observacoes: str | None = None
    created_at: datetime


class AprovarLeadRequest(BaseModel):
    aprovado: bool
    observacoes: str | None = None
