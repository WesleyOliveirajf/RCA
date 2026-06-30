"""Apply one ODBC sync chunk via Supabase MCP execute_sql using stdio bridge."""
from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

PROJECT_ID = "lgsxqipuydyyxqkvbfth"
BASE = Path(__file__).resolve().parent / ".sync_batches"

CHUNKS = [
    "_mcp_payload_chunk_01.json",
    "_mcp_payload_chunk_02.json",
    "_mcp_payload_chunk_03.json",
    "_mcp_payload_chunk_04.json",
]

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

    # Cursor plugin MCP server command (Supabase)
    server_params = StdioServerParameters(
        command="npx",
        args=["-y", "@supabase/mcp-server-supabase"],
        env=None,
    )

    success_count = 0
    failed: list[dict] = []
    verification: dict | None = None

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            for name in CHUNKS:
                payload = json.loads((BASE / name).read_text(encoding="utf-8"))
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
                        verification = json.loads(text)
                        if isinstance(verification, list) and verification:
                            verification = verification[0]
                    except json.JSONDecodeError:
                        verification = {"raw": text[:300]}

    out = {
        "success_count": success_count,
        "failed": failed,
        "verification": verification,
    }
    print(json.dumps(out, ensure_ascii=False))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
