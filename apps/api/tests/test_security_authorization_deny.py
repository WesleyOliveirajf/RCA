"""Testes de NEGAÇÃO para core.security.

A suíte existente (test_security_liberacao.py) só cobre casos permitidos.
Estes testes cobrem os casos que DEVEM ser negados, para detectar
regressões como a introduzida no commit 26f53ee, que reduziu todas as
funções de autorização a stubs que sempre retornam True/False fixo.
"""

from rca_api.core.security import (
    pode_acessar_cliente,
    pode_excluir_card,
    pode_mover_card,
    pode_mover_para_etapa,
    pode_ver_card,
    precisa_liberacao_para_mover,
)


class TestPodeVerCardNega:
    def test_vendedor_nao_ve_card_fechado_de_outro(self):
        assert (
            pode_ver_card(
                perfil="vendedor",
                responsavel_id="user-1",
                user_id="user-2",
                etapa="negociacao",
            )
            is False
        )


class TestPodeExcluirCardNega:
    def test_vendedor_nao_pode_excluir_card_de_outro(self):
        assert (
            pode_excluir_card(
                perfil="vendedor",
                responsavel_id="user-1",
                user_id="user-2",
                etapa="negociacao",
            )
            is False
        )

    def test_vendedor_nao_pode_excluir_proprio_card(self):
        assert (
            pode_excluir_card(
                perfil="vendedor",
                responsavel_id="user-1",
                user_id="user-1",
                etapa="negociacao",
            )
            is False
        )


class TestPodeAcessarClienteNega:
    def test_vendedor_sem_cards_associados_nao_acessa_cliente(self):
        cards = [{"responsavel_id": "user-1", "etapa": "negociacao"}]
        assert (
            pode_acessar_cliente(perfil="vendedor", user_id="user-2", cards=cards)
            is False
        )


class TestPodeMoverParaEtapaNega:
    def test_vendedor_nao_move_card_de_outro_para_etapa_fechada(self):
        assert (
            pode_mover_para_etapa(
                perfil="vendedor",
                responsavel_id="user-1",
                user_id="user-2",
                etapa_destino="negociacao",
            )
            is False
        )


class TestPrecisaLiberacaoParaMoverNega:
    def test_exige_liberacao_para_sair_de_lead_qualificado_para_negociacao(self):
        assert (
            precisa_liberacao_para_mover(
                etapa_atual="lead_qualificado",
                etapa_destino="negociacao",
                liberado=False,
            )
            is True
        )


class TestPodeMoverCardNega:
    def test_bloqueia_avanco_sem_liberacao(self):
        assert (
            pode_mover_card(
                perfil="vendedor",
                responsavel_id="user-1",
                user_id="user-1",
                etapa_atual="lead_qualificado",
                etapa_destino="negociacao",
                liberado=False,
            )
            is False
        )

    def test_bloqueia_vendedor_movendo_card_de_outro(self):
        assert (
            pode_mover_card(
                perfil="vendedor",
                responsavel_id="user-1",
                user_id="user-2",
                etapa_atual="negociacao",
                etapa_destino="pos_venda",
                liberado=True,
            )
            is False
        )
