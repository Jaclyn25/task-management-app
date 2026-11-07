$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
New-Item -ItemType Directory -Path '.local' -Force | Out-Null
$raw = dotnet list package --vulnerable --include-transitive --format json
if ($LASTEXITCODE -ne 0) { throw 'Dependency audit failed to execute.' }
$raw | Set-Content -LiteralPath '.local/backend-audit.json'
$report = $raw | ConvertFrom-Json
$findings = @($report.projects | ForEach-Object { $_.frameworks } | ForEach-Object { @($_.topLevelPackages) + @($_.transitivePackages) } | Where-Object { $_.vulnerabilities })
if ($findings.Count -gt 0) { throw "Dependency audit found $($findings.Count) vulnerable packages. See .local/backend-audit.json." }
Write-Output 'Backend dependency audit: no vulnerable packages reported.'
