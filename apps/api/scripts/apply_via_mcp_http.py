"""Apply SQL batches via Supabase streamable HTTP MCP (execute_sql)."""
from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

PROJECT_ID = "lgsxqipuydyyxqkvbfth"
MCP_URL = f"https://mcp.supabase.com/mcp?project_ref={PROJECT_ID}"
BASE = Path(__file__).resolve().parent / ".sync_batches"
INVOKE_DIR = BASE / "_mcp_run"

PENDING = [f"batch_{i:03d}.sql" for i in range(2, 13)] + [
    "batch_cards.sql",
    "batch_log.sql",
]


async def apply_all() -> list[dict]:
    from mcp.client.streamable_http import streamablehttp_client
    from mcp import ClientSession

    results: list[dict] = []
    async with streamablehttp_client(MCP_URL) as (read, write, _):
        async with ClientSession(read, write) as session:
            await session.initialize()
            for name in PENDING:
                invoke_path = INVOKE_DIR / f"invoke_{name}.json"
                if not invoke_path.exists():
                    results.append({"file": name, "status": "FAIL", "error": "invoke json missing"})
                    continue
                payload = json.loads(invoke_path.read_text(encoding="utf-8"))
                try:
                    resp = await session.call_tool(
                        "execute_sql",
                        {"project_id": PROJECT_ID, "query": payload["query"]},
                    )
                    text = "".join(
                        b.text for b in (resp.content or []) if hasattr(b, "text")
                    )
                    failed = bool(getattr(resp, "isError", False)) or (
                        "error" in text.lower() and "[]" not in text
                    )
                    results.append(
                        {
                            "file": name,
                            "status": "FAIL" if failed else "SUCCESS",
                            "response": text[:300],
                        }
                    )
                except Exception as exc:
                    results.append({"file": name, "status": "FAIL", "error": str(exc)})
    return results


def main() -> int:
    if not INVOKE_DIR.exists():
        print("Run build_mcp_invokes.py first", file=sys.stderr)
        return 1
    results = asyncio.run(apply_all())
    out = INVOKE_DIR / "results.json"
    out.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(results, indent=2, ensure_ascii=False))
    return 0 if all(r["status"] == "SUCCESS" for r in results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
