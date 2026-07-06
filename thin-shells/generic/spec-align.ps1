param([Parameter(Mandatory=$true)][string]$Requirement)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CliPath = Join-Path $ScriptDir "..\..\packages\cli\dist\index.js"

if (-not (Test-Path $CliPath)) {
  Write-Host "[spec-align] CLI 未构建: $CliPath"
  Write-Host "[spec-align] 请先运行: npm run build"
  exit 1
}

Write-Host "[spec-align] 通用需求确认"
& node $CliPath quick $Requirement --no-wait --agent-type generic

Write-Host "[spec-align] 用户确认后通过以下命令获取结果:"
Write-Host "  spec-thought-align await-confirm --id <任务名>"
