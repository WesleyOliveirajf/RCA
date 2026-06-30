"""Aplica batches SQL gerados por generate_sync_sql.py via psycopg2 (DATABASE_URL)."""
from __future__ import annotations

import os
import sys
from pathlib import Path

try:
    import psycopg2
except ImportError:
    print("Instale: pip install psycopg2-binary python-dotenv", file=sys.stderr)
    sys.exit(1)

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[3]
BATCH_DIR = ROOT / "apps" / "api" / "scripts" / ".sync_batches"


def main() -> None:
    load_dotenv(ROOT / "apps" / "api" / ".env")
    db_url = os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DB_URL")
    if not db_url:
        print(
            "Defina DATABASE_URL no apps/api/.env "
            "(Supabase → Project Settings → Database → Connection string URI)",
            file=sys.stderr,
        )
        sys.exit(1)

    files = sorted(BATCH_DIR.glob("batch_0*.sql"))
    files += [BATCH_DIR / "batch_cards.sql", BATCH_DIR / "batch_log.sql"]
    missing = [f for f in files if not f.exists()]
    if missing:
        print(f"Arquivos ausentes: {missing}. Rode generate_sync_sql.py primeiro.", file=sys.stderr)
        sys.exit(1)

    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            for path in files:
                sql = path.read_text(encoding="utf-8")
                print(f"Aplicando {path.name}...", flush=True)
                cur.execute(sql)
                print(f"  OK ({path.name})", flush=True)
    finally:
        conn.close()

    print("Import concluído.")


if __name__ == "__main__":
    main()
