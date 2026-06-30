-- Migration 007: Enforcement da política de liberação de leads
-- - Impede avanço de lead_qualificado sem liberação
-- - Protege colunas liberado* contra UPDATE direto por não-admins
-- - Hardening da RPC fn_liberar_lead (search_path)

-- ── Hardening RPC existente ──
CREATE OR REPLACE FUNCTION public.fn_liberar_lead(p_card_id UUID)
RETURNS public.pipeline_cards AS $$
DECLARE
  v_perfil TEXT;
  v_card public.pipeline_cards;
BEGIN
  SELECT perfil INTO v_perfil
    FROM public.usuarios
    WHERE id = auth.uid();

  IF v_perfil IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Apenas administradores podem liberar leads';
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

-- ── Impede mover lead não liberado para etapas pós-funil ──
CREATE OR REPLACE FUNCTION public.fn_validar_movimentacao_liberacao()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.etapa = 'lead_qualificado'
     AND NEW.etapa IS DISTINCT FROM OLD.etapa
     AND NEW.etapa NOT IN ('inativos', 'primeiro_contato', 'lead_qualificado')
     AND COALESCE(OLD.liberado, false) = false THEN
    RAISE EXCEPTION 'Lead precisa ser liberado por um administrador antes de avançar';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validar_movimentacao_liberacao ON public.pipeline_cards;
CREATE TRIGGER trg_validar_movimentacao_liberacao
  BEFORE UPDATE OF etapa ON public.pipeline_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_validar_movimentacao_liberacao();

-- ── Protege colunas liberado* contra UPDATE direto ──
CREATE OR REPLACE FUNCTION public.fn_proteger_liberacao()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.liberado IS NOT DISTINCT FROM OLD.liberado
     AND NEW.liberado_por IS NOT DISTINCT FROM OLD.liberado_por
     AND NEW.liberado_em IS NOT DISTINCT FROM OLD.liberado_em THEN
    RETURN NEW;
  END IF;

  -- Reset automático ao sair de lead_qualificado (trigger fn_reset_liberacao)
  IF OLD.etapa = 'lead_qualificado'
     AND NEW.etapa IS DISTINCT FROM OLD.etapa
     AND NEW.etapa != 'lead_qualificado' THEN
    RETURN NEW;
  END IF;

  -- Backend com service_role (auth.uid() nulo) — validação feita na API
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF public.fn_meu_perfil() IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar o status de liberação';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_proteger_liberacao ON public.pipeline_cards;
CREATE TRIGGER trg_proteger_liberacao
  BEFORE UPDATE ON public.pipeline_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_proteger_liberacao();
