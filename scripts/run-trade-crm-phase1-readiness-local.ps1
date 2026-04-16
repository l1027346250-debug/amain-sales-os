param(
  [switch]$SkipSmoke,
  [switch]$PrepareSmokeEnv
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false

$repoRoot = Split-Path -Parent $PSScriptRoot
$artifactsDir = Join-Path $repoRoot 'tmp\trade-crm-readiness'
$summaryPath = Join-Path $artifactsDir 'phase1-readiness-summary.json'
$markdownPath = Join-Path $artifactsDir 'phase1-readiness-summary.md'

New-Item -ItemType Directory -Path $artifactsDir -Force | Out-Null

function Run-Check {
  param(
    [string]$Id,
    [string]$Description,
    [string]$WorkingDirectory,
    [scriptblock]$CommandBlock
  )

  $startedAt = (Get-Date).ToString('o')
  $status = 'passed'
  $exitCode = 0
  $outputSnippet = ''

  try {
    Push-Location $WorkingDirectory
    $output = & $CommandBlock 2>&1 | Out-String
    Pop-Location
    $outputSnippet = ($output -split "`r?`n" | Select-Object -Last 20) -join [Environment]::NewLine
  } catch {
    if (Get-Location) {
      try {
        Pop-Location
      } catch {
      }
    }
    $status = 'failed'
    $exitCode = 1
    $outputSnippet = $_ | Out-String
  }

  $finishedAt = (Get-Date).ToString('o')

  return [pscustomobject]@{
    id = $Id
    description = $Description
    cwd = $WorkingDirectory
    status = $status
    startedAt = $startedAt
    finishedAt = $finishedAt
    exitCode = $exitCode
    outputSnippet = $outputSnippet.Trim()
  }
}

$checks = @()

$checks += Run-Check `
  -Id 'frontend-typecheck' `
  -Description 'Front-end full TypeScript check' `
  -WorkingDirectory (Join-Path $repoRoot 'packages\twenty-front') `
  -CommandBlock { node ..\..\node_modules\typescript\bin\tsc -p tsconfig.json --noEmit }

$checks += Run-Check `
  -Id 'integration-hub-typecheck' `
  -Description 'Integration hub TypeScript check' `
  -WorkingDirectory (Join-Path $repoRoot 'integration-hub') `
  -CommandBlock { npm run typecheck }

if (-not $SkipSmoke) {
  if ($PrepareSmokeEnv) {
    $checks += Run-Check `
      -Id 'trade-crm-smoke-prerequisites' `
      -Description 'Prepare Trade CRM smoke DB/workspace prerequisites' `
      -WorkingDirectory $repoRoot `
      -CommandBlock {
        & .\scripts\prepare-trade-crm-smoke-prerequisites.ps1 -Quiet
      }
  }

  $checks += Run-Check `
    -Id 'trade-crm-smoke' `
    -Description 'Trade CRM smoke verification' `
    -WorkingDirectory $repoRoot `
    -CommandBlock { npm run verify:trade-crm-smoke:local -- --Quiet }
}

$failedChecks = @($checks | Where-Object { $_.status -ne 'passed' })
$status = if ($failedChecks.Count -eq 0) { 'passed' } else { 'failed' }

$summary = [pscustomobject]@{
  status = $status
  startedAt = if ($checks.Count -gt 0) { $checks[0].startedAt } else { (Get-Date).ToString('o') }
  finishedAt = (Get-Date).ToString('o')
  skipSmoke = [bool]$SkipSmoke
  checks = $checks
  failedCheckIds = @($failedChecks | ForEach-Object { $_.id })
  artifacts = [pscustomobject]@{
    summaryPath = $summaryPath
    markdownPath = $markdownPath
  }
}

$summary | ConvertTo-Json -Depth 10 | Set-Content -Path $summaryPath -Encoding UTF8

$markdownLines = @(
  '# Trade CRM Phase 1 Readiness Summary',
  '',
  "Status: $($status.ToUpper())",
  "Skip smoke: $(if ($SkipSmoke) { 'yes' } else { 'no' })",
  '',
  '## Checks'
)

foreach ($check in $checks) {
  $markdownLines += "- $($check.id): $($check.status.ToUpper()) ($($check.description))"
}

$markdownLines += ''
$markdownLines += '## Failed Checks'

if ($failedChecks.Count -eq 0) {
  $markdownLines += '- none'
} else {
  foreach ($check in $failedChecks) {
    $markdownLines += "- $($check.id) (exit code $($check.exitCode))"
  }
}

$markdownLines -join [Environment]::NewLine | Set-Content -Path $markdownPath -Encoding UTF8

$result = [pscustomobject]@{
  status = $status
  summaryPath = $summaryPath
  markdownPath = $markdownPath
  failedCheckIds = @($failedChecks | ForEach-Object { $_.id })
}

$result | ConvertTo-Json -Depth 5

if ($status -ne 'passed') {
  exit 1
}
