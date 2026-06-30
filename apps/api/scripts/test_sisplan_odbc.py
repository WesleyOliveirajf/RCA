"""Diagnóstico rápido da conexão ODBC SISPLAN.

Uso:
  set PYTHONPATH=src
  python scripts/test_sisplan_odbc.py --connection-only
  python scripts/test_sisplan_odbc.py --count-inativos
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "apps" / "api" / "src"))

from rca_api.config import get_settings
from rca_api.integrations.sisplan import buscar_clientes_inativos, get_sisplan_connection


def main() -> None:
    parser = argparse.ArgumentParser(description="Testa conexão e leitura ODBC SISPLAN")
    parser.add_argument("--connection-only", action="store_true", help="Apenas abre a conexão ODBC")
    parser.add_argument("--count-inativos", action="store_true", help="Executa a query e conta clientes inativos")
    parser.add_argument("--min-meses", type=int, default=6)
    parser.add_argument("--max-meses", type=int, default=12)
    args = parser.parse_args()

    settings = get_settings()
    print("Configuração ODBC:")
    print(f"  Driver: {settings.sisplan_odbc_driver}")
    print(f"  DSN: {'configurado' if settings.sisplan_dsn else 'não configurado'}")
    print(f"  Host: {'configurado' if settings.sisplan_host else 'não configurado'}")
    print(f"  Database: {'configurado' if settings.sisplan_db else 'não configurado'}")
    print(f"  User: {'configurado' if settings.sisplan_user else 'não configurado'}")

    if args.connection_only:
        conn = get_sisplan_connection()
        conn.close()
        print("Conexão ODBC aberta com sucesso.")
        return

    if args.count_inativos:
        rows = buscar_clientes_inativos(args.min_meses, args.max_meses)
        print(f"Clientes inativos ({args.min_meses}-{args.max_meses} meses): {len(rows)}")
        for row in rows[:5]:
            print(
                f"  {row['sisplan_id']} | {row['razao_social']} | "
                f"{row.get('telefone') or '-'} | {row.get('ultima_compra') or '-'}"
            )
        return

    parser.print_help()


if __name__ == "__main__":
    main()
