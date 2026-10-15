param(
    [ValidateRange(0, 65535)][int]$Port = 0,
    [switch]$NoBuild
)
$ErrorActionPreference = 'Stop'
& (Join-Path $PSScriptRoot 'stop.ps1') -Port $Port
& (Join-Path $PSScriptRoot 'start.ps1') -Port $Port -NoBuild:$NoBuild
