[CmdletBinding()]
param(
  [switch]$SkipRefresh
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot

Push-Location $repoRoot

try {
  if ($SkipRefresh) {
    Write-Host 'Refreshing closeout artifacts in skip-refresh mode...'
    & npm run verify:trade-crm-phase1-closeout:local -- -SkipRefresh
  } else {
    Write-Host 'Refreshing closeout artifacts before entering trial run...'
    & npm run verify:trade-crm-phase1-closeout:local
  }
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }

  Write-Host 'Entering phase-1 controlled trial run...'
  & npm run enter:trade-crm-phase1-trial-run
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }

  Write-Host 'Exporting phase-1 trial-run operating pack...'
  & npm run export:trade-crm-phase1-trial-run-operating-pack
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }

  Write-Host 'Exporting phase-1 trial-run daily report...'
  & npm run export:trade-crm-phase1-trial-run-daily-report
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
} finally {
  Pop-Location
}
