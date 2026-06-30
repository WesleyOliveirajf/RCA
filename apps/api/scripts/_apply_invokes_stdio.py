"""Apply all pending ODBC invoke batches via Supabase MCP execute_sql (stdio).

Requires Supabase MCP auth via environment (Cursor plugin session).
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

PENDING = [f"batch_{i:03d}.sql" for i in range(2, 12)]  # 012 already applied separately

VERIFY = (
    "SELECT count(*) FILTER (WHERE cnpj IS NOT NULL) as com_cnpj, "
    "count(*) FILTER (WHERE telefone IS NOT NULL) as com_tel FROM public.clientes;"
)


async def call_sql(session, query: str) -> tuple[bool, str]:
    resp = await session.call_tool(
        "execute_sql",
        {"project_id": PROJECT_ID, "query": query},
    )
    text = "".join(b.text for b in (resp.content or []) if hasattr(b, "text"))
    err = bool(getattr(resp, "isError", False)) or (
        "error" in text.lower() and "below is the result" not in text.lower()
    )
    return err, text


async def main() -> int:
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client

    token = os.environ.get("SUPABASE_ACCESS_TOKEN") or os.environ.get("SUPABASE_PAT")
    env = os.environ.copy()
    if token:
        env["SUPABASE_ACCESS_TOKEN"] = token

    server_params = StdioServerParameters(
        command="npx",
        args=["-y", "@supabase/mcp-server-supabase@latest", "--access-token", token or ""],
        env=env,
    )

    success_count = 0
    failed: list[dict] = []
    verification: dict | None = None

    try:
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                for name in PENDING:
                    payload = json.loads((INVOKE / f"invoke_{name}.json").read_text(encoding="utf-8"))
                    try:
                        err, text = await call_sql(session, payload["query"])
                        if err:
                            failed.append({"file": name, "error": text[:500]})
                        else:
                            success_count += 1
                    except Exception as exc:
                        failed.append({"file": name, "error": str(exc)})

                if not failed:
                    err, text = await call_sql(session, VERIFY)
                    if err:
                        failed.append({"file": "verification", "error": text[:500]})
                    else:
                        try:
                            data = json.loads(text)
                            verification = data[0] if isinstance(data, list) and data else data
                        except json.JSONDecodeError:
                            verification = {"raw": text[:300]}
    except Exception as exc:
        failed.append({"file": "mcp_connect", "error": str(exc)})

    result = {"success_count": success_count, "failed": failed, "verification": verification}
    print(json.dumps(result, ensure_ascii=False))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
