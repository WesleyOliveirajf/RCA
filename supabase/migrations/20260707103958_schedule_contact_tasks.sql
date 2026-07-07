ALTER TABLE public.lead_tarefas
  ADD COLUMN IF NOT EXISTS agendado_para TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS descricao TEXT;

UPDATE public.lead_tarefas
  SET agendado_para = vencimento::timestamptz
  WHERE agendado_para IS NULL;

ALTER TABLE public.lead_tarefas
  ALTER COLUMN agendado_para SET NOT NULL;

ALTER TABLE public.lead_tarefas
  DROP CONSTRAINT IF EXISTS lead_tarefas_tipo_check;

ALTER TABLE public.lead_tarefas
  ADD CONSTRAINT lead_tarefas_tipo_check
  CHECK (tipo IN ('contato', 'requalificacao', 'lgpd_revisao'));

CREATE INDEX IF NOT EXISTS idx_lead_tarefas_agendado_para
  ON public.lead_tarefas(agendado_para);

CREATE INDEX IF NOT EXISTS idx_lead_tarefas_pendentes_agendado
  ON public.lead_tarefas(status, agendado_para)
  WHERE status = 'pendente';
