"""Apply ODBC sync batches via Supabase Management API (needs SUPABASE_ACCESS_TOKEN).

Falls back to writing apply instructions for Cursor MCP CallMcpTool.
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

PROJECT_ID = "lgsxqipuydyyxqkvbfth"
RUN = Path(__file__).resolve().parent / ".sync_batches" / "_mcp_run"

# chunk_01 = batches 002-004 (002,003 may already be applied — upsert is idempotent)
CHUNKS = [
    ("_chunk_01.sql", RUN / "_chunk_01_query.sql"),
    ("_chunk_02.sql", RUN / "_chunk_02_query.sql"),
    ("_chunk_03.sql", RUN / "_chunk_03_query.sql"),
    ("_chunk_04.sql", RUN / "_chunk_04_query.sql"),
    ("_chunk_extra.sql", RUN / "_chunk_extra_query.sql"),
]
VERIFY = (
    "SELECT count(*) FILTER (WHERE cnpj IS NOT NULL) as com_cnpj, "
    "count(*) FILTER (WHERE telefone IS NOT NULL) as com_tel FROM public.clientes;"
)


def exec_sql(token: str, query: str) -> tuple[bool, str]:
    url = f"https://api.supabase.com/v1/projects/{PROJECT_ID}/database/query"
    body = json.dumps({"query": query}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            return True, resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        return False, e.read().decode("utf-8", errors="replace")[:1000]
    except Exception as e:
        return False, str(e)


def load_chunk(path: Path) -> str:
    if not path.exists():
        raise FileNotFoundError(path)
    return path.read_text(encoding="utf-8")


def main() -> int:
    token = os.environ.get("SUPABASE_ACCESS_TOKEN", "")
    success_count = 0
    failed: list[dict] = []
    verification = None

    if not token:
        print(json.dumps({
            "error": "SUPABASE_ACCESS_TOKEN not set",
            "chunks": [c[0] for c in CHUNKS],
        }))
        return 1

    for name, path in CHUNKS:
        try:
            query = load_chunk(path)
        except FileNotFoundError as e:
            failed.append({"file": name, "error": str(e)})
            continue
        ok, msg = exec_sql(token, query)
        if ok:
            success_count += 1
            print(f"OK {name}", file=sys.stderr)
        else:
            failed.append({"file": name, "error": msg})

    if not failed:
        ok, msg = exec_sql(token, VERIFY)
        if ok:
            try:
                rows = json.loads(msg)
                verification = rows[0] if isinstance(rows, list) and rows else rows
            except json.JSONDecodeError:
                verification = {"raw": msg[:300]}
        else:
            failed.append({"file": "verify", "error": msg})

    result = {"success_count": success_count, "failed": failed, "verification": verification}
    out = RUN / "_chunk_apply_result.json"
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
