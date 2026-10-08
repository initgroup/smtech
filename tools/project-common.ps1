# Shared by start.ps1 and git-upload.ps1. PowerShell 5.1+; no machine settings are changed.
Set-StrictMode -Version Latest
function Get-ProjectConfig {
    param([string]$Root)
    $file = Join-Path $Root 'tools/project-config.json'
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { throw "Missing project configuration: $file" }
    $config = Get-Content -LiteralPath $file -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($config.formatVersion -ne 1) { throw 'Unsupported project configuration version.' }
    return $config
}
function Resolve-ProjectFile {
    param([string]$Root, [string]$RelativePath)
    if ([IO.Path]::IsPathRooted($RelativePath)) { throw "Expected project-relative path: $RelativePath" }
    $resolved = [IO.Path]::GetFullPath((Join-Path $Root $RelativePath))
    $prefix = [IO.Path]::GetFullPath($Root).TrimEnd('\', '/') + [IO.Path]::DirectorySeparatorChar
    if (-not $resolved.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) { throw "Path escapes project root: $RelativePath" }
    if (-not (Test-Path -LiteralPath $resolved)) { throw "Required path does not exist: $resolved" }
    return $resolved
}
function Resolve-ProjectPython {
    param([string]$Root, $Config)
    foreach ($candidate in $Config.pythonCandidates) {
        $command = $null
        if ($candidate.Contains('/') -or $candidate.Contains('\')) {
            $local = if ([IO.Path]::IsPathRooted($candidate)) { $candidate } else { Join-Path $Root $candidate }
            if (Test-Path -LiteralPath $local -PathType Leaf) { $command = $local }
        } else {
            $found = Get-Command $candidate -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($found) { $command = $found.Source }
        }
        if ($command) {
            try {
                $result = & $command -c "import sys; print('%s.%s' % sys.version_info[:2]); sys.exit(0 if sys.version_info >= (3, $($Config.minimumPythonMinor)) else 1)" 2>$null
                if ($LASTEXITCODE -eq 0) { return $command }
            } catch { continue }
        }
    }
    throw "Python 3.$($Config.minimumPythonMinor)+ was not found. Create .venv or install Python on PATH."
}
function Resolve-ProjectNode {
    param($Config)
    $found = Get-Command $Config.node -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $found) { throw 'Node.js was not found on PATH.' }
    $version = & $found.Source -p 'parseInt(process.versions.node)'
    if ($LASTEXITCODE -ne 0 -or [int]$version -lt $Config.minimumNodeMajor) { throw "Node.js $($Config.minimumNodeMajor)+ is required." }
    return $found.Source
}
function Invoke-ProjectCommand {
    param([string]$Executable, [string[]]$Arguments, [string]$Failure)
    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Failure (exit $LASTEXITCODE)" }
}
