"""Gera SQL para preencher cnpj/telefone/email a partir da planilha ODBC."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "apps" / "api" / "src"))

from rca_api.integrations.excel_reader import _mapear_row, ler_planilha

OUT = ROOT / "apps" / "api" / "scripts" / ".sync_batches" / "backfill_contato.sql"


def esc(value) -> str:
    if value is None:
        return "NULL"
    return "'" + str(value).replace("'", "''") + "'"


def main() -> None:
    lines: list[str] = []
    for raw in ler_planilha():
        row = _mapear_row(raw)
        sisplan_id = row.get("sisplan_id")
        if not sisplan_id:
            continue
        lines.append(
            "UPDATE public.clientes SET "
            f"cnpj = {esc(row.get('cnpj'))}, "
            f"telefone = {esc(row.get('telefone'))}, "
            f"email = {esc(row.get('email'))}, "
            f"cidade = {esc(row.get('cidade'))}, "
            f"estado = {esc(row.get('estado'))}, "
            f"segmento = {esc(row.get('segmento'))}, "
            f"nome_fantasia = {esc(row.get('nome_fantasia'))} "
            f"WHERE sisplan_id = {esc(sisplan_id)};"
        )
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"updates={len(lines)} file={OUT}")


if __name__ == "__main__":
    main()
