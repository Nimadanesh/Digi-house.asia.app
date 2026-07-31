<#
.SYNOPSIS
  pg_dump custom format to backups/
.DESCRIPTION
  Runs pg_dump inside the digihouse-postgres Docker container (or locally)
  and writes a compressed dump to backups/digihouse-YYYYMMDD-HHmm.dump.
.PARAMETER DATABASE_URL
  Required. Set as env var or in apps/api/.env.
.EXAMPLE
  $env:DATABASE_URL="postgresql://digihouse:digihouse@localhost:5432/digihouse"
  .\scripts\db-backup.ps1
#>

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$BackupDir = Join-Path $ProjectDir "backups"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmm"
$Filename = "digihouse-$Timestamp.dump"
$DbUrl = $env:DATABASE_URL

# Auto-load from apps/api/.env if not set
if (-not $DbUrl) {
  $EnvFile = Join-Path $ProjectDir "apps/api/.env"
  if (Test-Path $EnvFile) {
    $Line = (Get-Content $EnvFile) -match "^DATABASE_URL=" | Select-Object -First 1
    if ($Line) {
      $DbUrl = $Line -replace "^DATABASE_URL=", ""
      Write-Host "Loaded DATABASE_URL from apps/api/.env"
    }
  }
}

if (-not $DbUrl) {
  Write-Host "ERROR: DATABASE_URL is not set and not found in apps/api/.env"
  Write-Host "Usage: `$env:DATABASE_URL='postgresql://user:pass@host:5432/digihouse'; .\scripts\db-backup.ps1"
  exit 1
}

# Mask password for logging
$MaskedUrl = $DbUrl -replace '://([^:]+):([^@]+)@', '://$1:***@'
Write-Host "Connection: $MaskedUrl"

if (-not (Test-Path $BackupDir)) {
  New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

# Check Docker container first
$ContainerRunning = docker inspect digihouse-postgres 2>$null
if ($LASTEXITCODE -eq 0) {
  Write-Host "Using docker exec digihouse-postgres pg_dump ..."
  $DumpFile = Join-Path $BackupDir $Filename
  docker exec -i digihouse-postgres pg_dump --dbname "$DbUrl" -Fc 2>$null | Set-Content -Path $DumpFile -Encoding Byte
  $ExitCode = $LASTEXITCODE
} else {
  Write-Host "Using local pg_dump ..."
  $DumpFile = Join-Path $BackupDir $Filename
  pg_dump --dbname "$DbUrl" -Fc 2>$null | Set-Content -Path $DumpFile -Encoding Byte
  $ExitCode = $LASTEXITCODE
}

if ($ExitCode -ne 0) {
  Write-Host "ERROR: pg_dump failed (exit $ExitCode)"
  exit $ExitCode
}

$FileSize = (Get-Item $DumpFile).Length
Write-Host "Backup written: $DumpFile ($FileSize bytes)"
