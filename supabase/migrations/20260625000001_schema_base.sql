-- Migration 001: Schema base do Sistema RCA
-- Domínio + tabelas operacionais + RLS + views + triggers

-- Extensões
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABELAS DE DOMÍNIO
-- ============================================================

CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  perfil TEXT NOT NULL CHECK (perfil IN ('vendedor', 'supervisor', 'admin', 'superadmin')),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sisplan_id TEXT UNIQUE,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  segmento TEXT,
  ultima_compra DATE,
  valor_historico DECIMAL(12,2) DEFAULT 0,
  qtd_compras INTEGER DEFAULT 0,
  status TEXT DEFAULT 'inativo'
    CHECK (status IN ('inativo', 'em_contato', 'qualificado', 'negociando', 'reativado', 'descartado')),
  origem_inatividade TEXT,
  tags TEXT[],
  sincronizado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_clientes_status ON public.clientes(status);
CREATE INDEX idx_clientes_ultima_compra ON public.clientes(ultima_compra);
CREATE INDEX idx_clientes_sisplan_id ON public.clientes(sisplan_id);
CREATE INDEX idx_clientes_cidade ON public.clientes(cidade);

CREATE TABLE public.pipeline_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  etapa TEXT NOT NULL DEFAULT 'inativos',
  responsavel_id UUID REFERENCES public.usuarios(id),
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  prioridade TEXT DEFAULT 'media'
    CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  posicao INTEGER DEFAULT 0,
  proximo_contato DATE,
  notas TEXT,
  valor_proposta DECIMAL(12,2),
  motivo_perda TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cards_etapa ON public.pipeline_cards(etapa);
CREATE INDEX idx_cards_responsavel ON public.pipeline_cards(responsavel_id);
CREATE INDEX idx_cards_proximo_contato ON public.pipeline_cards(proximo_contato);
CREATE UNIQUE INDEX idx_cards_cliente_unico ON public.pipeline_cards(cliente_id);

CREATE TABLE public.contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  card_id UUID REFERENCES public.pipeline_cards(id) ON DELETE SET NULL,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id),
  tipo TEXT NOT NULL
    CHECK (tipo IN ('ligacao', 'whatsapp', 'email', 'visita', 'pos_venda', 'sistema')),
  direcao TEXT DEFAULT 'saida' CHECK (direcao IN ('entrada', 'saida')),
  resumo TEXT NOT NULL,
  resultado TEXT CHECK (resultado IN (
    'sem_resposta', 'interessado', 'sem_interesse',
    'agendar_retorno', 'pedido_realizado', 'reclamacao', 'outro'
  )),
  duracao_minutos INTEGER,
  data_contato TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_contatos_cliente ON public.contatos(cliente_id);
CREATE INDEX idx_contatos_data ON public.contatos(data_contato DESC);

CREATE TABLE public.historico_compras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  sisplan_pedido_id TEXT,
  data_pedido DATE NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  itens JSONB,
  status_pedido TEXT DEFAULT 'concluido'
    CHECK (status_pedido IN ('pendente', 'producao', 'enviado', 'concluido', 'cancelado')),
  sincronizado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_historico_cliente ON public.historico_compras(cliente_id);
CREATE INDEX idx_historico_data ON public.historico_compras(data_pedido DESC);

CREATE TABLE public.qualificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.pipeline_cards(id) ON DELETE CASCADE,
  avaliador_id UUID NOT NULL REFERENCES public.usuarios(id),
  score_interesse INTEGER CHECK (score_interesse BETWEEN 1 AND 5),
  score_volume INTEGER CHECK (score_volume BETWEEN 1 AND 5),
  score_prazo INTEGER CHECK (score_prazo BETWEEN 1 AND 5),
  score_total INTEGER GENERATED ALWAYS AS (
    (score_interesse + score_volume + score_prazo) * 100 / 15
  ) STORED,
  aprovado BOOLEAN,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_qualificacoes_card ON public.qualificacoes(card_id);

CREATE TABLE public.configuracoes (
  chave TEXT PRIMARY KEY,
  valor JSONB NOT NULL,
  descricao TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABELAS OPERACIONAIS (auditoria, sync, timeline)
-- ============================================================

CREATE TABLE public.atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.pipeline_cards(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id),
  acao TEXT NOT NULL,
  detalhes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_atividades_card ON public.atividades(card_id);
CREATE INDEX idx_atividades_created ON public.atividades(created_at DESC);

CREATE TABLE public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inicio TIMESTAMPTZ NOT NULL,
  fim TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('executando', 'sucesso', 'erro')),
  novos INTEGER DEFAULT 0,
  atualizados INTEGER DEFAULT 0,
  erro TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sync_logs_inicio ON public.sync_logs(inicio DESC);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES public.usuarios(id),
  acao TEXT NOT NULL,
  recurso TEXT,
  recurso_id TEXT,
  detalhes JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ============================================================
-- DADOS INICIAIS
-- ============================================================

INSERT INTO public.configuracoes (chave, valor, descricao) VALUES
  ('sync_intervalo_horas', '6', 'Intervalo de sync ODBC em horas'),
  ('inatividade_meses_min', '6', 'Mínimo de meses inativo para entrar no funil'),
  ('inatividade_meses_max', '12', 'Máximo de meses inativo'),
  ('recontato_dias', '15', 'Dias para recontato após sem venda'),
  ('pos_venda_dias', '7', 'Dias após entrega para contato pós-venda'),
  ('score_minimo_qualificacao', '60', 'Score mínimo para considerar lead qualificado');

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_updated
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.fn_updated_at();

CREATE TRIGGER trg_clientes_updated
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.fn_updated_at();

CREATE TRIGGER trg_cards_updated
  BEFORE UPDATE ON public.pipeline_cards
  FOR EACH ROW EXECUTE FUNCTION public.fn_updated_at();

CREATE OR REPLACE FUNCTION public.fn_calcular_prioridade(p_cliente_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_valor DECIMAL;
  v_meses INTEGER;
BEGIN
  SELECT valor_historico, EXTRACT(MONTH FROM AGE(now(), ultima_compra))::INTEGER
  INTO v_valor, v_meses FROM public.clientes WHERE id = p_cliente_id;

  IF v_valor > 50000 OR v_meses >= 10 THEN RETURN 'alta';
  ELSIF v_valor > 20000 OR v_meses >= 8 THEN RETURN 'media';
  ELSE RETURN 'baixa';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-criar perfil ao registrar usuário no Auth
CREATE OR REPLACE FUNCTION public.fn_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, nome, email, perfil)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'perfil', 'vendedor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.fn_handle_new_user();

-- ============================================================
-- VIEWS
-- ============================================================

CREATE VIEW public.v_funil_resumo AS
SELECT
  pc.etapa,
  COUNT(*) AS total,
  COALESCE(SUM(c.valor_historico), 0) AS valor_historico_total,
  COALESCE(AVG(pc.score), 0)::INTEGER AS score_medio
FROM public.pipeline_cards pc
JOIN public.clientes c ON c.id = pc.cliente_id
GROUP BY pc.etapa;

CREATE VIEW public.v_contatos_hoje AS
SELECT
  pc.id AS card_id,
  c.nome_fantasia,
  c.telefone,
  pc.etapa,
  pc.prioridade,
  pc.proximo_contato,
  u.nome AS responsavel
FROM public.pipeline_cards pc
JOIN public.clientes c ON c.id = pc.cliente_id
LEFT JOIN public.usuarios u ON u.id = pc.responsavel_id
WHERE pc.proximo_contato <= CURRENT_DATE
ORDER BY pc.prioridade DESC, pc.proximo_contato ASC;
