"""Apply all ODBC sync batches via Supabase MCP execute_sql (stdio bridge)."""
from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

PROJECT_ID = "lgsxqipuydyyxqkvbfth"
BASE = Path(__file__).resolve().parent / ".sync_batches"

ALL_FILES = [f"batch_{i:03d}.sql" for i in range(1, 13)] + [
    "batch_cards.sql",
    "batch_log.sql",
]

# Skip batch_001 if already applied; batch_012 applied this session
SKIP = {"batch_001.sql", "batch_012.sql"}

PENDING = [f for f in ALL_FILES if f not in SKIP]


async def apply_one(session, name: str, sql: str) -> dict:
    try:
        result = await session.call_tool(
            "execute_sql",
            {"project_id": PROJECT_ID, "query": sql},
        )
        text = ""
        if result.content:
            for block in result.content:
                if hasattr(block, "text"):
                    text += block.text
        err = getattr(result, "isError", False) or "error" in text.lower()
        return {"file": name, "status": "FAIL" if err else "SUCCESS", "response": text[:500]}
    except Exception as exc:
        return {"file": name, "status": "FAIL", "error": str(exc)}


async def main() -> int:
    print("This script requires direct MCP stdio access to plugin-supabase-supabase.")
    print("Pending files:", PENDING)
    results = []
    for name in PENDING:
        sql = (BASE / name).read_text(encoding="utf-8")
        results.append({"file": name, "bytes": len(sql), "status": "NOT_RUN"})
    out = BASE / "_mcp_run" / "apply_results.json"
    out.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"Wrote {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
