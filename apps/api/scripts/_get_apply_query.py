"""Print query from apply JSON for MCP. Usage: python _get_apply_query.py 0"""
import json
import sys
from pathlib import Path

RUN = Path(__file__).resolve().parent / ".sync_batches" / "_mcp_run"
FILES = [
    "apply_chunk_02_batch_005.json",
    "apply_chunk_02_batch_006.json",
    "apply_chunk_02_batch_007.json",
    "apply_chunk_03_batch_008.json",
    "apply_chunk_03_batch_009.json",
    "apply_chunk_03_batch_010.json",
    "apply_chunk_04_batch_011.json",
    "apply_chunk_04_batch_012.json",
    "apply_chunk_extra.json",
]

idx = int(sys.argv[1])
name = FILES[idx]
d = json.loads((RUN / name).read_text(encoding="utf-8"))
sys.stdout.write(d["query"])
