INSERT INTO public.clientes (
  sisplan_id, razao_social, nome_fantasia, cnpj, telefone, email,
  endereco, cidade, estado, segmento, ultima_compra, valor_historico,
  qtd_compras, status, sincronizado_em
) VALUES
  ('21626', 'EDESTRO REPRESENTACOES LTDA', 'EDESTRO REPRESENTACOES LTDA', NULL, NULL, 'ELIASDESTRO@GMAIL.COM', NULL, 'SAO JOSE', 'SANTA CATARINA', NULL, '2025-11-12', 169.664, 0, 'inativo', now()),
  ('02540', 'MERID REPRESENTACOES LTDA', 'MERID REPRESENTACOES LTDA', NULL, NULL, 'adrianagomesrep@gmail.com', NULL, 'FORTALEZA', 'CEARA', NULL, '2025-11-11', 126.528, 0, 'inativo', now()),
  ('13334', 'ALEXANDRE ALMEIDA DE OLIVEIRA ME', 'ALEXANDRE ALMEIDA DE OLIVEIRA ME', NULL, NULL, 'alexandre.uniquers@terra.com.br', NULL, 'PORTO ALEGRE', 'RIO GRANDE DO SUL', NULL, '2025-11-05', 86.688, 0, 'inativo', now()),
  ('09661', 'MICROBUSINESS REPRESENTACOES LTDA', 'MICROBUSINESS REPRESENTACOES LTDA', NULL, NULL, 'ludtkebr@gmail.com', NULL, 'JUIZ DE FORA', 'MINAS GERAIS', NULL, '2025-11-11', 73.6, 0, 'inativo', now())
ON CONFLICT (sisplan_id) DO UPDATE SET
  razao_social = EXCLUDED.razao_social,
  nome_fantasia = EXCLUDED.nome_fantasia,
  ultima_compra = EXCLUDED.ultima_compra,
  valor_historico = EXCLUDED.valor_historico,
  qtd_compras = EXCLUDED.qtd_compras,
  sincronizado_em = EXCLUDED.sincronizado_em;