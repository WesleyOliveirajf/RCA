-- Migration 011: Incluir superadmin nas policies de pipeline_cards
-- SuperAdmin via frontend enxergava só funil aberto; dashboard (API service role) mostrava tudo.

DROP POLICY IF EXISTS "cards_select_funil_aberto_ou_responsavel" ON public.pipeline_cards;
DROP POLICY IF EXISTS "cards_update_funil_aberto_ou_responsavel" ON public.pipeline_cards;
DROP POLICY IF EXISTS "cards_delete_supervisor" ON public.pipeline_cards;

CREATE POLICY "cards_select_funil_aberto_ou_responsavel"
  ON public.pipeline_cards FOR SELECT TO authenticated
  USING (
    etapa IN ('inativos', 'primeiro_contato', 'lead_qualificado')
    OR responsavel_id = auth.uid()
    OR public.fn_meu_perfil() IN ('supervisor', 'admin', 'superadmin')
  );

CREATE POLICY "cards_update_funil_aberto_ou_responsavel"
  ON public.pipeline_cards FOR UPDATE TO authenticated
  USING (
    etapa IN ('inativos', 'primeiro_contato', 'lead_qualificado')
    OR responsavel_id = auth.uid()
    OR public.fn_meu_perfil() IN ('supervisor', 'admin', 'superadmin')
  )
  WITH CHECK (
    etapa IN ('inativos', 'primeiro_contato', 'lead_qualificado')
    OR responsavel_id = auth.uid()
    OR public.fn_meu_perfil() IN ('supervisor', 'admin', 'superadmin')
  );

CREATE POLICY "cards_delete_supervisor"
  ON public.pipeline_cards FOR DELETE TO authenticated
  USING (public.fn_meu_perfil() IN ('supervisor', 'admin', 'superadmin'));

-- SuperAdmin também pode liberar leads
CREATE OR REPLACE FUNCTION public.fn_proteger_liberacao()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.liberado IS NOT DISTINCT FROM NEW.liberado THEN
    RETURN NEW;
  END IF;

  IF OLD.etapa = 'lead_qualificado'
     AND NEW.etapa IS DISTINCT FROM OLD.etapa
     AND NEW.etapa != 'lead_qualificado' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF public.fn_meu_perfil() NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar o status de liberação';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
