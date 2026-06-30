"""Apply q00-q06 SQL files via Supabase MCP stdio when SUPABASE_ACCESS_TOKEN is set."""
from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path

PROJECT_ID = "lgsxqipuydyyxqkvbfth"
RUN = Path(__file__).resolve().parent / ".sync_batches" / "_mcp_run"
INDICES = list(range(7))
VERIFY = (
    "SELECT count(*) FILTER (WHERE cnpj IS NOT NULL) as com_cnpj, "
    "count(*) FILTER (WHERE telefone IS NOT NULL) as com_tel FROM public.clientes;"
)


def load_query(idx: int) -> str:
    return (RUN / f"q{idx:02d}.sql").read_text(encoding="utf-8")


async def apply_all() -> dict:
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client

    token = os.environ["SUPABASE_ACCESS_TOKEN"]
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
            for idx in INDICES:
                name = f"q{idx:02d}.sql"
                try:
                    resp = await session.call_tool(
                        "execute_sql",
                        {"project_id": PROJECT_ID, "query": load_query(idx)},
                    )
                    text = "".join(b.text for b in (resp.content or []) if hasattr(b, "text"))
                    if getattr(resp, "isError", False):
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
                import re

                m_cnpj = re.search(r'"com_cnpj"\s*:\s*(\d+)', text)
                m_tel = re.search(r'"com_tel"\s*:\s*(\d+)', text)
                if m_cnpj and m_tel:
                    verification = {"com_cnpj": int(m_cnpj.group(1)), "com_tel": int(m_tel.group(1))}
                else:
                    verification = {"raw": text[:400]}

    return {"success_count": success_count, "failed": failed, "verification": verification}


def main() -> int:
    if not os.environ.get("SUPABASE_ACCESS_TOKEN"):
        print(json.dumps({"error": "SUPABASE_ACCESS_TOKEN missing"}))
        return 1
    result = asyncio.run(apply_all())
    print(json.dumps(result, ensure_ascii=False))
    return 0 if not result["failed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
