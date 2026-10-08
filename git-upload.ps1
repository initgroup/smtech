param(
    [string]$Message,
    [string]$RemoteUrl,
    [ValidatePattern('^[A-Za-z0-9][A-Za-z0-9._-]*$')][string]$Remote = 'origin',
    [switch]$Push,
    [switch]$Check,
    [switch]$PrepareOnly
)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'tools/project-common.ps1')
Push-Location -LiteralPath $PSScriptRoot
$releaseLock = $null
try {
    if ($Check -and $PrepareOnly) { throw 'Choose either -Check or -PrepareOnly.' }
    if (($Check -or $PrepareOnly) -and $Push) { throw '-Push cannot be combined with -Check or -PrepareOnly.' }
    if (-not (Get-Command git -CommandType Application -ErrorAction SilentlyContinue)) { throw 'Install Git first.' }
    $config = Get-ProjectConfig -Root $PSScriptRoot
    $python = Resolve-ProjectPython -Root $PSScriptRoot -Config $config
    $node = Resolve-ProjectNode -Config $config
    $build = Resolve-ProjectFile -Root $PSScriptRoot -RelativePath $config.build
    $packager = Resolve-ProjectFile -Root $PSScriptRoot -RelativePath $config.packager
    $guard = Resolve-ProjectFile -Root $PSScriptRoot -RelativePath 'tools/git_guard.py'
    function Invoke-Git {
        param([string[]]$GitArgs)
        Invoke-ProjectCommand -Executable 'git' -Arguments $GitArgs -Failure "Git failed: $($GitArgs[0])"
    }
    Invoke-ProjectCommand -Executable $python -Arguments @($guard) -Failure 'Git preflight failed'
    $remotes = @(& git remote)
    if ($LASTEXITCODE -ne 0) { throw 'Cannot read Git remotes.' }
    $remoteExists = $remotes -contains $Remote
    if ($remoteExists -and $RemoteUrl) {
        $existing = & git remote get-url $Remote
        if ($LASTEXITCODE -ne 0) { throw 'Cannot read remote URL.' }
        if ($existing -ne $RemoteUrl) { throw "Remote '$Remote' already has a different URL. Change it explicitly with git remote set-url." }
    }
    if ($Push -and -not $remoteExists -and -not $RemoteUrl) { throw "No remote '$Remote'. Supply -RemoteUrl or configure it with git remote add." }
    if ($Check) { Write-Host 'Preflight passed. No build, staging, commit, remote changes or push performed.'; return }

    # Prevent concurrent release writers in this checkout. Lock files are ignored.
    $lockDirectory = Join-Path $PSScriptRoot 'tmp'
    [void][IO.Directory]::CreateDirectory($lockDirectory)
    $releaseLock = [IO.File]::Open((Join-Path $lockDirectory 'git-upload.lock'), [IO.FileMode]::OpenOrCreate, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
    Invoke-ProjectCommand -Executable $node -Arguments @($build) -Failure 'Business/demo build failed'
    Invoke-ProjectCommand -Executable $python -Arguments @($packager) -Failure 'Developer release preparation failed'
    if ($PrepareOnly) { Write-Host 'Release prepared. Git index, commits and remotes were left unchanged.'; return }

    # Honor every current ignore rule, including files tracked before the rule existed.
    Invoke-ProjectCommand -Executable $python -Arguments @($guard, '--prune-index') -Failure 'Cannot remove ignored files from index'
    # Attribute changes do not invalidate Git's cached stat information for existing files.
    # Reapply current clean/text rules before collecting new files; -text -eol assets retain their exact bytes.
    Invoke-Git -GitArgs @('add', '--renormalize', '--', '.')
    Invoke-Git -GitArgs @('add', '--all', '--', '.')
    # Read staged bytes without rebuilding the ZIP or modifying staged contents.
    Invoke-ProjectCommand -Executable $python -Arguments @($packager, '--verify-index') -Failure 'Staged release verification failed; commit stopped'
    & git diff --cached --quiet
    $diffExit = $LASTEXITCODE
    if ($diffExit -eq 1) {
        if ([string]::IsNullOrWhiteSpace($Message)) {
            $projectName = Split-Path -Leaf $PSScriptRoot
            $dateStamp = Get-Date -Format 'yyyyMMdd'
            $messagePrefix = "$projectName-$dateStamp-"
            $pattern = '^' + [regex]::Escape($messagePrefix) + '(\d+)$'
            [long]$highest = 0
            $refs = @(& git for-each-ref --format='%(refname)')
            if ($LASTEXITCODE -ne 0) { throw 'Cannot read Git refs.' }
            if ($refs.Count -gt 0) {
                $subjects = @(& git log --all --format=%s)
                if ($LASTEXITCODE -ne 0) { throw 'Cannot read commit history.' }
                foreach ($subject in $subjects) {
                    if ($subject -match $pattern) {
                        [long]$sequence = 0
                        if (-not [long]::TryParse($Matches[1], [ref]$sequence)) { throw 'Commit sequence is too large.' }
                        if ($sequence -gt $highest) { $highest = $sequence }
                    }
                }
            }
            if ($highest -eq [long]::MaxValue) { throw 'Commit sequence is exhausted.' }
            $Message = $messagePrefix + ($highest + 1).ToString('D3')
        }
        Write-Host "Commit message: $Message"
        Invoke-Git -GitArgs @('commit', '-m', $Message)
    } elseif ($diffExit -eq 0) { Write-Host 'No changes to commit.' }
    else { throw 'Cannot inspect staged changes.' }
    Invoke-ProjectCommand -Executable $python -Arguments @($packager, '--verify-ref', 'HEAD') -Failure 'Committed release verification failed; push stopped'
    if ($Push) {
        if (-not $remoteExists) { Invoke-Git -GitArgs @('remote', 'add', $Remote, $RemoteUrl) }
        $branch = & git symbolic-ref --quiet --short HEAD
        if ($LASTEXITCODE -ne 0) { throw 'Check out a branch before pushing.' }
        Invoke-Git -GitArgs @('push', '--set-upstream', $Remote, $branch)
    } else { Write-Host 'Local commit complete. Add -Push to upload to the configured remote.' }
} finally {
    if ($releaseLock) { $releaseLock.Dispose() }
    Pop-Location
}
