$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$password = ((Get-Content -LiteralPath '.env') | Where-Object { $_ -like 'POSTGRES_PASSWORD=*' }) -replace '^POSTGRES_PASSWORD=', ''
$env:DAYMARK_TEST_CONNECTION = "Host=127.0.0.1;Port=54334;Database=daymark_test;Username=daymark;Password=$password"
dotnet test -c Release --logger 'trx;LogFileName=backend.trx' --results-directory TestResults
exit $LASTEXITCODE
