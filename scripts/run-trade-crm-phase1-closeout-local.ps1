[CmdletBinding()]
param(
  [switch]$SkipRefresh
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot

Push-Location $repoRoot

try {
  if ($SkipRefresh) {
    Write-Host 'Running convergence in skip-refresh mode...'
    & powershell -ExecutionPolicy Bypass -File .\scripts\run-trade-crm-phase1-convergence-local.ps1 -SkipRefresh
  } else {
    Write-Host 'Running convergence with full refresh...'
    & powershell -ExecutionPolicy Bypass -File .\scripts\run-trade-crm-phase1-convergence-local.ps1
  }
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }

  Write-Host 'Refreshing dual-view UAT demo script artifacts...'
  & npm run export:trade-crm-phase1-uat-demo-script
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }

  Write-Host 'Refreshing phase-1 handoff package artifacts...'
  & npm run export:trade-crm-phase1-handoff-package
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }

  Write-Host 'Refreshing phase-1 weekly report artifacts...'
  & npm run export:trade-crm-phase1-weekly-report
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
} finally {
  Pop-Location
}
