$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$password = ((Get-Content -LiteralPath '.env') | Where-Object { $_ -like 'POSTGRES_PASSWORD=*' }) -replace '^POSTGRES_PASSWORD=', ''
$env:ConnectionStrings__Workspace = "Host=127.0.0.1;Port=54334;Database=daymark;Username=daymark;Password=$password"
$env:Database__Migrate = 'true'
$env:ASPNETCORE_ENVIRONMENT = 'Development'
dotnet run --project backend/Daymark.Api -c Release --no-launch-profile --urls http://127.0.0.1:5084
