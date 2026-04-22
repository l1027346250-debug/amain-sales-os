[CmdletBinding()]
param(
  [string]$PgDatabaseUrl = 'postgres://postgres:postgres@127.0.0.1:5432/postgres',
  [string]$RedisUrl = 'redis://127.0.0.1:6379',
  [string]$AppSecret = 'trade-crm-dev-secret',
  [string]$RedisServerExe = '',
  [string]$BindHost = '127.0.0.1',
  [int]$BackendPort = 3000,
  [int]$FrontendPort = 4175
)

$ErrorActionPreference = 'Stop'

function Test-TcpPort {
  param(
    [string]$TargetHost,
    [int]$Port,
    [int]$TimeoutMs = 1500
  )

  $client = New-Object System.Net.Sockets.TcpClient

  try {
    $asyncResult = $client.BeginConnect($TargetHost, $Port, $null, $null)

    if (-not $asyncResult.AsyncWaitHandle.WaitOne($TimeoutMs, $false)) {
      return $false
    }

    $client.EndConnect($asyncResult)
    return $true
  } catch {
    return $false
  } finally {
    $client.Dispose()
  }
}

function Wait-HttpReady {
  param(
    [string]$Url,
    [int]$MaxAttempts = 60,
    [int]$DelayMs = 1000
  )

  for ($attempt = 0; $attempt -lt $MaxAttempts; $attempt++) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3

      if ($response.StatusCode -eq 200) {
        return $response
      }
    } catch {
    }

    Start-Sleep -Milliseconds $DelayMs
  }

  throw "HTTP probe failed: $Url"
}

function Resolve-RedisServerExe {
  param([string]$ExplicitPath)

  $candidates = @()

  if (-not [string]::IsNullOrWhiteSpace($ExplicitPath)) {
    $candidates += $ExplicitPath
  }

  if ($env:TRADE_CRM_REDIS_SERVER_EXE) {
    $candidates += $env:TRADE_CRM_REDIS_SERVER_EXE
  }

  $candidates += @(
    'C:\Users\Administrator\redis\Redis-8.2.3-Windows-x64-msys2\redis-server.exe',
    'C:\Program Files\Redis\redis-server.exe'
  )

  foreach ($candidate in $candidates | Select-Object -Unique) {
    if ($candidate -and (Test-Path -LiteralPath $candidate)) {
      return $candidate
    }
  }

  throw 'Redis server executable not found. Set -RedisServerExe or TRADE_CRM_REDIS_SERVER_EXE.'
}

function Start-DetachedCmdProcess {
  param(
    [string]$CommandLine,
    [string]$StdOutPath,
    [string]$StdErrPath
  )

  return Start-Process `
    -FilePath 'C:\Windows\System32\cmd.exe' `
    -ArgumentList '/d', '/s', '/c', $CommandLine `
    -RedirectStandardOutput $StdOutPath `
    -RedirectStandardError $StdErrPath `
    -PassThru
}

function Get-ListeningPid {
  param([int]$Port)

  try {
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction Stop |
      Where-Object { $_.State -eq 'Listen' } |
      Select-Object -First 1

    if ($connection) {
      return [int]$connection.OwningProcess
    }
  } catch {
  }

  $netstatExe = Join-Path $env:SystemRoot 'System32\netstat.exe'

  if (-not (Test-Path -LiteralPath $netstatExe)) {
    return $null
  }

  $netstatLine = & $netstatExe -ano -p tcp |
    Select-String -Pattern "^\s*TCP\s+\S+:$Port\s+\S+\s+LISTENING\s+(\d+)\s*$" |
    Select-Object -First 1

  if ($netstatLine) {
    $match = [regex]::Match($netstatLine.ToString(), 'LISTENING\s+(\d+)\s*$')

    if ($match.Success) {
      return [int]$match.Groups[1].Value
    }
  }

  return $null
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $repoRoot 'tmp\trade-crm-runtime'
$backendOut = Join-Path $runtimeDir 'backend.out.log'
$backendErr = Join-Path $runtimeDir 'backend.err.log'
$frontendOut = Join-Path $runtimeDir 'frontend.out.log'
$frontendErr = Join-Path $runtimeDir 'frontend.err.log'
$redisOut = Join-Path $runtimeDir 'redis.out.log'
$redisErr = Join-Path $runtimeDir 'redis.err.log'
$runtimeStatePath = Join-Path $runtimeDir 'runtime-state.json'
$runtimeProcessPath = Join-Path $runtimeDir 'runtime-processes.json'
$backendDist = Join-Path $repoRoot 'packages\twenty-server\dist\main.js'
$frontendIndex = Join-Path $repoRoot 'packages\twenty-front\build\index.html'
$backendHealthUrl = "http://${BindHost}:${BackendPort}/healthz"
$frontendUrl = "http://${BindHost}:${FrontendPort}"
$sellerWorkbenchUrl = "${frontendUrl}/trade-crm/workbench"
$managerAnalyticsUrl = "${frontendUrl}/trade-crm/analytics"

New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null

if (-not (Test-Path -LiteralPath $backendDist)) {
  throw "Missing backend build artifact: $backendDist"
}

if (-not (Test-Path -LiteralPath $frontendIndex)) {
  throw "Missing frontend build artifact: $frontendIndex"
}

$redisPid = $null
$backendStarterPid = $null
$frontendStarterPid = $null

if (-not (Test-TcpPort -TargetHost $BindHost -Port 6379)) {
  $redisExe = Resolve-RedisServerExe -ExplicitPath $RedisServerExe

  $redisProcess = Start-Process `
    -FilePath $redisExe `
    -ArgumentList '--port', '6379', '--bind', $BindHost `
    -RedirectStandardOutput $redisOut `
    -RedirectStandardError $redisErr `
    -PassThru

  $redisPid = $redisProcess.Id

  for ($attempt = 0; $attempt -lt 20; $attempt++) {
    if (Test-TcpPort -TargetHost $BindHost -Port 6379) {
      break
    }

    Start-Sleep -Milliseconds 500
  }

  if (-not (Test-TcpPort -TargetHost $BindHost -Port 6379)) {
    throw 'Redis did not start on port 6379.'
  }
} else {
  $existingRedis = Get-Process -Name 'redis-server' -ErrorAction SilentlyContinue | Select-Object -First 1

  if ($existingRedis) {
    $redisPid = $existingRedis.Id
  }
}

if (-not (Test-TcpPort -TargetHost $BindHost -Port $BackendPort)) {
  $backendCommand = @(
    "set PG_DATABASE_URL=$PgDatabaseUrl",
    "set REDIS_URL=$RedisUrl",
    "set APP_SECRET=$AppSecret",
    "cd /d `"$repoRoot\packages\twenty-server`"",
    'node dist/main.js'
  ) -join '&& '

  $backendProcess = Start-DetachedCmdProcess `
    -CommandLine $backendCommand `
    -StdOutPath $backendOut `
    -StdErrPath $backendErr

  $backendStarterPid = $backendProcess.Id
}

$backendResponse = Wait-HttpReady -Url $backendHealthUrl -MaxAttempts 120 -DelayMs 1000
$backendPid = Get-ListeningPid -Port $BackendPort

if (-not (Test-TcpPort -TargetHost $BindHost -Port $FrontendPort)) {
  $frontendCommand = @(
    "cd /d `"$repoRoot`"",
    'node scripts/serve-trade-crm-front-static.js'
  ) -join '&& '

  $frontendProcess = Start-DetachedCmdProcess `
    -CommandLine $frontendCommand `
    -StdOutPath $frontendOut `
    -StdErrPath $frontendErr

  $frontendStarterPid = $frontendProcess.Id
}

$frontendRootResponse = Wait-HttpReady -Url "${frontendUrl}/" -MaxAttempts 60 -DelayMs 500
$workbenchResponse = Wait-HttpReady -Url $sellerWorkbenchUrl -MaxAttempts 60 -DelayMs 500
$analyticsResponse = Wait-HttpReady -Url $managerAnalyticsUrl -MaxAttempts 60 -DelayMs 500
$frontendPid = Get-ListeningPid -Port $FrontendPort

$state = [ordered]@{
  generatedAt = (Get-Date).ToString('o')
  backendUrl = "http://${BindHost}:${BackendPort}"
  backendHealthUrl = $backendHealthUrl
  frontendUrl = $frontendUrl
  sellerWorkbenchUrl = $sellerWorkbenchUrl
  managerAnalyticsUrl = $managerAnalyticsUrl
  backendListeningPid = $backendPid
  backendStarterPid = $backendStarterPid
  frontendPid = $frontendPid
  frontendStarterPid = $frontendStarterPid
  redisPid = $redisPid
  runtimeProcessFile = $runtimeProcessPath
  backendOut = $backendOut
  backendErr = $backendErr
  frontendOut = $frontendOut
  frontendErr = $frontendErr
  redisOut = $redisOut
  redisErr = $redisErr
  stopCommand = 'Stop-Process -Id ' + ((@($backendPid, $frontendPid, $redisPid) | Where-Object { $_ } | Select-Object -Unique) -join ',')
}

$processes = [ordered]@{
  backendPid = $backendPid
  backendStarterPid = $backendStarterPid
  frontendPid = $frontendPid
  frontendStarterPid = $frontendStarterPid
  redisPid = $redisPid
  runtimeDir = $runtimeDir
  backendOut = $backendOut
  backendErr = $backendErr
  frontendOut = $frontendOut
  frontendErr = $frontendErr
  redisOut = $redisOut
  redisErr = $redisErr
}

$state | ConvertTo-Json -Depth 6 | Set-Content -Path $runtimeStatePath -Encoding UTF8
$processes | ConvertTo-Json -Depth 6 | Set-Content -Path $runtimeProcessPath -Encoding UTF8

[ordered]@{
  status = 'ok'
  runtimeStatePath = $runtimeStatePath
  backendHealth = $backendResponse.StatusCode
  frontendRoot = $frontendRootResponse.StatusCode
  workbench = $workbenchResponse.StatusCode
  analytics = $analyticsResponse.StatusCode
  backendPid = $backendPid
  frontendPid = $frontendPid
  redisPid = $redisPid
  stopCommand = $state.stopCommand
} | ConvertTo-Json -Depth 5
