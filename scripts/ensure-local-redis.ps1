[CmdletBinding()]
param(
  [string]$RedisUrl = 'redis://127.0.0.1:6379',
  [switch]$Quiet
)

$ErrorActionPreference = 'Stop'

function Test-RedisAvailability {
  param(
    [string]$TargetRedisUrl
  )

  $uri = [System.Uri]$TargetRedisUrl
  $redisHost = if ($uri.Host) { $uri.Host } else { '127.0.0.1' }
  $port = if ($uri.Port -gt 0) { $uri.Port } else { 6379 }

  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $asyncResult = $client.BeginConnect($redisHost, $port, $null, $null)
    $connected = $asyncResult.AsyncWaitHandle.WaitOne(2000, $false)

    if (-not $connected) {
      $client.Close()
      return $false
    }

    $client.EndConnect($asyncResult)
    $client.Close()
    return $true
  } catch {
    return $false
  }
}

function Find-RedisServerExecutable {
  $candidateSpecs = @(
    @{
      executable = 'C:\ProgramData\chocolatey\lib\redis\tools\redis-server.exe'
      args = @('redis.conf')
      workingDirectory = 'C:\ProgramData\chocolatey\lib\redis\tools'
    },
    @{
      executable = 'C:\Redis\redis-server.exe'
      args = @()
      workingDirectory = 'C:\Redis'
    },
    @{
      executable = 'C:\Program Files\Redis\redis-server.exe'
      args = @()
      workingDirectory = 'C:\Program Files\Redis'
    },
    @{
      executable = 'C:\Program Files (x86)\Redis\redis-server.exe'
      args = @()
      workingDirectory = 'C:\Program Files (x86)\Redis'
    },
    @{
      executable = 'C:\tools\redis\redis-server.exe'
      args = @()
      workingDirectory = 'C:\tools\redis'
    },
    @{
      executable = 'C:\tools\redis64\redis-server.exe'
      args = @()
      workingDirectory = 'C:\tools\redis64'
    }
  )

  foreach ($candidateSpec in $candidateSpecs) {
    if (Test-Path -LiteralPath $candidateSpec.executable) {
      return $candidateSpec
    }
  }

  return $null
}

if (Test-RedisAvailability -TargetRedisUrl $RedisUrl) {
  if (-not $Quiet) {
    Write-Host "Redis is already reachable at $RedisUrl"
  }

  exit 0
}

$service = Get-Service -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -match 'redis' -or $_.DisplayName -match 'redis' } |
  Select-Object -First 1

if ($null -ne $service) {
  if ($service.Status -ne 'Running') {
    if (-not $Quiet) {
      Write-Host "Starting Redis service: $($service.Name)"
    }

    Start-Service -Name $service.Name
    Start-Sleep -Seconds 2
  }

  if (Test-RedisAvailability -TargetRedisUrl $RedisUrl) {
    if (-not $Quiet) {
      Write-Host "Redis service is reachable at $RedisUrl"
    }

    exit 0
  }
}

$redisServerSpec = Find-RedisServerExecutable

if ($null -ne $redisServerSpec) {
  if (-not $Quiet) {
    Write-Host "Starting Redis executable: $($redisServerSpec.executable)"
  }

  $startProcessParams = @{
    FilePath = $redisServerSpec.executable
    WindowStyle = 'Hidden'
  }

  if ($redisServerSpec.args.Count -gt 0) {
    $startProcessParams.ArgumentList = $redisServerSpec.args
  }

  if ($redisServerSpec.workingDirectory) {
    $startProcessParams.WorkingDirectory = $redisServerSpec.workingDirectory
  }

  Start-Process @startProcessParams | Out-Null
  Start-Sleep -Seconds 2

  if (Test-RedisAvailability -TargetRedisUrl $RedisUrl) {
    if (-not $Quiet) {
      Write-Host "Redis executable is reachable at $RedisUrl"
    }

    exit 0
  }
}

throw "Redis is not reachable at $RedisUrl and no local Redis service/executable could be started automatically."
