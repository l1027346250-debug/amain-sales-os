[CmdletBinding()]
param(
  [string]$PgDatabaseUrl = 'postgres://postgres:postgres@127.0.0.1:5432/postgres',
  [string]$WorkspaceId = '',
  [string]$ConfigPath = '',
  [switch]$Quiet
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false

$repoRoot = Split-Path -Parent $PSScriptRoot
$serverDir = Join-Path $repoRoot 'packages\twenty-server'
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

if (-not $PSBoundParameters.ContainsKey('WorkspaceId') -and $env:TRADE_CRM_WORKSPACE_ID) {
  $WorkspaceId = $env:TRADE_CRM_WORKSPACE_ID
}

if (-not $WorkspaceId) {
  $WorkspaceId = '20202020-1c25-4d02-bf25-6aeccf7ea419'
}

$env:PG_DATABASE_URL = $PgDatabaseUrl
$env:TRADE_CRM_WORKSPACE_ID = $WorkspaceId
$env:REDIS_URL = if ($env:REDIS_URL) { $env:REDIS_URL } else { 'redis://127.0.0.1:6379' }
$env:APP_SECRET = if ($env:APP_SECRET) { $env:APP_SECRET } else { 'trade-crm-dev-secret' }

if (-not $Quiet) {
  Write-Host 'Preparing Trade CRM smoke prerequisites...'
  Write-Host "Repo: $repoRoot"
  Write-Host "Server dir: $serverDir"
  Write-Host "Config: $resolvedConfigPath"
  Write-Host "PG_DATABASE_URL: $PgDatabaseUrl"
  Write-Host "Workspace: $WorkspaceId"
}

function Invoke-Step {
  param(
    [scriptblock]$CommandBlock,
    [string]$StepName
  )

  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  & $CommandBlock
  $ErrorActionPreference = $previousErrorActionPreference

  if ($LASTEXITCODE -ne 0) {
    throw "Step failed: $StepName (exit code $LASTEXITCODE)"
  }
}

Push-Location $serverDir

try {
  Invoke-Step -StepName 'workspace:seed:assets' -CommandBlock {
    $seedDependenciesSourceDir = Join-Path $serverDir 'src\engine\core-modules\application\application-package\constants\seed-dependencies'
    $seedDependenciesDistDir = Join-Path $serverDir 'dist\engine\core-modules\application\application-package\constants\seed-dependencies'

    if (-not (Test-Path -LiteralPath $seedDependenciesSourceDir)) {
      throw "Missing seed dependency source directory: $seedDependenciesSourceDir"
    }

    New-Item -ItemType Directory -Path $seedDependenciesDistDir -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $seedDependenciesSourceDir 'package.json') -Destination (Join-Path $seedDependenciesDistDir 'package.json') -Force
    Copy-Item -LiteralPath (Join-Path $seedDependenciesSourceDir 'yarn.lock') -Destination (Join-Path $seedDependenciesDistDir 'yarn.lock') -Force
  }
  Invoke-Step -StepName 'redis:ensure-local' -CommandBlock {
    $redisEnsureArgs = @(
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      (Join-Path $repoRoot 'scripts\ensure-local-redis.ps1'),
      '-RedisUrl',
      $env:REDIS_URL
    )

    if ($Quiet) {
      $redisEnsureArgs += '-Quiet'
    }

    & powershell @redisEnsureArgs
  }
  Invoke-Step -StepName 'database:truncate' -CommandBlock {
    node dist/database/scripts/truncate-db.js
  }
  Invoke-Step -StepName 'database:setup' -CommandBlock {
    node dist/database/scripts/setup-db.js
  }
  Invoke-Step -StepName 'database:migrate' -CommandBlock {
    node dist/command/command.js run-typeorm-migration --force
  }
  Invoke-Step -StepName 'cache:flush' -CommandBlock {
    node dist/command/command.js cache:flush
  }
  Invoke-Step -StepName 'workspace:seed:dev' -CommandBlock {
    node dist/command/command.js workspace:seed:dev
  }
  Invoke-Step -StepName 'workspace:init:trade-crm' -CommandBlock {
    node dist/command/command.js workspace:init:trade-crm --workspace-id $WorkspaceId
  }
  Invoke-Step -StepName 'workspace:init:trade-crm:views' -CommandBlock {
    node dist/command/command.js workspace:init:trade-crm:views --workspace-id $WorkspaceId
  }
  Invoke-Step -StepName 'workspace:config:trade-crm:opportunity-stages' -CommandBlock {
    node dist/command/command.js workspace:config:trade-crm:opportunity-stages --workspace-id $WorkspaceId
  }
  Invoke-Step -StepName 'workspace:backfill:workspace-members' -CommandBlock {
    node dist/command/command.js workspace:backfill:workspace-members --workspace-id $WorkspaceId
  }
  Invoke-Step -StepName 'workspace:list:workspace-members' -CommandBlock {
    node dist/command/command.js workspace:list:workspace-members --workspace-id $WorkspaceId --limit 5
  }
} finally {
  Pop-Location
}

if (-not $Quiet) {
  Write-Host 'Trade CRM smoke prerequisites prepared.'
}
