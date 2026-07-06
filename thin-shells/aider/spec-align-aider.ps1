param([Parameter(Mandatory=$true)][string]$Requirement)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CliPath = Join-Path $ScriptDir "..\..\packages\cli\dist\index.js"

if (-not (Test-Path $CliPath)) {
  Write-Host "[spec-align] CLI 未构建: $CliPath"
  Write-Host "[spec-align] 请先运行: npm run build"
  exit 1
}

Write-Host "[spec-align] Aider 需求确认"
& node $CliPath quick $Requirement --wait --agent-type aider

if ($LASTEXITCODE -ne 0) {
  Write-Host "[spec-align] 流程被取消或超时 (exit=$LASTEXITCODE)"
}
