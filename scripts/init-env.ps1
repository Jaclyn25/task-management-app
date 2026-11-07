$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
if (!(Test-Path -LiteralPath '.env')) {
    $secret = [Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
    "POSTGRES_PASSWORD=$secret" | Set-Content -LiteralPath '.env'
    Write-Output 'Created local .env with a random database password.'
} else { Write-Output 'Preserved existing .env.' }
