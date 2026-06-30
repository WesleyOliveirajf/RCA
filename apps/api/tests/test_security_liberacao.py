import pytest

from rca_api.core.security import pode_mover_card, precisa_liberacao_para_mover


class TestPrecisaLiberacaoParaMover:
    def test_bloqueia_avanco_sem_liberacao(self):
        assert precisa_liberacao_para_mover("lead_qualificado", "negociacao", False) is True

    def test_permite_avanco_quando_liberado(self):
        assert precisa_liberacao_para_mover("lead_qualificado", "negociacao", True) is False

    def test_permite_retorno_no_funil(self):
        assert precisa_liberacao_para_mover("lead_qualificado", "primeiro_contato", False) is False

    def test_ignora_outras_etapas(self):
        assert precisa_liberacao_para_mover("negociacao", "pos_venda", False) is False


class TestPodeMoverCard:
    def test_vendedor_bloqueado_sem_liberacao(self):
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

    def test_vendedor_pode_avancar_apos_liberacao(self):
        assert (
            pode_mover_card(
                perfil="vendedor",
                responsavel_id="user-1",
                user_id="user-1",
                etapa_atual="lead_qualificado",
                etapa_destino="negociacao",
                liberado=True,
            )
            is True
        )
