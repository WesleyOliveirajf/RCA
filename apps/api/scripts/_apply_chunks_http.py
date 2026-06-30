"""Apply ODBC sync chunk SQL files via Supabase HTTP MCP execute_sql."""
from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

PROJECT_ID = "lgsxqipuydyyxqkvbfth"
MCP_URL = f"https://mcp.supabase.com/mcp?project_ref={PROJECT_ID}"
BASE = Path(__file__).resolve().parent / ".sync_batches"

CHUNKS = [
    "_chunk_01.sql",
    "_chunk_02.sql",
    "_chunk_03.sql",
    "_chunk_04.sql",
    "_chunk_extra.sql",
]

VERIFY_SQL = (
    "SELECT count(*) FILTER (WHERE cnpj IS NOT NULL) as com_cnpj, "
    "count(*) FILTER (WHERE telefone IS NOT NULL) as com_tel FROM public.clientes;"
)


async def call_sql(session, query: str) -> tuple[bool, str]:
    resp = await session.call_tool(
        "execute_sql",
        {"project_id": PROJECT_ID, "query": query},
    )
    text = "".join(b.text for b in (resp.content or []) if hasattr(b, "text"))
    failed = bool(getattr(resp, "isError", False)) or (
        "error" in text.lower() and "below is the result" not in text.lower()
    )
    return failed, text


async def main() -> int:
    from mcp.client.streamable_http import streamablehttp_client
    from mcp import ClientSession

    success_count = 0
    failed: list[dict] = []
    verification: dict | None = None

    async with streamablehttp_client(MCP_URL) as (read, write, _):
        async with ClientSession(read, write) as session:
            await session.initialize()

            for name in CHUNKS:
                path = BASE / name
                sql = path.read_text(encoding="utf-8")
                try:
                    err, text = await call_sql(session, sql)
                    if err:
                        failed.append({"file": name, "error": text[:500]})
                    else:
                        success_count += 1
                except Exception as exc:
                    failed.append({"file": name, "error": str(exc)})

            if not failed:
                try:
                    err, text = await call_sql(session, VERIFY_SQL)
                    if err:
                        failed.append({"file": "verification", "error": text[:500]})
                    else:
                        try:
                            verification = json.loads(text)
                            if isinstance(verification, list) and verification:
                                verification = verification[0]
                        except json.JSONDecodeError:
                            verification = {"raw": text[:500]}
                except Exception as exc:
                    failed.append({"file": "verification", "error": str(exc)})

    result = {
        "success_count": success_count,
        "failed": failed,
        "verification": verification,
    }
    print(json.dumps(result, ensure_ascii=False))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
