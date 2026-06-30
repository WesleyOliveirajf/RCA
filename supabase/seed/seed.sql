-- Seed de desenvolvimento (NÃO usar em produção)
-- Usuários devem ser criados via Supabase Auth Dashboard
-- Dados reais SISPLAN/ODBC: apps/api/scripts/generate_sync_sql.py + apply_sync_batches.py
-- (planilha odbc/Carteira por Representante.xlsx). NÃO usar supabase/seed/dev_kanban.sql (mock).

-- Exemplo: após criar usuário admin no Auth, atualizar perfil:
-- UPDATE public.usuarios SET perfil = 'admin', nome = 'Admin RCA' WHERE email = 'admin@empresa.com';
