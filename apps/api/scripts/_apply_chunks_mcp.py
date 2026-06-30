"""Load chunk SQL parts for MCP apply. Usage: python _apply_chunks_mcp.py [index|name]"""
import json
import sys
from pathlib import Path

RUN = Path(__file__).resolve().parent / ".sync_batches" / "_mcp_run"
PROJECT = "lgsxqipuydyyxqkvbfth"

ITEMS = [
    ("chunk_02", "_chunk02_part0.sql"),
    ("chunk_02", "_chunk02_part1.sql"),
    ("chunk_02", "_chunk02_part2.sql"),
    ("chunk_03", "_chunk_03_part0.sql"),
    ("chunk_03", "_chunk_03_part1.sql"),
    ("chunk_03", "_chunk_03_part2.sql"),
    ("chunk_04", "_chunk_04_part0.sql"),
    ("chunk_04", "_chunk_04_part1.sql"),
    ("chunk_extra", "_chunk_extra_apply.sql"),
]


def load_item(idx: int) -> dict:
    label, fn = ITEMS[idx]
    q = (RUN / fn).read_text(encoding="utf-8")
    return {"project_id": PROJECT, "label": f"{label}:{fn}", "query": q}


def main() -> None:
    if len(sys.argv) < 2:
        print(json.dumps({"count": len(ITEMS), "items": [f"{a}:{b}" for a, b in ITEMS]}))
        return
    arg = sys.argv[1]
    idx = int(arg) if arg.isdigit() else next(
        i for i, (_, fn) in enumerate(ITEMS) if arg in fn
    )
    print(json.dumps(load_item(idx), ensure_ascii=False))


if __name__ == "__main__":
    main()
