param(
    [string]$Message,
    [string]$RemoteUrl = 'https://github.com/initgroup/smtech.git',
    [switch]$Push
)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

function Invoke-Git {
    param([string[]]$GitArgs)
    & git @GitArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Git command failed: git $($GitArgs -join ' ')"
    }
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw 'Install Git and reopen the terminal first.'
}
if (-not (Test-Path -LiteralPath '.git')) {
    Invoke-Git -GitArgs @('init', '-b', 'main')
}

# Keep every directory named local out of future commits.
$ignoreFile = Join-Path $PSScriptRoot '.gitignore'
$ignoreLines = @(Get-Content -LiteralPath $ignoreFile -ErrorAction SilentlyContinue)
if ($ignoreLines -notcontains 'local/') {
    Add-Content -LiteralPath $ignoreFile -Value "`nlocal/" -Encoding UTF8
}

if ($RemoteUrl) {
    $remotes = @(& git remote)
    if ($LASTEXITCODE -ne 0) { throw 'Cannot read Git remotes.' }
    if ($remotes -contains 'origin') {
        $existingUrl = & git remote get-url origin
        if ($LASTEXITCODE -ne 0) { throw 'Cannot read origin URL.' }
        if ($existingUrl -ne $RemoteUrl) {
            throw "origin already points to $existingUrl. Check it before changing the remote."
        }
    } else {
        Invoke-Git -GitArgs @('remote', 'add', 'origin', $RemoteUrl)
    }
}
if ($Push) {
    & git remote get-url origin
    if ($LASTEXITCODE -ne 0) { throw 'Supply -RemoteUrl for the first push.' }
}

# Remove previously tracked local files from the index, preserving disk files.
Invoke-Git -GitArgs @('rm', '-r', '--cached', '--ignore-unmatch', '--', ':(glob)local/**', ':(glob)**/local/**')
Invoke-Git -GitArgs @('add', '--all')
$trackedLocal = @(& git ls-files -- ':(glob)local/**' ':(glob)**/local/**')
if ($LASTEXITCODE -ne 0) { throw 'Cannot verify excluded files.' }
if ($trackedLocal.Count -gt 0) { throw 'local files are still tracked. Aborting.' }

& git diff --cached --quiet
$diffExit = $LASTEXITCODE
if ($diffExit -eq 1) {
    if ([string]::IsNullOrWhiteSpace($Message)) {
        $projectName = Split-Path -Leaf $PSScriptRoot
        $dateStamp = Get-Date -Format 'yyyyMMdd'
        $messagePrefix = "$projectName-$dateStamp-"
        $pattern = '^' + [regex]::Escape($messagePrefix) + '(\d+)$'
        # --all includes locally available branches and remote-tracking refs.
        # An empty repository has no refs, so skip git log until one exists.
        $refs = @(& git for-each-ref --format='%(refname)')
        if ($LASTEXITCODE -ne 0) { throw 'Cannot read Git refs.' }
        [long]$highest = 0
        if ($refs.Count -gt 0) {
            $subjects = @(& git log --all --format=%s)
            if ($LASTEXITCODE -ne 0) { throw 'Cannot read commit messages.' }
            foreach ($subject in $subjects) {
                if ($subject -match $pattern) {
                    [long]$sequence = 0
                    if (-not [long]::TryParse($Matches[1], [ref]$sequence)) {
                        throw 'Commit sequence is too large.'
                    }
                    if ($sequence -gt $highest) { $highest = $sequence }
                }
            }
        }
        if ($highest -eq [long]::MaxValue) { throw 'Commit sequence is exhausted.' }
        $Message = $messagePrefix + ($highest + 1).ToString('D3')
        Write-Host "Commit message: $Message"
    }
    Invoke-Git -GitArgs @('commit', '-m', $Message)
} elseif ($diffExit -eq 0) {
    Write-Host 'No changes to commit.'
} else {
    throw 'Cannot inspect staged changes.'
}

if ($Push) {
    $branch = & git symbolic-ref --quiet --short HEAD
    if ($LASTEXITCODE -ne 0) { throw 'Check out a branch before pushing.' }
    Invoke-Git -GitArgs @('push', '--set-upstream', 'origin', $branch)
} else {
    Write-Host 'Local commit complete. Add -Push to upload to origin.'
}
