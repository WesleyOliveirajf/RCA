import json
import subprocess
import sys
from pathlib import Path

script = Path(__file__).resolve().parent / "_read_chunk.py"
run = Path(__file__).resolve().parent / ".sync_batches" / "_mcp_run"
for chunk in ["_chunk_01.sql", "_chunk_02.sql", "_chunk_03.sql", "_chunk_04.sql", "_chunk_extra.sql"]:
    r = subprocess.run([sys.executable, str(script), chunk], capture_output=True, text=True, encoding="utf-8")
    d = json.loads(r.stdout)
    name = chunk.replace(".sql", "_query.sql")
    (run / name).write_text(d["query"], encoding="utf-8")
    print(chunk, len(d["query"]))
