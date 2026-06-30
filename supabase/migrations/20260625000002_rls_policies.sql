-- Migration 002: Row Level Security (RLS)

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qualificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper: perfil do usuário autenticado
CREATE OR REPLACE FUNCTION public.fn_meu_perfil()
RETURNS TEXT AS $$
  SELECT perfil FROM public.usuarios WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- USUARIOS
CREATE POLICY "usuarios_select_authenticated"
  ON public.usuarios FOR SELECT TO authenticated USING (true);

CREATE POLICY "usuarios_admin_all"
  ON public.usuarios FOR ALL TO authenticated
  USING (public.fn_meu_perfil() = 'admin')
  WITH CHECK (public.fn_meu_perfil() = 'admin');

-- CLIENTES
CREATE POLICY "clientes_select_authenticated"
  ON public.clientes FOR SELECT TO authenticated USING (true);

CREATE POLICY "clientes_update_authenticated"
  ON public.clientes FOR UPDATE TO authenticated USING (true);

-- PIPELINE CARDS
CREATE POLICY "cards_select_own_or_supervisor"
  ON public.pipeline_cards FOR SELECT TO authenticated
  USING (
    responsavel_id = auth.uid()
    OR public.fn_meu_perfil() IN ('supervisor', 'admin')
  );

CREATE POLICY "cards_insert_authenticated"
  ON public.pipeline_cards FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "cards_update_own_or_supervisor"
  ON public.pipeline_cards FOR UPDATE TO authenticated
  USING (
    responsavel_id = auth.uid()
    OR public.fn_meu_perfil() IN ('supervisor', 'admin')
  );

CREATE POLICY "cards_delete_supervisor"
  ON public.pipeline_cards FOR DELETE TO authenticated
  USING (public.fn_meu_perfil() IN ('supervisor', 'admin'));

-- CONTATOS
CREATE POLICY "contatos_select_authenticated"
  ON public.contatos FOR SELECT TO authenticated USING (true);

CREATE POLICY "contatos_insert_authenticated"
  ON public.contatos FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid());

-- HISTORICO COMPRAS (read-only para usuários)
CREATE POLICY "historico_select_authenticated"
  ON public.historico_compras FOR SELECT TO authenticated USING (true);

-- QUALIFICACOES
CREATE POLICY "qualificacoes_select_authenticated"
  ON public.qualificacoes FOR SELECT TO authenticated USING (true);

CREATE POLICY "qualificacoes_insert_authenticated"
  ON public.qualificacoes FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "qualificacoes_update_supervisor"
  ON public.qualificacoes FOR UPDATE TO authenticated
  USING (public.fn_meu_perfil() IN ('supervisor', 'admin'));

-- CONFIGURACOES (somente admin)
CREATE POLICY "config_select_admin"
  ON public.configuracoes FOR SELECT TO authenticated
  USING (public.fn_meu_perfil() = 'admin');

CREATE POLICY "config_update_admin"
  ON public.configuracoes FOR UPDATE TO authenticated
  USING (public.fn_meu_perfil() = 'admin');

-- ATIVIDADES
CREATE POLICY "atividades_select_authenticated"
  ON public.atividades FOR SELECT TO authenticated USING (true);

CREATE POLICY "atividades_insert_authenticated"
  ON public.atividades FOR INSERT TO authenticated WITH CHECK (usuario_id = auth.uid());

-- SYNC LOGS (somente admin via API service role; leitura admin)
CREATE POLICY "sync_logs_select_admin"
  ON public.sync_logs FOR SELECT TO authenticated
  USING (public.fn_meu_perfil() = 'admin');

-- AUDIT LOGS (somente admin)
CREATE POLICY "audit_logs_select_admin"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (public.fn_meu_perfil() = 'admin');

-- Realtime: habilitar replica identity para pipeline_cards
ALTER TABLE public.pipeline_cards REPLICA IDENTITY FULL;
