"""Apply ODBC sync chunk SQL via Supabase MCP execute_sql payloads.

Reads pre-built _mcp_payload_*.json files and prints apply instructions.
The Cursor agent should call CallMcpTool(execute_sql) for each payload file.
This script validates payloads and can report chunk metadata.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

PROJECT_ID = "lgsxqipuydyyxqkvbfth"
BASE = Path(__file__).resolve().parent / ".sync_batches"

CHUNKS = [
    ("_chunk_01.sql", "_mcp_payload_chunk_01.json"),
    ("_chunk_02.sql", "_mcp_payload_chunk_02.json"),
    ("_chunk_03.sql", "_mcp_payload_chunk_03.json"),
    ("_chunk_04.sql", "_mcp_payload_chunk_04.json"),
    ("_chunk_extra.sql", "_mcp_payload_chunk_extra.json"),
]


def load_payload(json_name: str) -> dict:
    path = BASE / json_name
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    if len(sys.argv) < 2:
        for sql_name, json_name in CHUNKS:
            p = load_payload(json_name)
            print(json.dumps({"file": sql_name, "bytes": len(p["query"]), "payload": json_name}))
        return 0

    cmd = sys.argv[1]
    if cmd == "get":
        json_name = sys.argv[2]
        print(json.dumps(load_payload(json_name), ensure_ascii=False))
        return 0

    if cmd == "query":
        json_name = sys.argv[2]
        print(load_payload(json_name)["query"], end="")
        return 0

    print("usage: _mcp_chunk_runner.py [get|query] <payload.json>", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
