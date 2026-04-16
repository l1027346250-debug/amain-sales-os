[CmdletBinding()]
param(
  [switch]$SkipRefresh
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot

Push-Location $repoRoot

try {
  if (-not $SkipRefresh) {
    Write-Host 'Refreshing phase-1 readiness artifacts...'
    & npm run verify:trade-crm-phase1-readiness
    if ($LASTEXITCODE -ne 0) {
      exit $LASTEXITCODE
    }

    Write-Host 'Refreshing phase-1 full readiness artifacts...'
    & npm run verify:trade-crm-phase1-readiness:full
    if ($LASTEXITCODE -ne 0) {
      exit $LASTEXITCODE
    }

    Write-Host 'Refreshing local smoke artifacts...'
    & npm run verify:trade-crm-smoke:local -- --Quiet
    if ($LASTEXITCODE -ne 0) {
      exit $LASTEXITCODE
    }

    Write-Host 'Refreshing business trial readiness artifacts...'
    & npm run verify:trade-crm-phase1-business-trial-readiness
    if ($LASTEXITCODE -ne 0) {
      exit $LASTEXITCODE
    }

    Write-Host 'Refreshing business trial pack artifacts...'
    & npm run prepare:trade-crm-phase1-business-trial-pack
    if ($LASTEXITCODE -ne 0) {
      exit $LASTEXITCODE
    }

    & npm run review:trade-crm-phase1-business-trial-pack
    if ($LASTEXITCODE -ne 0) {
      exit $LASTEXITCODE
    }

    Write-Host 'Refreshing dual-view UAT demo artifacts...'
    & npm run export:trade-crm-phase1-uat-demo-script
    if ($LASTEXITCODE -ne 0) {
      exit $LASTEXITCODE
    }
  }

  Write-Host 'Generating phase-1 convergence summary...'
  & npm run verify:trade-crm-phase1-convergence
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
} finally {
  Pop-Location
}
