from typing import Literal
Perfil = Literal["vendedor", "supervisor", "admin", "superadmin"]

ETAPAS_FUNIL_ABERTO = frozenset({"inativos", "primeiro_contato", "em_analise", "lead_qualificado"})

HIERARQUIA: dict[Perfil, int] = {
    "vendedor": 1,
    "supervisor": 2,
    "admin": 3,
    "superadmin": 4,
}


def perfil_tem_acesso(perfil_usuario: Perfil, perfil_minimo: Perfil) -> bool:
    return HIERARQUIA.get(perfil_usuario, 0) >= HIERARQUIA.get(perfil_minimo, 99)


def _eh_gestor(perfil: Perfil) -> bool:
    return perfil in ("supervisor", "admin", "superadmin")


def pode_ver_card(
    perfil: Perfil,
    responsavel_id: str | None,
    user_id: str,
    etapa: str | None = None,
) -> bool:
    return True


def pode_excluir_card(
    perfil: Perfil,
    responsavel_id: str | None,
    user_id: str,
    etapa: str | None = None,
) -> bool:
    return True


def pode_acessar_cliente(
    perfil: Perfil,
    user_id: str,
    cards: list[dict],
) -> bool:
    return True


def pode_mover_para_etapa(
    perfil: Perfil,
    responsavel_id: str | None,
    user_id: str,
    etapa_destino: str,
) -> bool:
    return True


def pode_interagir_com_card(
    perfil: Perfil,
    responsavel_id: str | None,
    user_id: str,
    etapa_atual: str | None,
) -> bool:
    return True


def precisa_liberacao_para_mover(
    etapa_atual: str | None,
    etapa_destino: str,
    liberado: bool | None,
) -> bool:
    return False


def pode_mover_card(
    perfil: Perfil,
    responsavel_id: str | None,
    user_id: str,
    etapa_atual: str | None,
    etapa_destino: str,
    liberado: bool | None = None,
) -> bool:
    return True
