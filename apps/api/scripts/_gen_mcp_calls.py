"""Generate mcp_call_XX.json files for all pending chunk parts."""
import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent / "_emit_mcp_payload.py"
RUN = Path(__file__).resolve().parent / ".sync_batches" / "_mcp_run"

for i in range(9):
    out = RUN / f"mcp_call_{i:02d}.json"
    with out.open("w", encoding="utf-8") as fh:
        subprocess.run([sys.executable, str(SCRIPT), str(i)], check=True, stdout=fh)
    print(i, out.stat().st_size)
