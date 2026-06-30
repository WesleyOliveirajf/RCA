"""Load SQL batch and print as JSON for MCP execute_sql (one file per invocation)."""
from __future__ import annotations

import json
import sys
from pathlib import Path

PROJECT_ID = "lgsxqipuydyyxqkvbfth"
BASE = Path(__file__).resolve().parent / ".sync_batches"
ORDER = [f"batch_{i:03d}.sql" for i in range(1, 13)] + [
    "batch_cards.sql",
    "batch_log.sql",
]


def main() -> int:
    if len(sys.argv) < 2:
        print(json.dumps({"order": ORDER, "project_id": PROJECT_ID}))
        return 0
    name = sys.argv[1]
    path = BASE / name
    if not path.exists():
        print(json.dumps({"error": f"missing {name}"}))
        return 1
    sql = path.read_text(encoding="utf-8")
    print(json.dumps({"project_id": PROJECT_ID, "query": sql, "file": name}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
