-- Funil aberto até Lead qualificado: qualquer usuário autenticado
-- pode ver e mover cards nas etapas inativos, primeiro_contato e lead_qualificado.

DROP POLICY IF EXISTS "cards_select_own_or_supervisor" ON public.pipeline_cards;
DROP POLICY IF EXISTS "cards_update_own_or_supervisor" ON public.pipeline_cards;

CREATE POLICY "cards_select_funil_aberto_ou_responsavel"
  ON public.pipeline_cards FOR SELECT TO authenticated
  USING (
    etapa IN ('inativos', 'primeiro_contato', 'lead_qualificado')
    OR responsavel_id = auth.uid()
    OR public.fn_meu_perfil() IN ('supervisor', 'admin')
  );

CREATE POLICY "cards_update_funil_aberto_ou_responsavel"
  ON public.pipeline_cards FOR UPDATE TO authenticated
  USING (
    etapa IN ('inativos', 'primeiro_contato', 'lead_qualificado')
    OR responsavel_id = auth.uid()
    OR public.fn_meu_perfil() IN ('supervisor', 'admin')
  )
  WITH CHECK (
    etapa IN ('inativos', 'primeiro_contato', 'lead_qualificado')
    OR responsavel_id = auth.uid()
    OR public.fn_meu_perfil() IN ('supervisor', 'admin')
  );
