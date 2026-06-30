"""Apply ODBC sync chunks via Supabase MCP execute_sql (Cursor agent helper).

Usage:
  python _apply_chunks_mcp_exec.py apply _chunk_01.sql
  python _apply_chunks_mcp_exec.py verify

Prints JSON with project_id and query for agent CallMcpTool, or runs verify query payload.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

PROJECT_ID = "lgsxqipuydyyxqkvbfth"
BASE = Path(__file__).resolve().parent / ".sync_batches"

PAYLOAD_MAP = {
    "_chunk_01.sql": "_mcp_payload_chunk_01.json",
    "_chunk_02.sql": "_mcp_payload_chunk_02.json",
    "_chunk_03.sql": "_mcp_payload_chunk_03.json",
    "_chunk_04.sql": "_mcp_payload_chunk_04.json",
    "_chunk_extra.sql": "_mcp_payload_chunk_extra.json",
}

VERIFY_SQL = (
    "SELECT count(*) FILTER (WHERE cnpj IS NOT NULL) as com_cnpj, "
    "count(*) FILTER (WHERE telefone IS NOT NULL) as com_tel FROM public.clientes;"
)


def payload_for(chunk: str) -> dict:
    name = PAYLOAD_MAP.get(chunk)
    if not name:
        raise KeyError(f"unknown chunk: {chunk}")
    return json.loads((BASE / name).read_text(encoding="utf-8"))


def main() -> int:
    if len(sys.argv) < 2:
        print(json.dumps({"chunks": list(PAYLOAD_MAP.keys()), "project_id": PROJECT_ID}))
        return 0

    cmd = sys.argv[1]
    if cmd == "verify":
        print(json.dumps({"project_id": PROJECT_ID, "query": VERIFY_SQL}))
        return 0

    if cmd == "apply":
        chunk = sys.argv[2]
        print(json.dumps(payload_for(chunk), ensure_ascii=False))
        return 0

    print("usage: _apply_chunks_mcp_exec.py [apply <chunk>|verify]", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
