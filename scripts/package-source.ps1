$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$dirty = git status --porcelain --untracked-files=no
if ($dirty) { throw 'Commit tracked changes before packaging.' }
$commit = (git rev-parse HEAD).Trim()
$short = $commit.Substring(0, 12)
New-Item -ItemType Directory -Path '.local' -Force | Out-Null
$archive = Join-Path (Get-Location) ".local/daymark-source-$short.zip"
git archive --format=zip --prefix=daymark/ --output=$archive HEAD
if ($LASTEXITCODE -ne 0) { throw 'git archive failed.' }
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($archive)
try {
    $forbidden = $zip.Entries | Where-Object { $_.FullName -match '(^|/)(\.env|\.git|node_modules|bin|obj|\.local|TestResults|test-results|playwright-report)(/|$)' }
    if ($forbidden) { throw 'Archive contains an excluded path.' }
} finally { $zip.Dispose() }
$hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $archive).Hash.ToLowerInvariant()
"$hash  $(Split-Path $archive -Leaf)" | Set-Content -LiteralPath "$archive.sha256" -Encoding ascii
@{ commit = $commit; archive = $archive; sha256 = $hash; generatedAt = [DateTimeOffset]::UtcNow.ToString('o') } | ConvertTo-Json | Set-Content -LiteralPath '.local/package-manifest.json'
Write-Output "Source archive: $archive"
Write-Output "Commit: $commit"
Write-Output "SHA-256: $hash"
