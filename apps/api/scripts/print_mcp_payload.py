"""Print MCP execute_sql payload JSON for one batch file."""
from __future__ import annotations

import json
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent / ".sync_batches" / "_mcp_run"
name = sys.argv[1] if len(sys.argv) > 1 else "batch_002.sql"
payload = json.loads((BASE / f"invoke_{name}.json").read_text(encoding="utf-8"))
print(json.dumps({"project_id": payload["project_id"], "query": payload["query"]}))
