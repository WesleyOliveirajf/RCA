-- Migration 010: Função RPC para admins criarem usuários sem depender do backend
-- O SuperAdmin/Admin cria usuários diretamente via RPC, sem precisar de e-mail real.

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
    now(), '', '', '', '', '', '',
    '', '',
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    jsonb_build_object('nome', p_nome, 'perfil', p_perfil),
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
  SET username = p_username
  WHERE id = v_user_id;

  RETURN json_build_object(
    'id', v_user_id,
    'username', p_username,
    'nome', p_nome,
    'email', v_email,
    'perfil', p_perfil
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
