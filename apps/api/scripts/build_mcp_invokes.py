"""Build invoke JSON files for MCP execute_sql from SQL batch files."""
from __future__ import annotations

import json
from pathlib import Path

PROJECT_ID = "lgsxqipuydyyxqkvbfth"
BASE = Path(__file__).resolve().parent / ".sync_batches"
OUT = BASE / "_mcp_run"
OUT.mkdir(exist_ok=True)

FILES = [f"batch_{i:03d}.sql" for i in range(2, 13)] + [
    "batch_cards.sql",
    "batch_log.sql",
]

for name in FILES:
    sql = (BASE / name).read_text(encoding="utf-8")
    payload = {"project_id": PROJECT_ID, "query": sql, "file": name}
    target = OUT / f"invoke_{name}.json"
    target.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {target.name} ({len(sql)} bytes)")

print("done")
