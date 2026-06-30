# Helper: reads each _mcp_call_XX.json and writes status for manual MCP execution tracking
$base = "c:\Users\supervisor.ti\Desktop\Futuras Aplicações\RCA-Torp\apps\api\scripts\.sync_batches"
$names = @(
  "batch_001.sql","batch_002.sql","batch_003.sql","batch_004.sql","batch_005.sql",
  "batch_006.sql","batch_007.sql","batch_008.sql","batch_009.sql","batch_010.sql",
  "batch_011.sql","batch_012.sql","batch_013.sql","batch_cards.sql","batch_log.sql"
)
for ($i = 0; $i -lt 15; $i++) {
  $f = Join-Path $base ("_mcp_call_{0:D2}.json" -f $i)
  $j = Get-Content $f -Raw -Encoding UTF8 | ConvertFrom-Json
  Write-Output "$($names[$i]) bytes=$($j.query.Length)"
}
