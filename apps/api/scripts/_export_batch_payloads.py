"""Export MCP execute_sql payloads from batch SQL files (full ON CONFLICT)."""
import json
from pathlib import Path

PROJECT_ID = "lgsxqipuydyyxqkvbfth"
BASE = Path(__file__).resolve().parent / ".sync_batches"
OUT = BASE / "_mcp_run"

for i in range(3, 12):
    name = f"batch_{i:03d}.sql"
    sql = (BASE / name).read_text(encoding="utf-8")
    payload = {"project_id": PROJECT_ID, "query": sql}
    out = OUT / f"payload_{name}.json"
    out.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    print(name, len(sql), "->", out.name)
