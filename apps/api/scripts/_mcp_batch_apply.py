"""Apply ODBC invoke batches via Supabase MCP execute_sql using payload file paths.

Usage:
  python _mcp_batch_apply.py apply batch_002.sql
  python _mcp_batch_apply.py list
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

PROJECT_ID = "lgsxqipuydyyxqkvbfth"
BASE = Path(__file__).resolve().parent / ".sync_batches"
INVOKE = BASE / "_mcp_run"

PENDING = [f"batch_{i:03d}.sql" for i in range(2, 12)]


def payload_path(name: str) -> Path:
    return INVOKE / f"invoke_{name}.json"


def load_payload(name: str) -> dict:
    return json.loads(payload_path(name).read_text(encoding="utf-8"))


def main() -> int:
    if len(sys.argv) < 2 or sys.argv[1] == "list":
        print(json.dumps({"project_id": PROJECT_ID, "pending": PENDING}))
        return 0
    if sys.argv[1] != "apply" or len(sys.argv) < 3:
        print("usage: _mcp_batch_apply.py apply batch_XXX.sql", file=sys.stderr)
        return 1
    name = sys.argv[2]
    payload = load_payload(name)
    out = INVOKE / f"_query_only_{name}.txt"
    out.write_text(payload["query"], encoding="utf-8")
    print(json.dumps({
        "project_id": PROJECT_ID,
        "file": name,
        "query_path": str(out),
        "bytes": len(payload["query"]),
    }))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
