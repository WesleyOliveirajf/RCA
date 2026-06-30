"""Apply all pending ODBC invoke batches by loading SQL and calling Supabase MCP execute_sql.

Uses asyncio + MCP stdio client when SUPABASE_ACCESS_TOKEN is set; otherwise prints payloads for agent.
"""
from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path

PROJECT_ID = "lgsxqipuydyyxqkvbfth"
BASE = Path(__file__).resolve().parent / ".sync_batches"
INVOKE = BASE / "_mcp_run"

PENDING = [f"batch_{i:03d}.sql" for i in range(2, 12)]

VERIFY = (
    "SELECT count(*) FILTER (WHERE cnpj IS NOT NULL) as com_cnpj, "
    "count(*) FILTER (WHERE telefone IS NOT NULL) as com_tel FROM public.clientes;"
)


def load_query(name: str) -> str:
    payload = json.loads((INVOKE / f"invoke_{name}.json").read_text(encoding="utf-8"))
    return payload["query"]


async def apply_with_stdio() -> dict:
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client

    token = os.environ.get("SUPABASE_ACCESS_TOKEN", "")
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
                        {"project_id": PROJECT_ID, "query": load_query(name)},
                    )
                    text = "".join(b.text for b in (resp.content or []) if hasattr(b, "text"))
                    err = bool(getattr(resp, "isError", False)) or (
                        "error" in text.lower() and "below is the result" not in text.lower()
                    )
                    if err:
                        failed.append({"file": name, "error": text[:500]})
                    else:
                        success_count += 1
                except Exception as exc:
                    failed.append({"file": name, "error": str(exc)})

            if not failed:
                resp = await session.call_tool(
                    "execute_sql", {"project_id": PROJECT_ID, "query": VERIFY}
                )
                text = "".join(b.text for b in (resp.content or []) if hasattr(b, "text"))
                try:
                    data = json.loads(text)
                    verification = data[0] if isinstance(data, list) and data else data
                except json.JSONDecodeError:
                    verification = {"raw": text[:300]}

    return {"success_count": success_count, "failed": failed, "verification": verification}


def main() -> int:
    if os.environ.get("SUPABASE_ACCESS_TOKEN"):
        result = asyncio.run(apply_with_stdio())
        print(json.dumps(result, ensure_ascii=False))
        return 0 if not result["failed"] else 1

    # Fallback: emit payloads for agent CallMcpTool
    payloads = []
    for name in PENDING:
        payloads.append({
            "file": name,
            "project_id": PROJECT_ID,
            "bytes": len(load_query(name)),
            "invoke": str(INVOKE / f"invoke_{name}.json"),
        })
    print(json.dumps({"mode": "agent", "pending": payloads}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
