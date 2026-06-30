"""Gera batches SQL a partir do SISPLAN ODBC ou fallback Excel para import manual."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "apps" / "api" / "src"))

from rca_api.integrations.sisplan import buscar_clientes_inativos
from rca_api.services.prioridade_service import calcular_prioridade

BATCH_SIZE = 80
ADMIN_ID = "48a2560e-0784-464f-b8ea-4e9297bd11f7"
OUT_DIR = ROOT / "apps" / "api" / "scripts" / ".sync_batches"


def esc(value) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    text = str(value).replace("'", "''")
    return f"'{text}'"


def row_values(row: dict) -> str:
    prioridade = calcular_prioridade(row)
    return (
        f"({esc(row['sisplan_id'])}, {esc(row['razao_social'])}, {esc(row.get('nome_fantasia'))}, "
        f"{esc(row.get('cnpj'))}, {esc(row.get('telefone'))}, {esc(row.get('email'))}, "
        f"{esc(row.get('endereco'))}, {esc(row.get('cidade'))}, {esc(row.get('estado'))}, "
        f"{esc(row.get('segmento'))}, {esc(row['ultima_compra'])}, {row.get('valor_historico', 0)}, "
        f"{row.get('qtd_compras', 0)}, 'inativo', now())"
    )


def main() -> None:
    rows = buscar_clientes_inativos(6, 12)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for old in OUT_DIR.glob("batch_*.sql"):
        old.unlink()

    batches = [rows[i : i + BATCH_SIZE] for i in range(0, len(rows), BATCH_SIZE)]
    for idx, batch in enumerate(batches, start=1):
        values = ",\n  ".join(row_values(r) for r in batch)
        sql = f"""
INSERT INTO public.clientes (
  sisplan_id, razao_social, nome_fantasia, cnpj, telefone, email,
  endereco, cidade, estado, segmento, ultima_compra, valor_historico,
  qtd_compras, status, sincronizado_em
) VALUES
  {values}
ON CONFLICT (sisplan_id) DO UPDATE SET
  razao_social = EXCLUDED.razao_social,
  nome_fantasia = EXCLUDED.nome_fantasia,
  cnpj = EXCLUDED.cnpj,
  telefone = EXCLUDED.telefone,
  email = EXCLUDED.email,
  cidade = EXCLUDED.cidade,
  estado = EXCLUDED.estado,
  segmento = EXCLUDED.segmento,
  ultima_compra = EXCLUDED.ultima_compra,
  valor_historico = EXCLUDED.valor_historico,
  qtd_compras = EXCLUDED.qtd_compras,
  sincronizado_em = EXCLUDED.sincronizado_em;
"""
        (OUT_DIR / f"batch_{idx:03d}.sql").write_text(sql.strip(), encoding="utf-8")

    cards_sql = f"""
INSERT INTO public.pipeline_cards (cliente_id, etapa, prioridade, responsavel_id, posicao)
SELECT
  c.id,
  'inativos',
  CASE
    WHEN c.valor_historico > 50000 THEN 'alta'
    WHEN c.valor_historico > 20000 THEN 'media'
    ELSE 'baixa'
  END,
  '{ADMIN_ID}'::uuid,
  (ROW_NUMBER() OVER (ORDER BY c.valor_historico DESC) - 1)::int
FROM public.clientes c
WHERE NOT EXISTS (
  SELECT 1 FROM public.pipeline_cards pc WHERE pc.cliente_id = c.id
);
"""
    (OUT_DIR / "batch_cards.sql").write_text(cards_sql.strip(), encoding="utf-8")

    log_sql = f"""
INSERT INTO public.sync_logs (inicio, fim, status, novos, atualizados)
VALUES (now(), now(), 'sucesso', {len(rows)}, 0);
"""
    (OUT_DIR / "batch_log.sql").write_text(log_sql.strip(), encoding="utf-8")

    meta = {"total_rows": len(rows), "batches": len(batches)}
    (OUT_DIR / "meta.json").write_text(json.dumps(meta), encoding="utf-8")
    print(json.dumps(meta))


if __name__ == "__main__":
    main()
