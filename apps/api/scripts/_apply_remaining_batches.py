"""Apply ODBC batch SQL files via Supabase MCP execute_sql (stdio).

Requires SUPABASE_ACCESS_TOKEN in environment (Cursor MCP auth).
Usage: python _apply_remaining_batches.py
"""
from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path

PROJECT_ID = "lgsxqipuydyyxqkvbfth"
BASE = Path(__file__).resolve().parent / ".sync_batches"
PENDING = [f"batch_{i:03d}.sql" for i in range(3, 12)]
VERIFY = (
    "SELECT count(*) FILTER (WHERE cnpj IS NOT NULL) as com_cnpj, "
    "count(*) FILTER (WHERE telefone IS NOT NULL) as com_tel FROM public.clientes;"
)


def load_sql(name: str) -> str:
    return (BASE / name).read_text(encoding="utf-8")


async def run() -> dict:
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client

    token = os.environ.get("SUPABASE_ACCESS_TOKEN", "")
    if not token:
        return {"error": "SUPABASE_ACCESS_TOKEN not set", "mode": "agent_fallback"}

    params = StdioServerParameters(
        command="npx",
        args=["-y", "@supabase/mcp-server-supabase@latest", "--access-token", token],
        env=os.environ.copy(),
    )

    success_count = 0
    failed: list[dict] = []
    verification = None

    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            for name in PENDING:
                try:
                    resp = await session.call_tool(
                        "execute_sql",
                        {"project_id": PROJECT_ID, "query": load_sql(name)},
                    )
                    text = "".join(
                        b.text for b in (resp.content or []) if hasattr(b, "text")
                    )
                    if getattr(resp, "isError", False) or (
                        "error" in text.lower()
                        and "below is the result" not in text.lower()
                    ):
                        failed.append({"file": name, "error": text[:500]})
                    else:
                        success_count += 1
                        print(f"OK {name}", file=sys.stderr)
                except Exception as exc:
                    failed.append({"file": name, "error": str(exc)})

            if not failed:
                resp = await session.call_tool(
                    "execute_sql", {"project_id": PROJECT_ID, "query": VERIFY}
                )
                text = "".join(
                    b.text for b in (resp.content or []) if hasattr(b, "text")
                )
                import re

                m = re.search(r"\[\{.*?\}\]", text, re.DOTALL)
                if m:
                    verification = json.loads(m.group(0))[0]
                else:
                    verification = {"raw": text[:300]}

    return {"success_count": success_count, "failed": failed, "verification": verification}


def main() -> int:
    result = asyncio.run(run())
    print(json.dumps(result, ensure_ascii=False))
    return 0 if not result.get("failed") and "error" not in result else 1


if __name__ == "__main__":
    raise SystemExit(main())
