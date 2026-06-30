import logging
from typing import Literal

Perfil = Literal["vendedor", "supervisor", "admin"]

ETAPAS_FUNIL_ABERTO = frozenset({"inativos", "primeiro_contato", "lead_qualificado"})

HIERARQUIA: dict[Perfil, int] = {
    "vendedor": 1,
    "supervisor": 2,
    "admin": 3,
}


def perfil_tem_acesso(perfil_usuario: Perfil, perfil_minimo: Perfil) -> bool:
    return HIERARQUIA.get(perfil_usuario, 0) >= HIERARQUIA.get(perfil_minimo, 99)


def pode_ver_card(
    perfil: Perfil,
    responsavel_id: str | None,
    user_id: str,
    etapa: str | None = None,
) -> bool:
    if etapa and etapa in ETAPAS_FUNIL_ABERTO:
        return True
    if perfil in ("supervisor", "admin"):
        return True
    return responsavel_id == user_id


def pode_mover_para_etapa(
    perfil: Perfil,
    responsavel_id: str | None,
    user_id: str,
    etapa_destino: str,
) -> bool:
    if etapa_destino in ETAPAS_FUNIL_ABERTO:
        return True
    if perfil in ("supervisor", "admin"):
        return True
    return responsavel_id == user_id


def pode_interagir_com_card(
    perfil: Perfil,
    responsavel_id: str | None,
    user_id: str,
    etapa_atual: str | None,
) -> bool:
    if etapa_atual and etapa_atual in ETAPAS_FUNIL_ABERTO:
        return True
    if perfil in ("supervisor", "admin"):
        return True
    return responsavel_id == user_id


def precisa_liberacao_para_mover(
    etapa_atual: str | None,
    etapa_destino: str,
    liberado: bool | None,
) -> bool:
    if etapa_atual != "lead_qualificado":
        return False
    if etapa_destino in ETAPAS_FUNIL_ABERTO:
        return False
    return not liberado


def pode_mover_card(
    perfil: Perfil,
    responsavel_id: str | None,
    user_id: str,
    etapa_atual: str | None,
    etapa_destino: str,
    liberado: bool | None = None,
) -> bool:
    if precisa_liberacao_para_mover(etapa_atual, etapa_destino, liberado):
        return False
    return pode_interagir_com_card(perfil, responsavel_id, user_id, etapa_atual) and pode_mover_para_etapa(
        perfil, responsavel_id, user_id, etapa_destino
    )
