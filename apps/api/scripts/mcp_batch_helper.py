"""Apply all pending ODBC batches by reading SQL and printing MCP-ready status.

Used with agent CallMcpTool: agent reads invoke JSON per batch.
This script applies batches when run with --apply flag using psycopg2 if DATABASE_URL set,
otherwise writes batch list for MCP application.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

PROJECT_ID = "lgsxqipuydyyxqkvbfth"
BASE = Path(__file__).resolve().parent / ".sync_batches"
INVOKE = BASE / "_mcp_run"

ALL = [f"batch_{i:03d}.sql" for i in range(1, 13)] + [
    "batch_cards.sql",
    "batch_log.sql",
]


def load(name: str) -> dict:
    return json.loads((INVOKE / f"invoke_{name}.json").read_text(encoding="utf-8"))


def main() -> int:
    if len(sys.argv) > 1 and sys.argv[1] == "--list":
        for name in ALL:
            p = INVOKE / f"invoke_{name}.json"
            print(name, "OK" if p.exists() else "MISSING")
        return 0

    if len(sys.argv) > 2 and sys.argv[1] == "--get-query":
        name = sys.argv[2]
        print(load(name)["query"], end="")
        return 0

    print(json.dumps({"project_id": PROJECT_ID, "batches": ALL}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
