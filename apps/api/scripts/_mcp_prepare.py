"""Apply all pending chunk SQL parts via Supabase MCP execute_sql using cursor agent subprocess."""
import base64
import json
import subprocess
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


def load_payload(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    idx = int(sys.argv[1]) if len(sys.argv) > 1 else -1
    if idx < 0:
        for i, name in enumerate(FILES):
            d = load_payload(RUN / name)
            print(i, name, len(d["query"]))
        return
    name = FILES[idx]
    d = load_payload(RUN / name)
    out = RUN / f"_mcp_payload_{idx:02d}.json"
    out.write_text(
        json.dumps({"project_id": PROJECT, "name": name, "query": d["query"]}, ensure_ascii=False),
        encoding="utf-8",
    )
    b64 = base64.b64encode(d["query"].encode("utf-8")).decode("ascii")
    (RUN / f"_mcp_b64_{idx:02d}.txt").write_text(b64, encoding="ascii")
    print(json.dumps({"index": idx, "name": name, "query_len": len(d["query"]), "b64_file": out.name}))


if __name__ == "__main__":
    main()
