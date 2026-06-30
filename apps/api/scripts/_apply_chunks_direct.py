"""Apply ODBC sync chunks to Supabase using DATABASE_URL from apps/api/.env."""
from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    import psycopg2
except ImportError:
    print(json.dumps({"error": "psycopg2 not installed"}))
    raise SystemExit(1)

PROJECT_ID = "lgsxqipuydyyxqkvbfth"
BASE = Path(__file__).resolve().parent / ".sync_batches"
ENV = Path(__file__).resolve().parent.parent / ".env"

CHUNKS = [
    "_chunk_01.sql",
    "_chunk_02.sql",
    "_chunk_03.sql",
    "_chunk_04.sql",
    "_chunk_extra.sql",
]

VERIFY_SQL = (
    "SELECT count(*) FILTER (WHERE cnpj IS NOT NULL) as com_cnpj, "
    "count(*) FILTER (WHERE telefone IS NOT NULL) as com_tel FROM public.clientes;"
)


def load_env() -> str:
    if not ENV.exists():
        raise FileNotFoundError(f"missing {ENV}")
    for line in ENV.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, val = line.split("=", 1)
        if key.strip() == "DATABASE_URL":
            return val.strip().strip('"').strip("'")
    raise KeyError("DATABASE_URL not found in .env")


def main() -> int:
    dsn = load_env()
    success_count = 0
    failed: list[dict] = []
    verification: dict | None = None

    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            for name in CHUNKS:
                sql = (BASE / name).read_text(encoding="utf-8")
                try:
                    cur.execute(sql)
                    success_count += 1
                except Exception as exc:
                    failed.append({"file": name, "error": str(exc)})

            if not failed:
                try:
                    cur.execute(VERIFY_SQL)
                    row = cur.fetchone()
                    if row:
                        verification = {"com_cnpj": row[0], "com_tel": row[1]}
                except Exception as exc:
                    failed.append({"file": "verification", "error": str(exc)})
    finally:
        conn.close()

    result = {
        "success_count": success_count,
        "failed": failed,
        "verification": verification,
        "project_id": PROJECT_ID,
    }
    print(json.dumps(result, ensure_ascii=False))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
