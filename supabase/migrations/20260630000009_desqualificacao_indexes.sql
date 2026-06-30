-- Migration 009: Índice de FK da auditoria de desqualificação

CREATE INDEX IF NOT EXISTS idx_desqualificacoes_usuario
  ON public.lead_desqualificacoes(usuario_id);
