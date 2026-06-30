"""Apply batches 003-011 via Supabase MCP execute_sql using exec_args JSON files.

Run inside Cursor agent: for each batch, load exec_args_NNN.json and call
plugin-supabase-supabase execute_sql with project_id and query.

This script tracks progress in _apply_progress.json.
"""
from __future__ import annotations

import json
from pathlib import Path

PROJECT_ID = "lgsxqipuydyyxqkvbfth"
RUN = Path(__file__).resolve().parent / ".sync_batches" / "_mcp_run"
BATCHES = list(range(3, 12))
VERIFY = (
    "SELECT count(*) FILTER (WHERE cnpj IS NOT NULL) as com_cnpj, "
    "count(*) FILTER (WHERE telefone IS NOT NULL) as com_tel FROM public.clientes;"
)


def load_args(n: int) -> dict:
    return json.loads((RUN / f"exec_args_{n:03d}.json").read_text(encoding="utf-8"))


def main() -> None:
    pending = []
    for n in BATCHES:
        args = load_args(n)
        pending.append({"batch": n, "bytes": len(args["query"]), "file": f"exec_args_{n:03d}.json"})
    progress = {"project_id": PROJECT_ID, "pending": pending, "verify": VERIFY}
    (RUN / "_apply_progress.json").write_text(json.dumps(progress, indent=2), encoding="utf-8")
    print(json.dumps(progress, indent=2))


if __name__ == "__main__":
    main()
