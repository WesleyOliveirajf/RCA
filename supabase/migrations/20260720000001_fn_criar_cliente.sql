-- Migration: RPC para cadastrar cliente manualmente + card no funil (inativos)
-- Contorna falhas da API no insert e garante visibilidade no pipeline/listagem.

CREATE OR REPLACE FUNCTION public.fn_criar_cliente(
  p_razao_social TEXT,
  p_nome_fantasia TEXT DEFAULT NULL,
  p_cnpj TEXT DEFAULT NULL,
  p_telefone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_endereco TEXT DEFAULT NULL,
  p_cidade TEXT DEFAULT NULL,
  p_estado TEXT DEFAULT NULL,
  p_segmento TEXT DEFAULT NULL,
  p_nome_contato TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_perfil TEXT;
  v_cliente public.clientes%ROWTYPE;
  v_card_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  v_perfil := public.fn_meu_perfil();
  IF v_perfil IS NULL OR v_perfil NOT IN ('vendedor', 'supervisor', 'admin', 'superadmin') THEN
    RAISE EXCEPTION 'Sem permissão para criar clientes';
  END IF;

  IF p_razao_social IS NULL OR length(trim(p_razao_social)) < 2 THEN
    RAISE EXCEPTION 'Informe a razão social do cliente';
  END IF;

  IF p_email IS NOT NULL AND length(trim(p_email)) > 0 AND position('@' IN p_email) = 0 THEN
    RAISE EXCEPTION 'Informe um e-mail válido ou deixe o campo vazio';
  END IF;

  INSERT INTO public.clientes (
    razao_social,
    nome_fantasia,
    cnpj,
    telefone,
    email,
    endereco,
    cidade,
    estado,
    segmento,
    nome_contato,
    status,
    valor_historico,
    qtd_compras,
    tags
  ) VALUES (
    trim(p_razao_social),
    NULLIF(trim(p_nome_fantasia), ''),
    NULLIF(trim(p_cnpj), ''),
    NULLIF(trim(p_telefone), ''),
    NULLIF(trim(p_email), ''),
    NULLIF(trim(p_endereco), ''),
    NULLIF(trim(p_cidade), ''),
    NULLIF(trim(p_estado), ''),
    NULLIF(trim(p_segmento), ''),
    NULLIF(trim(p_nome_contato), ''),
    'inativo',
    0,
    0,
    '{}'::text[]
  )
  RETURNING * INTO v_cliente;

  INSERT INTO public.pipeline_cards (
    cliente_id,
    etapa,
    responsavel_id,
    prioridade,
    posicao,
    score
  ) VALUES (
    v_cliente.id,
    'inativos',
    v_uid,
    'media',
    0,
    0
  )
  RETURNING id INTO v_card_id;

  RETURN json_build_object(
    'id', v_cliente.id,
    'sisplan_id', v_cliente.sisplan_id,
    'razao_social', v_cliente.razao_social,
    'nome_fantasia', v_cliente.nome_fantasia,
    'cnpj', v_cliente.cnpj,
    'telefone', v_cliente.telefone,
    'email', v_cliente.email,
    'endereco', v_cliente.endereco,
    'cidade', v_cliente.cidade,
    'estado', v_cliente.estado,
    'segmento', v_cliente.segmento,
    'nome_contato', v_cliente.nome_contato,
    'tags', COALESCE(to_json(v_cliente.tags), '[]'::json),
    'ultima_compra', v_cliente.ultima_compra,
    'valor_historico', v_cliente.valor_historico,
    'qtd_compras', v_cliente.qtd_compras,
    'status', v_cliente.status,
    'sincronizado_em', v_cliente.sincronizado_em,
    'created_at', v_cliente.created_at,
    'updated_at', v_cliente.updated_at,
    'card_id', v_card_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_criar_cliente(
  text, text, text, text, text, text, text, text, text, text
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_criar_cliente(
  text, text, text, text, text, text, text, text, text, text
) FROM anon;
GRANT EXECUTE ON FUNCTION public.fn_criar_cliente(
  text, text, text, text, text, text, text, text, text, text
) TO authenticated;
