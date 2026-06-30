import json
import sys
from pathlib import Path

name = sys.argv[1]
base = Path(__file__).resolve().parent / ".sync_batches"
sql = (base / name).read_text(encoding="utf-8")
print(json.dumps({"project_id": "lgsxqipuydyyxqkvbfth", "query": sql}))
