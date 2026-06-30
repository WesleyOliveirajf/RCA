"""Apply all pending batches via Supabase MCP execute_sql using exec_args files.

Run from Cursor agent context: loads each batch SQL and calls MCP through
the management API when SUPABASE_ACCESS_TOKEN is set, otherwise prints
instructions for CallMcpTool per batch.

Usage:
  set SUPABASE_ACCESS_TOKEN=...   # optional, from Supabase dashboard
  python _apply_all_mcp_batches.py
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
BATCHES = list(range(3, 12))
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
        with urllib.request.urlopen(req, timeout=180) as resp:
            return True, resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        return False, e.read().decode("utf-8", errors="replace")[:800]
    except Exception as e:
        return False, str(e)


def load_query(n: int) -> str:
    data = json.loads((RUN / f"exec_args_{n:03d}.json").read_text(encoding="utf-8"))
    return data["query"]


def main() -> int:
    token = os.environ.get("SUPABASE_ACCESS_TOKEN", "")
    success_count = 0
    failed: list[dict] = []
    verification = None

    if not token:
        print(json.dumps({
            "error": "SUPABASE_ACCESS_TOKEN not set",
            "hint": "Use CallMcpTool execute_sql for each exec_args_00N.json in _mcp_run/",
            "batches": [f"batch_{n:03d}.sql" for n in BATCHES],
        }, ensure_ascii=False))
        return 1

    for n in BATCHES:
        name = f"batch_{n:03d}.sql"
        ok, msg = exec_sql(token, load_query(n))
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
    (RUN / "_apply_result.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
