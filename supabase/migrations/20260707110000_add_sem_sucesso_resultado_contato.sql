ALTER TABLE public.contatos
  DROP CONSTRAINT IF EXISTS contatos_resultado_check;

ALTER TABLE public.contatos
  ADD CONSTRAINT contatos_resultado_check
  CHECK (resultado IN (
    'sem_resposta',
    'sem_sucesso',
    'interessado',
    'sem_interesse',
    'agendar_retorno',
    'pedido_realizado',
    'reclamacao',
    'outro'
  ));
