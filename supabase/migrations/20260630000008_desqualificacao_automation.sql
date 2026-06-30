-- Migration 008: Automação de desqualificação de leads

ALTER TABLE public.clientes
  DROP CONSTRAINT IF EXISTS clientes_status_check;

ALTER TABLE public.clientes
  ADD CONSTRAINT clientes_status_check CHECK (
    status IN (
      'inativo', 'em_contato', 'qualificado', 'negociando',
      'reativado', 'descartado', 'desqualificado'
    )
  );

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS desqualificado_motivo TEXT,
  ADD COLUMN IF NOT EXISTS desqualificado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS nutricao_segmento TEXT,
  ADD COLUMN IF NOT EXISTS comunicacao_ativa BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS retencao_ate DATE,
  ADD COLUMN IF NOT EXISTS anonimizar_apos DATE;

ALTER TABLE public.pipeline_cards
  DROP CONSTRAINT IF EXISTS pipeline_cards_etapa_check;

ALTER TABLE public.pipeline_cards
  ADD CONSTRAINT pipeline_cards_etapa_check CHECK (
    etapa IN (
      'inativos', 'primeiro_contato', 'lead_qualificado',
      'negociacao', 'pos_venda', 'banco_potenciais', 'desqualificados'
    )
  );

CREATE TABLE IF NOT EXISTS public.lead_desqualificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.pipeline_cards(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id),
  motivo TEXT NOT NULL CHECK (motivo IN ('timing_ruim', 'decisor_errado', 'nao_icp', 'outro')),
  checklist JSONB NOT NULL,
  observacoes TEXT,
  acao_automatica TEXT NOT NULL CHECK (acao_automatica IN ('nutricao_90_dias', 'retencao_curta_lgpd')),
  retencao_ate DATE,
  anonimizar_apos DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_desqualificacoes_card ON public.lead_desqualificacoes(card_id);
CREATE INDEX IF NOT EXISTS idx_desqualificacoes_cliente ON public.lead_desqualificacoes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_desqualificacoes_motivo ON public.lead_desqualificacoes(motivo);

CREATE TABLE IF NOT EXISTS public.lead_tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.pipeline_cards(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES public.usuarios(id),
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('requalificacao', 'lgpd_revisao')),
  vencimento DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluida', 'cancelada')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_tarefas_card ON public.lead_tarefas(card_id);
CREATE INDEX IF NOT EXISTS idx_lead_tarefas_cliente ON public.lead_tarefas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_lead_tarefas_vencimento ON public.lead_tarefas(vencimento);
CREATE INDEX IF NOT EXISTS idx_lead_tarefas_usuario ON public.lead_tarefas(usuario_id);

CREATE TABLE IF NOT EXISTS public.lead_nutricao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL UNIQUE REFERENCES public.clientes(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.pipeline_cards(id) ON DELETE CASCADE,
  motivo TEXT NOT NULL CHECK (motivo IN ('timing_ruim', 'decisor_errado')),
  segmento TEXT NOT NULL,
  sequencia_email TEXT NOT NULL DEFAULT 'educacional_requalificacao',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_nutricao_card ON public.lead_nutricao(card_id);
CREATE INDEX IF NOT EXISTS idx_lead_nutricao_segmento ON public.lead_nutricao(segmento);

ALTER TABLE public.lead_desqualificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_nutricao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "desqualificacoes_select_authenticated"
  ON public.lead_desqualificacoes FOR SELECT TO authenticated USING (true);

CREATE POLICY "desqualificacoes_insert_authenticated"
  ON public.lead_desqualificacoes FOR INSERT TO authenticated
  WITH CHECK (usuario_id = (select auth.uid()));

CREATE POLICY "tarefas_select_authenticated"
  ON public.lead_tarefas FOR SELECT TO authenticated USING (true);

CREATE POLICY "tarefas_update_owner_supervisor"
  ON public.lead_tarefas FOR UPDATE TO authenticated
  USING (usuario_id = (select auth.uid()) OR public.fn_meu_perfil() IN ('supervisor', 'admin'))
  WITH CHECK (usuario_id = (select auth.uid()) OR public.fn_meu_perfil() IN ('supervisor', 'admin'));

CREATE POLICY "tarefas_insert_authenticated"
  ON public.lead_tarefas FOR INSERT TO authenticated
  WITH CHECK (usuario_id = (select auth.uid()) OR public.fn_meu_perfil() IN ('supervisor', 'admin'));

CREATE POLICY "nutricao_select_authenticated"
  ON public.lead_nutricao FOR SELECT TO authenticated USING (true);

CREATE POLICY "nutricao_insert_authenticated"
  ON public.lead_nutricao FOR INSERT TO authenticated
  WITH CHECK (public.fn_meu_perfil() IN ('vendedor', 'supervisor', 'admin'));

CREATE POLICY "nutricao_update_authenticated"
  ON public.lead_nutricao FOR UPDATE TO authenticated
  USING (public.fn_meu_perfil() IN ('vendedor', 'supervisor', 'admin'))
  WITH CHECK (public.fn_meu_perfil() IN ('vendedor', 'supervisor', 'admin'));

CREATE TRIGGER trg_lead_tarefas_updated
  BEFORE UPDATE ON public.lead_tarefas
  FOR EACH ROW EXECUTE FUNCTION public.fn_updated_at();

CREATE TRIGGER trg_lead_nutricao_updated
  BEFORE UPDATE ON public.lead_nutricao
  FOR EACH ROW EXECUTE FUNCTION public.fn_updated_at();

GRANT SELECT, INSERT, UPDATE ON public.lead_desqualificacoes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.lead_tarefas TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.lead_nutricao TO authenticated;
