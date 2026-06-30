from pathlib import Path
import re

base = Path(__file__).parent / ".sync_batches"
chunks = base / "_chunks"

for i in range(1, 13):
    t = (base / f"batch_{i:03d}.sql").read_text(encoding="utf-8")
    m = re.search(r"\('\d+'", t)
    print(f"batch_{i:03d} starts {m.group(0) if m else '?'}")

for ci in range(1, 5):
    t = (chunks / f"chunk_{ci}.sql").read_text(encoding="utf-8")
    stmts = [s for s in t.split("INSERT INTO") if s.strip()]
    first = re.search(r"\('\d+'", stmts[0]) if stmts else None
    print(
        f"chunk_{ci}: {len(stmts)} statements, "
        f"first id {first.group(0) if first else '?'}"
    )
