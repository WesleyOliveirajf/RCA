-- Sincroniza clientes.status com pipeline_cards.etapa para alinhar
-- a listagem de Clientes com a movimentação do pipeline.

CREATE OR REPLACE FUNCTION public.fn_etapa_para_status(p_etapa TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_etapa
    WHEN 'inativos' THEN 'inativo'
    WHEN 'primeiro_contato' THEN 'em_contato'
    WHEN 'lead_qualificado' THEN 'qualificado'
    WHEN 'negociacao' THEN 'negociando'
    WHEN 'pos_venda' THEN 'reativado'
    WHEN 'banco_potenciais' THEN 'descartado'
    WHEN 'desqualificados' THEN 'desqualificado'
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.fn_sync_cliente_status_from_etapa()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
BEGIN
  IF NEW.cliente_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_status := public.fn_etapa_para_status(NEW.etapa);
  IF v_status IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' OR NEW.etapa IS DISTINCT FROM OLD.etapa THEN
    UPDATE public.clientes
    SET status = v_status
    WHERE id = NEW.cliente_id
      AND status IS DISTINCT FROM v_status;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_cliente_status_from_etapa ON public.pipeline_cards;

CREATE TRIGGER trg_sync_cliente_status_from_etapa
  AFTER INSERT OR UPDATE OF etapa ON public.pipeline_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_sync_cliente_status_from_etapa();

-- Corrige registros existentes cujo status não reflete a etapa atual do card.
UPDATE public.clientes c
SET status = public.fn_etapa_para_status(pc.etapa)
FROM public.pipeline_cards pc
WHERE pc.cliente_id = c.id
  AND public.fn_etapa_para_status(pc.etapa) IS NOT NULL
  AND c.status IS DISTINCT FROM public.fn_etapa_para_status(pc.etapa);
