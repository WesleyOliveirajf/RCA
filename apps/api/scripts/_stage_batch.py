"""Stage one batch SQL for MCP apply; prints batch name and byte length."""
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent / ".sync_batches"
batch = sys.argv[1] if len(sys.argv) > 1 else "003"
name = f"batch_{batch}.sql" if not batch.endswith(".sql") else batch
if not name.startswith("batch_"):
    name = f"batch_{name}"
sql_path = BASE / name
sql = sql_path.read_text(encoding="utf-8")
out = BASE / "_mcp_run" / "_current.sql"
out.write_text(sql, encoding="utf-8")
print(f"{name}|{len(sql)}")
