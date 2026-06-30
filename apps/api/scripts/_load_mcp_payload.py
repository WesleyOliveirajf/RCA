import json
import sys
from pathlib import Path

RUN = Path(__file__).resolve().parent / ".sync_batches" / "_mcp_run"
idx = int(sys.argv[1])
payload = json.loads((RUN / f"mcp_call_{idx:02d}.json").read_text(encoding="utf-8"))
sys.stdout.write(json.dumps(payload, ensure_ascii=False))
