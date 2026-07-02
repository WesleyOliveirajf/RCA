-- Migration 012: Endurecimento de grants, RLS e trigger de perfil
-- Revoga grants globais, aplica políticas por escopo de carteira/funil e
-- impede escalada de privilégio via raw_user_meta_data no signup.

-- ============================================================
-- HELPERS DE AUTORIZAÇÃO (SECURITY DEFINER)
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_eh_gestor()
RETURNS BOOLEAN AS $$
  SELECT public.fn_meu_perfil() IN ('supervisor', 'admin', 'superadmin')
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.fn_eh_admin()
RETURNS BOOLEAN AS $$
  SELECT public.fn_meu_perfil() IN ('admin', 'superadmin')
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.fn_etapas_funil_aberto()
RETURNS TEXT[] AS $$
  SELECT ARRAY['inativos', 'primeiro_contato', 'lead_qualificado']::TEXT[]
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.fn_pode_ver_card_row(p_responsavel_id UUID, p_etapa TEXT)
RETURNS BOOLEAN AS $$
  SELECT
    p_etapa = ANY (public.fn_etapas_funil_aberto())
    OR p_responsavel_id = auth.uid()
    OR public.fn_eh_gestor()
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.fn_pode_acessar_cliente(p_cliente_id UUID)
RETURNS BOOLEAN AS $$
  SELECT public.fn_eh_gestor()
    OR EXISTS (
      SELECT 1
      FROM public.pipeline_cards pc
      WHERE pc.cliente_id = p_cliente_id
        AND public.fn_pode_ver_card_row(pc.responsavel_id, pc.etapa)
    )
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.fn_pode_acessar_card(p_card_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pipeline_cards pc
    WHERE pc.id = p_card_id
      AND public.fn_pode_ver_card_row(pc.responsavel_id, pc.etapa)
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Perfil sempre 'vendedor' no signup; admins definem perfil via RPC/função dedicada.
CREATE OR REPLACE FUNCTION public.fn_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, nome, email, perfil)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    'vendedor'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.fn_admin_create_user(
  p_username TEXT,
  p_password TEXT,
  p_nome TEXT,
  p_perfil TEXT DEFAULT 'vendedor'
)
RETURNS JSON AS $$
DECLARE
  v_email TEXT;
  v_user_id UUID;
  v_existing UUID;
  v_caller_perfil TEXT;
BEGIN
  v_caller_perfil := public.fn_meu_perfil();
  IF v_caller_perfil IS NULL OR v_caller_perfil NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'Apenas administradores podem criar usuários';
  END IF;

  IF length(p_username) < 2 THEN
    RAISE EXCEPTION 'Username deve ter pelo menos 2 caracteres';
  END IF;
  IF length(p_password) < 6 THEN
    RAISE EXCEPTION 'Senha deve ter pelo menos 6 caracteres';
  END IF;
  IF length(p_nome) < 2 THEN
    RAISE EXCEPTION 'Nome deve ter pelo menos 2 caracteres';
  END IF;
  IF p_perfil NOT IN ('vendedor', 'supervisor', 'admin') THEN
    RAISE EXCEPTION 'Perfil inválido: %', p_perfil;
  END IF;

  SELECT id INTO v_existing FROM public.usuarios WHERE username = p_username;
  IF v_existing IS NOT NULL THEN
    RAISE EXCEPTION 'Username "%" já está em uso', p_username;
  END IF;

  v_email := lower(p_username) || '@rca.local';

  SELECT id INTO v_existing FROM auth.users WHERE email = v_email;
  IF v_existing IS NOT NULL THEN
    RAISE EXCEPTION 'Usuário "%" já existe no sistema de autenticação', p_username;
  END IF;

  v_user_id := gen_random_uuid();

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, confirmation_token, recovery_token,
    email_change_token_new, email_change_token_current,
    email_change, reauthentication_token,
    phone_change, phone_change_token,
    raw_app_meta_data, raw_user_meta_data,
    is_sso_user, is_anonymous, created_at, updated_at
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', v_email,
    crypt(p_password, gen_salt('bf', 10)),
    now(), '', '', '', '', '', '', '', '',
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    jsonb_build_object('nome', p_nome),
    false, false, now(), now()
  );

  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    v_user_id, v_user_id, v_email,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', false),
    'email', now(), now(), now()
  );

  UPDATE public.usuarios
  SET username = p_username,
      nome = p_nome,
      perfil = p_perfil
  WHERE id = v_user_id;

  RETURN json_build_object(
    'id', v_user_id,
    'username', p_username,
    'nome', p_nome,
    'email', v_email,
    'perfil', p_perfil
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- GRANTS: revoga acesso global e concede por tabela
-- ============================================================

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;

REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated;

GRANT SELECT, INSERT, UPDATE ON public.usuarios TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.clientes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_cards TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.contatos TO authenticated;
GRANT SELECT ON public.historico_compras TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.qualificacoes TO authenticated;
GRANT SELECT, UPDATE ON public.configuracoes TO authenticated;
GRANT SELECT, INSERT ON public.atividades TO authenticated;
GRANT SELECT, INSERT ON public.lead_desqualificacoes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.lead_tarefas TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.lead_nutricao TO authenticated;
GRANT SELECT ON public.v_funil_resumo TO authenticated;
GRANT SELECT ON public.v_contatos_hoje TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

REVOKE EXECUTE ON ALL ROUTINES IN SCHEMA public FROM anon;
GRANT EXECUTE ON FUNCTION public.fn_admin_create_user(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- PIPELINE: restringir insert de cards
DROP POLICY IF EXISTS "cards_insert_authenticated" ON public.pipeline_cards;

CREATE POLICY "cards_insert_scoped"
  ON public.pipeline_cards FOR INSERT TO authenticated
  WITH CHECK (
    responsavel_id = auth.uid()
    OR public.fn_eh_gestor()
  );

-- ============================================================
-- RLS: substituir políticas permissivas (USING true)
-- ============================================================

-- USUARIOS
DROP POLICY IF EXISTS "usuarios_select_authenticated" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_admin_all" ON public.usuarios;

CREATE POLICY "usuarios_select_scoped"
  ON public.usuarios FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.fn_eh_gestor());

CREATE POLICY "usuarios_admin_manage"
  ON public.usuarios FOR ALL TO authenticated
  USING (public.fn_eh_admin())
  WITH CHECK (public.fn_eh_admin());

-- CLIENTES
DROP POLICY IF EXISTS "clientes_select_authenticated" ON public.clientes;
DROP POLICY IF EXISTS "clientes_update_authenticated" ON public.clientes;

CREATE POLICY "clientes_select_scoped"
  ON public.clientes FOR SELECT TO authenticated
  USING (public.fn_pode_acessar_cliente(id));

CREATE POLICY "clientes_insert_authenticated"
  ON public.clientes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "clientes_update_scoped"
  ON public.clientes FOR UPDATE TO authenticated
  USING (public.fn_pode_acessar_cliente(id))
  WITH CHECK (public.fn_pode_acessar_cliente(id));

-- CONTATOS
DROP POLICY IF EXISTS "contatos_select_authenticated" ON public.contatos;
DROP POLICY IF EXISTS "contatos_insert_authenticated" ON public.contatos;

CREATE POLICY "contatos_select_scoped"
  ON public.contatos FOR SELECT TO authenticated
  USING (
    usuario_id = auth.uid()
    OR public.fn_pode_acessar_cliente(cliente_id)
  );

CREATE POLICY "contatos_insert_scoped"
  ON public.contatos FOR INSERT TO authenticated
  WITH CHECK (
    usuario_id = auth.uid()
    AND public.fn_pode_acessar_cliente(cliente_id)
  );

CREATE POLICY "contatos_update_scoped"
  ON public.contatos FOR UPDATE TO authenticated
  USING (
    usuario_id = auth.uid()
    OR public.fn_eh_gestor()
  )
  WITH CHECK (
    usuario_id = auth.uid()
    OR public.fn_eh_gestor()
  );

-- HISTORICO COMPRAS
DROP POLICY IF EXISTS "historico_select_authenticated" ON public.historico_compras;

CREATE POLICY "historico_select_scoped"
  ON public.historico_compras FOR SELECT TO authenticated
  USING (public.fn_pode_acessar_cliente(cliente_id));

-- QUALIFICACOES
DROP POLICY IF EXISTS "qualificacoes_select_authenticated" ON public.qualificacoes;
DROP POLICY IF EXISTS "qualificacoes_insert_authenticated" ON public.qualificacoes;
DROP POLICY IF EXISTS "qualificacoes_update_supervisor" ON public.qualificacoes;

CREATE POLICY "qualificacoes_select_scoped"
  ON public.qualificacoes FOR SELECT TO authenticated
  USING (public.fn_pode_acessar_card(card_id));

CREATE POLICY "qualificacoes_insert_scoped"
  ON public.qualificacoes FOR INSERT TO authenticated
  WITH CHECK (
    avaliador_id = auth.uid()
    AND public.fn_pode_acessar_card(card_id)
  );

CREATE POLICY "qualificacoes_update_gestor"
  ON public.qualificacoes FOR UPDATE TO authenticated
  USING (public.fn_eh_gestor())
  WITH CHECK (public.fn_eh_gestor());

-- CONFIGURACOES
DROP POLICY IF EXISTS "config_select_admin" ON public.configuracoes;
DROP POLICY IF EXISTS "config_update_admin" ON public.configuracoes;

CREATE POLICY "config_select_admin"
  ON public.configuracoes FOR SELECT TO authenticated
  USING (public.fn_eh_admin());

CREATE POLICY "config_update_admin"
  ON public.configuracoes FOR UPDATE TO authenticated
  USING (public.fn_eh_admin())
  WITH CHECK (public.fn_eh_admin());

-- ATIVIDADES
DROP POLICY IF EXISTS "atividades_select_authenticated" ON public.atividades;
DROP POLICY IF EXISTS "atividades_insert_authenticated" ON public.atividades;

CREATE POLICY "atividades_select_scoped"
  ON public.atividades FOR SELECT TO authenticated
  USING (public.fn_pode_acessar_card(card_id));

CREATE POLICY "atividades_insert_scoped"
  ON public.atividades FOR INSERT TO authenticated
  WITH CHECK (
    usuario_id = auth.uid()
    AND public.fn_pode_acessar_card(card_id)
  );

-- LEAD DESQUALIFICACOES / TAREFAS / NUTRICAO
DROP POLICY IF EXISTS "desqualificacoes_select_authenticated" ON public.lead_desqualificacoes;
DROP POLICY IF EXISTS "desqualificacoes_insert_authenticated" ON public.lead_desqualificacoes;
DROP POLICY IF EXISTS "tarefas_select_authenticated" ON public.lead_tarefas;
DROP POLICY IF EXISTS "tarefas_update_owner_supervisor" ON public.lead_tarefas;
DROP POLICY IF EXISTS "tarefas_insert_authenticated" ON public.lead_tarefas;
DROP POLICY IF EXISTS "nutricao_select_authenticated" ON public.lead_nutricao;
DROP POLICY IF EXISTS "nutricao_insert_authenticated" ON public.lead_nutricao;
DROP POLICY IF EXISTS "nutricao_update_authenticated" ON public.lead_nutricao;

CREATE POLICY "desqualificacoes_select_scoped"
  ON public.lead_desqualificacoes FOR SELECT TO authenticated
  USING (public.fn_pode_acessar_card(card_id));

CREATE POLICY "desqualificacoes_insert_scoped"
  ON public.lead_desqualificacoes FOR INSERT TO authenticated
  WITH CHECK (
    usuario_id = auth.uid()
    AND public.fn_pode_acessar_card(card_id)
  );

CREATE POLICY "tarefas_select_scoped"
  ON public.lead_tarefas FOR SELECT TO authenticated
  USING (
    usuario_id = auth.uid()
    OR public.fn_pode_acessar_card(card_id)
    OR public.fn_eh_gestor()
  );

CREATE POLICY "tarefas_insert_scoped"
  ON public.lead_tarefas FOR INSERT TO authenticated
  WITH CHECK (
    (usuario_id = auth.uid() OR public.fn_eh_gestor())
    AND public.fn_pode_acessar_card(card_id)
  );

CREATE POLICY "tarefas_update_scoped"
  ON public.lead_tarefas FOR UPDATE TO authenticated
  USING (usuario_id = auth.uid() OR public.fn_eh_gestor())
  WITH CHECK (usuario_id = auth.uid() OR public.fn_eh_gestor());

CREATE POLICY "nutricao_select_scoped"
  ON public.lead_nutricao FOR SELECT TO authenticated
  USING (public.fn_pode_acessar_cliente(cliente_id));

CREATE POLICY "nutricao_insert_scoped"
  ON public.lead_nutricao FOR INSERT TO authenticated
  WITH CHECK (public.fn_pode_acessar_card(card_id));

CREATE POLICY "nutricao_update_scoped"
  ON public.lead_nutricao FOR UPDATE TO authenticated
  USING (public.fn_pode_acessar_card(card_id))
  WITH CHECK (public.fn_pode_acessar_card(card_id));
