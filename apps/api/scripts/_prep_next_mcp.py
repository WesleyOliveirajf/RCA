"""Apply one batch via exec_args JSON — prints batch id for agent MCP follow-up."""
import json
import sys
from pathlib import Path

RUN = Path(__file__).resolve().parent / ".sync_batches" / "_mcp_run"
batch = sys.argv[1] if len(sys.argv) > 1 else "003"
args = json.loads((RUN / f"exec_args_{batch}.json").read_text(encoding="utf-8"))
(RUN / "_next_mcp.json").write_text(json.dumps(args, ensure_ascii=False), encoding="utf-8")
print(batch, len(args["query"]))
