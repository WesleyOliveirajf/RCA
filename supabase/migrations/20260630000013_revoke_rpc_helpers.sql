-- Migration 013: Revoga EXECUTE via RPC (PUBLIC/anon) das helpers internas
-- Mantém apenas o mínimo para RLS, triggers e RPCs intencionais do frontend.

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;

-- Helpers usados diretamente em políticas RLS
GRANT EXECUTE ON FUNCTION public.fn_meu_perfil() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_eh_gestor() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_eh_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_pode_acessar_cliente(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_pode_acessar_card(uuid) TO authenticated;

-- RPCs intencionais (frontend)
GRANT EXECUTE ON FUNCTION public.fn_admin_create_user(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_liberar_lead(uuid) TO authenticated;

-- Triggers disparados por mutações de authenticated
GRANT EXECUTE ON FUNCTION public.fn_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_proteger_liberacao() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_validar_movimentacao_liberacao() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_reset_liberacao() TO authenticated;

-- Novas funções não ficam expostas por padrão
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;
