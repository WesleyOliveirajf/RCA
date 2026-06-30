"""Apply batch SQL files via Supabase Management API (needs SUPABASE_ACCESS_TOKEN)."""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

PROJECT_ID = "lgsxqipuydyyxqkvbfth"
BASE = Path(__file__).resolve().parent / ".sync_batches"
RUN = BASE / "_mcp_run"
PENDING = [f"batch_{i:03d}.sql" for i in range(3, 12)]
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
        with urllib.request.urlopen(req, timeout=120) as resp:
            return True, resp.read().decode("utf-8")[:500]
    except urllib.error.HTTPError as e:
        return False, e.read().decode("utf-8", errors="replace")[:500]
    except Exception as e:
        return False, str(e)


def main() -> int:
    token = os.environ.get("SUPABASE_ACCESS_TOKEN", "")
    if not token:
        print(json.dumps({"error": "SUPABASE_ACCESS_TOKEN not set"}))
        return 1

    success_count = 0
    failed: list[dict] = []
    for name in PENDING:
        sql = (BASE / name).read_text(encoding="utf-8")
        ok, msg = exec_sql(token, sql)
        if ok:
            success_count += 1
            print(f"OK {name}", file=sys.stderr)
        else:
            failed.append({"file": name, "error": msg})

    verification = None
    if not failed:
        ok, msg = exec_sql(token, VERIFY)
        if ok:
            try:
                verification = json.loads(msg)
                if isinstance(verification, list) and verification:
                    verification = verification[0]
            except json.JSONDecodeError:
                verification = {"raw": msg[:300]}
        else:
            failed.append({"file": "verify", "error": msg})

    result = {"success_count": success_count, "failed": failed, "verification": verification}
    (RUN / "_apply_result.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(result, ensure_ascii=False))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
