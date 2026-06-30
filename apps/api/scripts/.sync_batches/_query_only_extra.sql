INSERT INTO public.pipeline_cards (cliente_id, etapa, prioridade, responsavel_id, posicao)
SELECT
  c.id,
  'inativos',
  CASE
    WHEN c.valor_historico > 50000 THEN 'alta'
    WHEN c.valor_historico > 20000 THEN 'media'
    ELSE 'baixa'
  END,
  '48a2560e-0784-464f-b8ea-4e9297bd11f7'::uuid,
  (ROW_NUMBER() OVER (ORDER BY c.valor_historico DESC) - 1)::int
FROM public.clientes c
WHERE NOT EXISTS (
  SELECT 1 FROM public.pipeline_cards pc WHERE pc.cliente_id = c.id
);
INSERT INTO public.sync_logs (inicio, fim, status, novos, atualizados)
VALUES (now(), now(), 'sucesso', 887, 0);