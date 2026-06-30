"""Print query from pending MCP JSON. Usage: python _load_pending_query.py pending_chunk_02"""
import json
import sys
from pathlib import Path

RUN = Path(__file__).resolve().parent / ".sync_batches" / "_mcp_run"
name = sys.argv[1] if len(sys.argv) > 1 else "pending_batch_004"
path = RUN / f"{name}.json" if not name.endswith(".json") else RUN / name
data = json.loads(path.read_text(encoding="utf-8"))
sys.stdout.write(data["query"])
