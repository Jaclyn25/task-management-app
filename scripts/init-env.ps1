$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
if (!(Test-Path -LiteralPath '.env')) {
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $rng.Dispose()
    $secret = [BitConverter]::ToString($bytes).Replace('-', '').ToLowerInvariant()
    "POSTGRES_PASSWORD=$secret" | Set-Content -LiteralPath '.env'
    Write-Output 'Created local .env with a random database password.'
} else { Write-Output 'Preserved existing .env.' }
