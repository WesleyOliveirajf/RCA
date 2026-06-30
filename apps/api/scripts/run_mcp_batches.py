"""Apply ODBC sync SQL batches via Supabase MCP execute_sql (stdout JSON for agent)."""
from __future__ import annotations

import json
import sys
from pathlib import Path

PROJECT_ID = "lgsxqipuydyyxqkvbfth"
BASE = Path(__file__).resolve().parent / ".sync_batches"

ORDER = [f"batch_{i:03d}.sql" for i in range(2, 13)] + [
    "batch_cards.sql",
    "batch_log.sql",
]


def load_query(name: str) -> str:
    path = BASE / name
    if not path.exists():
        raise FileNotFoundError(path)
    return path.read_text(encoding="utf-8")


def main() -> None:
    idx = int(sys.argv[1]) if len(sys.argv) > 1 else -1
    if idx < 0 or idx >= len(ORDER):
        print(json.dumps({"files": ORDER, "project_id": PROJECT_ID}))
        return
    name = ORDER[idx]
    payload = {"project_id": PROJECT_ID, "query": load_query(name), "file": name}
    out = BASE / "_mcp_run" / f"{name}.payload.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({"file": name, "payload_path": str(out), "bytes": len(payload["query"])}))


if __name__ == "__main__":
    main()
