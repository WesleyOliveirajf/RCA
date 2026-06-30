-- DEPRECADO — dados mockados. Use ODBC/SISPLAN via generate_sync_sql.py
-- Seed de desenvolvimento — Kanban RCA (12 clientes, 12 cards)
-- Responsável: admin Wesley (48a2560e-0784-464f-b8ea-4e9297bd11f7)

TRUNCATE public.atividades, public.qualificacoes, public.contatos,
  public.historico_compras, public.pipeline_cards, public.clientes CASCADE;

INSERT INTO public.clientes (
  id, sisplan_id, razao_social, nome_fantasia, cnpj, telefone, email,
  endereco, cidade, estado, segmento, ultima_compra, valor_historico,
  qtd_compras, status, tags, sincronizado_em
) VALUES
  ('10000001-0000-4000-8000-000000000001', 'SP-10234', 'Confecções Lima Ltda', 'Confecções Lima', '12.345.678/0001-90', '(11) 98765-4321', 'compras@confeccoeslima.com.br', 'Rua Augusta, 1200', 'São Paulo', 'SP', 'Moda Feminina', '2025-11-15', 87500.00, 23, 'em_contato', ARRAY['prioridade_alta','grande_volume'], now()),
  ('10000001-0000-4000-8000-000000000002', 'SP-10567', 'Moda Kids Eireli', 'Moda Kids', '23.456.789/0001-01', '(11) 91234-5678', 'contato@modakids.com.br', 'Av. Paulista, 800', 'São Paulo', 'SP', 'Moda Infantil', '2025-09-22', 54200.00, 15, 'inativo', ARRAY['bras'], now()),
  ('10000001-0000-4000-8000-000000000003', 'SP-10890', 'Loja Fashion Center ME', 'Fashion Center', '34.567.890/0001-12', '(21) 99876-5432', 'fashion@fashioncenter.com.br', 'Rua da Alfândega, 350', 'Rio de Janeiro', 'RJ', 'Moda Feminina', '2025-12-03', 132800.00, 41, 'qualificado', ARRAY['prioridade_alta','cliente_antigo'], now()),
  ('10000001-0000-4000-8000-000000000004', 'SP-11023', 'Trama Têxtil Ltda', 'Trama Têxtil', '45.678.901/0001-23', '(31) 98765-1234', 'vendas@tramatextil.com.br', 'Av. Getúlio Vargas, 1500', 'Belo Horizonte', 'MG', 'Tecidos', '2025-10-18', 67300.00, 19, 'negociando', ARRAY[]::text[], now()),
  ('10000001-0000-4000-8000-000000000005', 'SP-11156', 'Boutique Elegance ME', 'Boutique Elegance', '56.789.012/0001-34', '(41) 99887-6543', 'elegance@boutique.com.br', 'Rua XV de Novembro, 200', 'Curitiba', 'PR', 'Moda Feminina', '2026-01-10', 43900.00, 12, 'reativado', ARRAY['reativado_2026'], now()),
  ('10000001-0000-4000-8000-000000000006', 'SP-11289', 'Magazine Popular Ltda', 'Magazine Popular', '67.890.123/0001-45', '(62) 98123-4567', 'compras@magazinepopular.com.br', 'Av. Anhanguera, 2000', 'Goiânia', 'GO', 'Moda Masculina', '2025-08-05', 28700.00, 8, 'inativo', ARRAY[]::text[], now()),
  ('10000001-0000-4000-8000-000000000007', 'SP-11422', 'Estilo & Cia Ltda', 'Estilo & Cia', '78.901.234/0001-56', '(48) 99123-4567', 'vendas@estiloecia.com.br', 'Rua Felipe Schmidt, 450', 'Florianópolis', 'SC', 'Moda Feminina', '2025-12-10', 52100.00, 14, 'qualificado', ARRAY['prioridade_alta'], now()),
  ('10000001-0000-4000-8000-000000000008', 'SP-11555', 'Armazém da Moda Ltda', 'Armazém da Moda', '89.012.345/0001-67', '(47) 98234-5678', 'armazem@modaltda.com.br', 'Rua Blumenau, 800', 'Blumenau', 'SC', 'Moda Feminina', '2025-11-28', 95400.00, 27, 'inativo', ARRAY['prioridade_alta','grande_volume'], now()),
  ('10000001-0000-4000-8000-000000000009', 'SP-11688', 'Cia dos Tecidos ME', 'Cia dos Tecidos', '90.123.456/0001-78', '(51) 99345-6789', 'contato@ciatecidos.com.br', 'Av. Farrapos, 1200', 'Porto Alegre', 'RS', 'Tecidos', '2025-10-01', 38600.00, 11, 'em_contato', ARRAY[]::text[], now()),
  ('10000001-0000-4000-8000-000000000010', 'SP-11821', 'Vitrine Store Eireli', 'Vitrine Store', '01.234.567/0001-89', '(27) 98456-7890', 'loja@vitrinestore.com.br', 'Rua da Lama, 300', 'Vitória', 'ES', 'Moda Feminina', '2025-12-20', 71200.00, 20, 'inativo', ARRAY['cliente_antigo'], now()),
  ('10000001-0000-4000-8000-000000000011', 'SP-11954', 'Ponto da Moda Ltda', 'Ponto da Moda', '12.345.098/0001-90', '(71) 99567-8901', 'ponto@modaltda.com.br', 'Av. Sete de Setembro, 1500', 'Salvador', 'BA', 'Moda Praia', '2025-09-10', 22100.00, 7, 'inativo', ARRAY[]::text[], now()),
  ('10000001-0000-4000-8000-000000000012', 'SP-12087', 'Mega Confecções Ltda', 'Mega Confecções', '23.456.109/0001-01', '(92) 98678-9012', 'mega@confeccoes.com.br', 'Rua Eduardo Ribeiro, 700', 'Manaus', 'AM', 'Moda Masculina', '2025-08-25', 15800.00, 5, 'inativo', ARRAY[]::text[], now());

INSERT INTO public.pipeline_cards (
  id, cliente_id, etapa, responsavel_id, score, prioridade, posicao,
  proximo_contato, notas, valor_proposta, liberado, liberado_por, liberado_em
) VALUES
  ('20000001-0000-4000-8000-000000000001', '10000001-0000-4000-8000-000000000002', 'inativos', '48a2560e-0784-464f-b8ea-4e9297bd11f7', 0, 'media', 0, NULL, NULL, NULL, false, NULL, NULL),
  ('20000001-0000-4000-8000-000000000002', '10000001-0000-4000-8000-000000000006', 'inativos', '48a2560e-0784-464f-b8ea-4e9297bd11f7', 0, 'baixa', 1, NULL, NULL, NULL, false, NULL, NULL),
  ('20000001-0000-4000-8000-000000000003', '10000001-0000-4000-8000-000000000008', 'inativos', '48a2560e-0784-464f-b8ea-4e9297bd11f7', 0, 'alta', 2, NULL, NULL, NULL, false, NULL, NULL),
  ('20000001-0000-4000-8000-000000000004', '10000001-0000-4000-8000-000000000010', 'inativos', '48a2560e-0784-464f-b8ea-4e9297bd11f7', 0, 'media', 3, NULL, NULL, NULL, false, NULL, NULL),
  ('20000001-0000-4000-8000-000000000005', '10000001-0000-4000-8000-000000000011', 'inativos', '48a2560e-0784-464f-b8ea-4e9297bd11f7', 0, 'baixa', 4, NULL, NULL, NULL, false, NULL, NULL),
  ('20000001-0000-4000-8000-000000000006', '10000001-0000-4000-8000-000000000012', 'inativos', '48a2560e-0784-464f-b8ea-4e9297bd11f7', 0, 'baixa', 5, NULL, NULL, NULL, false, NULL, NULL),
  ('20000001-0000-4000-8000-000000000007', '10000001-0000-4000-8000-000000000001', 'primeiro_contato', '48a2560e-0784-464f-b8ea-4e9297bd11f7', 45, 'alta', 0, '2026-06-27', 'Cliente demonstrou interesse, ligar amanhã para apresentar catálogo novo.', NULL, false, NULL, NULL),
  ('20000001-0000-4000-8000-000000000008', '10000001-0000-4000-8000-000000000009', 'primeiro_contato', '48a2560e-0784-464f-b8ea-4e9297bd11f7', 30, 'media', 1, '2026-06-28', 'Deixou recado com secretária, aguardando retorno.', NULL, false, NULL, NULL),
  ('20000001-0000-4000-8000-000000000009', '10000001-0000-4000-8000-000000000003', 'lead_qualificado', '48a2560e-0784-464f-b8ea-4e9297bd11f7', 82, 'alta', 0, '2026-06-26', 'Cliente antigo com alto valor. Interesse em coleção nova. Aguardando liberação admin.', 25000.00, false, NULL, NULL),
  ('20000001-0000-4000-8000-000000000012', '10000001-0000-4000-8000-000000000007', 'lead_qualificado', '48a2560e-0784-464f-b8ea-4e9297bd11f7', 78, 'alta', 1, '2026-06-29', 'Lead qualificado e já liberado pelo admin para avançar no funil.', 32000.00, true, '48a2560e-0784-464f-b8ea-4e9297bd11f7', '2026-06-28 14:00:00+00'),
  ('20000001-0000-4000-8000-000000000010', '10000001-0000-4000-8000-000000000004', 'negociacao', '48a2560e-0784-464f-b8ea-4e9297bd11f7', 75, 'urgente', 0, '2026-06-26', 'Negociando preços. Pediu desconto de 10% para fechar pedido grande.', 18500.00, false, NULL, NULL),
  ('20000001-0000-4000-8000-000000000011', '10000001-0000-4000-8000-000000000005', 'pos_venda', '48a2560e-0784-464f-b8ea-4e9297bd11f7', 90, 'media', 0, '2026-07-01', 'Pedido entregue em 20/06. Contato pós-venda agendado para 01/07.', 12800.00, false, NULL, NULL);

INSERT INTO public.contatos (
  cliente_id, card_id, usuario_id, tipo, resumo, resultado, duracao_minutos, data_contato
) VALUES
  ('10000001-0000-4000-8000-000000000001', '20000001-0000-4000-8000-000000000007', '48a2560e-0784-464f-b8ea-4e9297bd11f7', 'ligacao', 'Liguei para apresentar coleção outono/inverno. Cliente demonstrou interesse.', 'interessado', 8, '2026-06-24 14:30:00+00'),
  ('10000001-0000-4000-8000-000000000001', '20000001-0000-4000-8000-000000000007', '48a2560e-0784-464f-b8ea-4e9297bd11f7', 'whatsapp', 'Enviei catálogo PDF via WhatsApp. Cliente visualizou.', 'interessado', NULL, '2026-06-25 09:15:00+00'),
  ('10000001-0000-4000-8000-000000000004', '20000001-0000-4000-8000-000000000010', '48a2560e-0784-464f-b8ea-4e9297bd11f7', 'ligacao', 'Negociação de desconto. Cliente pediu 10%, ofereci 7%.', 'agendar_retorno', 15, '2026-06-25 16:00:00+00');

INSERT INTO public.historico_compras (
  cliente_id, sisplan_pedido_id, data_pedido, valor, itens, status_pedido
) VALUES
  ('10000001-0000-4000-8000-000000000001', 'PED-2025-8841', '2025-11-15', 4200.00, '[{"produto":"Vestido Linho","qtd":20,"valor_unit":85},{"produto":"Blusa Manga Longa","qtd":30,"valor_unit":45}]'::jsonb, 'concluido'),
  ('10000001-0000-4000-8000-000000000003', 'PED-2025-9102', '2025-12-03', 8900.00, '[{"produto":"Conjunto Premium","qtd":15,"valor_unit":320}]'::jsonb, 'concluido'),
  ('10000001-0000-4000-8000-000000000004', 'PED-2025-8755', '2025-10-18', 5600.00, '[{"produto":"Malha Algodão","qtd":100,"valor_unit":28},{"produto":"Ribana","qtd":50,"valor_unit":56}]'::jsonb, 'concluido');

INSERT INTO public.atividades (card_id, usuario_id, acao, detalhes) VALUES
  ('20000001-0000-4000-8000-000000000010', '48a2560e-0784-464f-b8ea-4e9297bd11f7', 'mover', '{"de":"lead_qualificado","para":"negociacao"}'::jsonb),
  ('20000001-0000-4000-8000-000000000007', '48a2560e-0784-464f-b8ea-4e9297bd11f7', 'contato', '{"tipo":"ligacao","resultado":"interessado"}'::jsonb),
  ('20000001-0000-4000-8000-000000000012', '48a2560e-0784-464f-b8ea-4e9297bd11f7', 'liberar_lead', '{"etapa":"lead_qualificado"}'::jsonb);
