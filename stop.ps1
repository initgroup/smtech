param([ValidateRange(0, 65535)][int]$Port = 0)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'tools/project-common.ps1')
$config = Get-ProjectConfig -Root $PSScriptRoot
if ($Port -eq 0) { $Port = [int]$config.defaultPort }
$statePath = Join-Path $PSScriptRoot ('tmp/rms-preview-' + $Port + '.json')
if (-not (Test-Path -LiteralPath $statePath -PathType Leaf)) {
    Write-Host "No managed RMS preview from this checkout is running on port $Port."
    return
}
$state = Get-Content -LiteralPath $statePath -Raw -Encoding UTF8 | ConvertFrom-Json
$rootPath = [IO.Path]::GetFullPath($PSScriptRoot).TrimEnd('\', '/')
if ([IO.Path]::GetFullPath([string]$state.root).TrimEnd('\', '/') -ne $rootPath -or
    [int]$state.port -ne $Port -or [string]$state.token -notmatch '^[a-f0-9]{64}$') {
    throw 'Preview state does not belong to this project and port.'
}
# Loopback + a per-start secret outside the web root. No administrator/WMI access.
$uri = 'http://127.0.0.1:' + $Port + '/__rms_preview__/stop'
Invoke-WebRequest -UseBasicParsing -Uri $uri -Method Post -Headers @{'X-RMS-Preview-Token' = [string]$state.token} -TimeoutSec 5 | Out-Null
for ($attempt = 0; $attempt -lt 50 -and (Test-Path -LiteralPath $statePath); $attempt++) {
    Start-Sleep -Milliseconds 100
}
if (Test-Path -LiteralPath $statePath) { throw 'The preview did not confirm shutdown. No unrelated process was terminated.' }
Write-Host "Stopped RMS preview on port $Port."
