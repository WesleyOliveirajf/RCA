"""Load SQL from mcp_exec JSON and print for agent MCP apply. Usage: python _mcp_apply_loop.py 004"""
import json
import sys
from pathlib import Path

RUN = Path(__file__).resolve().parent / ".sync_batches" / "_mcp_run"
PROJECT = "lgsxqipuydyyxqkvbfth"

def main() -> None:
    n = sys.argv[1] if len(sys.argv) > 1 else "004"
    path = RUN / f"mcp_exec_{n}.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    print(json.dumps({"project_id": PROJECT, "query": data["query"]}, ensure_ascii=False))

if __name__ == "__main__":
    main()
