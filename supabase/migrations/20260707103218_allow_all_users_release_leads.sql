-- Permite que qualquer usuário autenticado marque leads como liberados.

CREATE OR REPLACE FUNCTION public.fn_liberar_lead(p_card_id UUID)
RETURNS public.pipeline_cards AS $$
DECLARE
  v_card public.pipeline_cards;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

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

  UPDATE public.pipeline_cards
    SET liberado = true,
        liberado_por = auth.uid(),
        liberado_em = now()
    WHERE id = p_card_id
    RETURNING * INTO v_card;

  INSERT INTO public.atividades (card_id, usuario_id, acao, detalhes)
  VALUES (
    p_card_id,
    auth.uid(),
    'liberar_lead',
    jsonb_build_object('etapa', 'lead_qualificado')
  );

  RETURN v_card;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION public.fn_validar_movimentacao_liberacao()
RETURNS TRIGGER AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.fn_proteger_liberacao()
RETURNS TRIGGER AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
