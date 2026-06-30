"""Emit MCP execute_sql payload JSON to stdout. Usage: python _emit_mcp_payload.py 0"""
import json
import sys
from pathlib import Path

RUN = Path(__file__).resolve().parent / ".sync_batches" / "_mcp_run"
PROJECT = "lgsxqipuydyyxqkvbfth"
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


def main() -> None:
    idx = int(sys.argv[1])
    data = json.loads((RUN / FILES[idx]).read_text(encoding="utf-8"))
    payload = {"project_id": PROJECT, "query": data["query"]}
    sys.stdout.write(json.dumps(payload, ensure_ascii=False))


if __name__ == "__main__":
    main()
