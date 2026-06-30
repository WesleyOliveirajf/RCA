-- Migration 006: Política de Liberação de Leads
-- Somente admins podem liberar leads na etapa 'lead_qualificado'
-- Cards ficam em vermelho (bloqueados) até serem liberados (verde)

-- ── Novas colunas na pipeline_cards ──
ALTER TABLE public.pipeline_cards
  ADD COLUMN IF NOT EXISTS liberado BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS liberado_por UUID REFERENCES public.usuarios(id),
  ADD COLUMN IF NOT EXISTS liberado_em TIMESTAMPTZ;

-- ── Índice para consultas de cards não liberados ──
CREATE INDEX IF NOT EXISTS idx_cards_liberado ON public.pipeline_cards(liberado);

-- ── RPC: Somente admin pode liberar um lead ──
CREATE OR REPLACE FUNCTION public.fn_liberar_lead(p_card_id UUID)
RETURNS public.pipeline_cards AS $$
DECLARE
  v_perfil TEXT;
  v_card public.pipeline_cards;
BEGIN
  -- Verifica se o usuário é admin
  SELECT perfil INTO v_perfil
    FROM public.usuarios
    WHERE id = auth.uid();

  IF v_perfil IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Apenas administradores podem liberar leads';
  END IF;

  -- Verifica se o card está na etapa lead_qualificado
  SELECT * INTO v_card
    FROM public.pipeline_cards
    WHERE id = p_card_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Card não encontrado';
  END IF;

  IF v_card.etapa != 'lead_qualificado' THEN
    RAISE EXCEPTION 'O card precisa estar na etapa Lead Qualificado para ser liberado';
  END IF;

  IF v_card.liberado = true THEN
    RAISE EXCEPTION 'Este lead já foi liberado';
  END IF;

  -- Libera o lead
  UPDATE public.pipeline_cards
    SET liberado = true,
        liberado_por = auth.uid(),
        liberado_em = now()
    WHERE id = p_card_id
    RETURNING * INTO v_card;

  -- Registra atividade
  INSERT INTO public.atividades (card_id, usuario_id, acao, detalhes)
  VALUES (
    p_card_id,
    auth.uid(),
    'liberar_lead',
    jsonb_build_object('etapa', 'lead_qualificado')
  );

  RETURN v_card;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garante que a coluna liberado volta para false quando o card muda de etapa
CREATE OR REPLACE FUNCTION public.fn_reset_liberacao()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.etapa = 'lead_qualificado' AND NEW.etapa != 'lead_qualificado' THEN
    NEW.liberado := false;
    NEW.liberado_por := NULL;
    NEW.liberado_em := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reset_liberacao
  BEFORE UPDATE OF etapa ON public.pipeline_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_reset_liberacao();
