"""Extract queries from mcp_call_XX.json to qXX.sql files."""
import json
from pathlib import Path

RUN = Path(__file__).resolve().parent / ".sync_batches" / "_mcp_run"
for i in range(9):
    payload = json.loads((RUN / f"mcp_call_{i:02d}.json").read_text(encoding="utf-8"))
    out = RUN / f"q{i:02d}.sql"
    out.write_text(payload["query"], encoding="utf-8")
    print(i, out.name, len(payload["query"]))
