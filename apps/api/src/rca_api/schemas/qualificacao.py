from datetime import datetime

from pydantic import BaseModel, Field


class AvaliacaoLead(BaseModel):
    score_interesse: int = Field(ge=1, le=5)
    score_volume: int = Field(ge=1, le=5)
    score_prazo: int = Field(ge=1, le=5)
    observacoes: str | None = None


class QualificacaoResponse(BaseModel):
    id: str
    card_id: str
    avaliador_id: str
    score_interesse: int
    score_volume: int
    score_prazo: int
    score_total: int
    aprovado: bool | None = None
    observacoes: str | None = None
    created_at: datetime


class AprovarLeadRequest(BaseModel):
    aprovado: bool
    observacoes: str | None = None
