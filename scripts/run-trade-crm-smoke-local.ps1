[CmdletBinding()]
param(
  [string]$PgDatabaseUrl = 'postgres://postgres:postgres@127.0.0.1:5432/postgres',
  [string]$RedisUrl = 'redis://127.0.0.1:6379',
  [string]$AppSecret = 'trade-crm-dev-secret',
  [string]$DefaultAssigneeUserEmail = 'tim@apple.dev',
  [string]$WorkspaceId = '',
  [string]$ConfigPath = '',
  [switch]$Strict,
  [switch]$Quiet
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$resolvedConfigPath = if ($ConfigPath) {
  $ConfigPath
} else {
  Join-Path $repoRoot '.env.trade-crm-smoke'
}

if (Test-Path -LiteralPath $resolvedConfigPath) {
  Get-Content -LiteralPath $resolvedConfigPath | ForEach-Object {
    $line = $_.Trim()

    if (-not $line -or $line.StartsWith('#') -or -not $line.Contains('=')) {
      return
    }

    $name, $value = $line.Split('=', 2)
    $envName = $name.Trim()
    $envValue = $value.Trim().Trim('"').Trim("'")

    if ($envName) {
      [System.Environment]::SetEnvironmentVariable($envName, $envValue, 'Process')
    }
  }
}

if (-not $PSBoundParameters.ContainsKey('PgDatabaseUrl') -and $env:PG_DATABASE_URL) {
  $PgDatabaseUrl = $env:PG_DATABASE_URL
}

if (-not $PSBoundParameters.ContainsKey('RedisUrl') -and $env:REDIS_URL) {
  $RedisUrl = $env:REDIS_URL
}

if (-not $PSBoundParameters.ContainsKey('AppSecret') -and $env:APP_SECRET) {
  $AppSecret = $env:APP_SECRET
}

if (
  -not $PSBoundParameters.ContainsKey('DefaultAssigneeUserEmail') -and
  $env:TRADE_CRM_DEFAULT_ASSIGNEE_USER_EMAIL
) {
  $DefaultAssigneeUserEmail = $env:TRADE_CRM_DEFAULT_ASSIGNEE_USER_EMAIL
}

if (-not $PSBoundParameters.ContainsKey('WorkspaceId') -and $env:TRADE_CRM_WORKSPACE_ID) {
  $WorkspaceId = $env:TRADE_CRM_WORKSPACE_ID
}

$env:PG_DATABASE_URL = $PgDatabaseUrl
$env:REDIS_URL = $RedisUrl
$env:APP_SECRET = $AppSecret
$env:TRADE_CRM_DEFAULT_ASSIGNEE_USER_EMAIL = $DefaultAssigneeUserEmail

if ($WorkspaceId) {
  $env:TRADE_CRM_WORKSPACE_ID = $WorkspaceId
}

$leadAssignmentAutoDetected = $false
$autoDetectLeadAssignmentRules = $env:TRADE_CRM_SMOKE_AUTO_DETECT_RULES -ne '0'
$defaultLeadAssignmentRulesFile = Join-Path $repoRoot 'trade-crm-lead-assignment-rules.phase1-from-register.json'

if (
  $autoDetectLeadAssignmentRules -and
  [string]::IsNullOrWhiteSpace($env:TRADE_CRM_LEAD_ASSIGNMENT_RULES_JSON) -and
  [string]::IsNullOrWhiteSpace($env:TRADE_CRM_LEAD_ASSIGNMENT_RULES_FILE) -and
  (Test-Path -LiteralPath $defaultLeadAssignmentRulesFile)
) {
  [System.Environment]::SetEnvironmentVariable(
    'TRADE_CRM_LEAD_ASSIGNMENT_RULES_FILE',
    $defaultLeadAssignmentRulesFile,
    'Process'
  )
  $env:TRADE_CRM_LEAD_ASSIGNMENT_RULES_FILE = $defaultLeadAssignmentRulesFile
  $leadAssignmentAutoDetected = $true
}

$scriptName = if ($Strict) {
  'verify:trade-crm-smoke:ci:strict'
} elseif ($Quiet) {
  'verify:trade-crm-smoke:ci'
} else {
  'verify:trade-crm-smoke'
}

Write-Host "Running Trade CRM smoke from $repoRoot"
Write-Host "Command: corepack yarn $scriptName"
Write-Host "Config: $resolvedConfigPath"
Write-Host "PG_DATABASE_URL: $PgDatabaseUrl"
Write-Host "REDIS_URL: $RedisUrl"
Write-Host "Default assignee: $DefaultAssigneeUserEmail"
if (
  -not [string]::IsNullOrWhiteSpace($env:TRADE_CRM_LEAD_ASSIGNMENT_RULES_JSON) -or
  -not [string]::IsNullOrWhiteSpace($env:TRADE_CRM_LEAD_ASSIGNMENT_RULES_FILE)
) {
  Write-Host 'Lead assignment mode: rules'
  if ($leadAssignmentAutoDetected) {
    Write-Host "Lead assignment rules auto-detected: $($env:TRADE_CRM_LEAD_ASSIGNMENT_RULES_FILE)"
  }
  if ($env:TRADE_CRM_LEAD_ASSIGNMENT_RULES_FILE) {
    Write-Host "Lead assignment rules file: $($env:TRADE_CRM_LEAD_ASSIGNMENT_RULES_FILE)"
  }
} else {
  Write-Host 'Lead assignment mode: default_assignee'
}
if ($WorkspaceId) {
  Write-Host "Workspace: $WorkspaceId"
}
if ($env:TRADE_CRM_SMOKE_INCLUDE_PG_STATE -eq '1') {
  Write-Host 'PostgreSQL state checks: enabled'
} else {
  Write-Host 'PostgreSQL state checks: disabled'
}

Push-Location $repoRoot

try {
  & corepack yarn $scriptName
} finally {
  Pop-Location
}
