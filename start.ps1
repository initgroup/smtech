param(
    [ValidateRange(0, 65535)][int]$Port = 0,
    [switch]$NoBuild,
    [switch]$Check
)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'tools/project-common.ps1')
Push-Location -LiteralPath $PSScriptRoot
try {
    $config = Get-ProjectConfig -Root $PSScriptRoot
    if ($Port -eq 0) { $Port = [int]$config.defaultPort }
    if ($Port -lt 1 -or $Port -gt 65535) { throw 'Port must be between 1 and 65535.' }
    $python = Resolve-ProjectPython -Root $PSScriptRoot -Config $config
    $server = Resolve-ProjectFile -Root $PSScriptRoot -RelativePath $config.server
    $serveRoot = Resolve-ProjectFile -Root $PSScriptRoot -RelativePath $config.serveRoot
    if (-not $NoBuild) {
        $node = Resolve-ProjectNode -Config $config
        $build = Resolve-ProjectFile -Root $PSScriptRoot -RelativePath $config.build
    }
    Write-Host "Preview: http://127.0.0.1:$Port$($config.servePath)"
    Write-Host "Python: $python"
    if ($Check) { Write-Host 'Preflight passed. No build, server or Git changes were performed.'; return }
    if (-not $NoBuild) { Invoke-ProjectCommand -Executable $node -Arguments @($build) -Failure 'Preview build failed' }
    Invoke-ProjectCommand -Executable $python -Arguments @('-u', $server, '--port', "$Port") -Failure 'Preview server stopped with an error'
} finally { Pop-Location }
