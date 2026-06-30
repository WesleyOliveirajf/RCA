"""Read batch SQL files and apply via Supabase MCP execute_sql using stdio MCP client."""
from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

PROJECT_ID = "lgsxqipuydyyxqkvbfth"
BASE = Path(__file__).resolve().parent / ".sync_batches"

BATCH_FILES = [f"batch_{i:03d}.sql" for i in range(2, 13)] + [
    "batch_cards.sql",
    "batch_log.sql",
]


async def main() -> int:
    try:
        from mcp import ClientSession, StdioServerParameters
        from mcp.client.stdio import stdio_client
    except ImportError:
        print("mcp package required", file=sys.stderr)
        return 1

    # Cursor Supabase MCP is typically available via plugin; fallback: report files only
    results: list[dict] = []
    for name in BATCH_FILES:
        path = BASE / name
        if not path.exists():
            results.append({"file": name, "status": "FAIL", "error": "file not found"})
            continue
        sql = path.read_text(encoding="utf-8")
        results.append({"file": name, "status": "PENDING", "bytes": len(sql)})

    print(json.dumps(results, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
