"""Apply invoke JSON batches via Supabase MCP execute_sql using Python json payloads.

Agent workflow: run `python _apply_invoke_batch.py batch_002.sql` and pass printed JSON to CallMcpTool.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

PROJECT_ID = "lgsxqipuydyyxqkvbfth"
BASE = Path(__file__).resolve().parent / ".sync_batches"
INVOKE = BASE / "_mcp_run"

BATCHES = [f"batch_{i:03d}.sql" for i in range(2, 13)]


def main() -> int:
    if len(sys.argv) < 2:
        print(json.dumps({"batches": BATCHES, "project_id": PROJECT_ID}))
        return 0
    name = sys.argv[1]
    path = INVOKE / f"invoke_{name}.json"
    if not path.exists():
        sql = (BASE / name).read_text(encoding="utf-8")
        payload = {"project_id": PROJECT_ID, "query": sql, "file": name}
    else:
        payload = json.loads(path.read_text(encoding="utf-8"))
    print(json.dumps(payload, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
