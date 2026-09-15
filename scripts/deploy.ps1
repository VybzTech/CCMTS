<#
.SYNOPSIS
    Deploys CCMTS on the Windows Server host.

.DESCRIPTION
    Switching the branch on the server is NOT a deployment on its own.
    Three things the app actually serves are deliberately gitignored or
    generated, so they never arrive with a `git checkout`:

      * Client/dist   - what `vite preview` serves on :4173. Gitignored,
                        so the UI does not change until it is rebuilt.
      * node_modules  - gitignored.
      * Server/.env   - gitignored, so no config travels with a branch.

    ...and nothing restarts the running processes. This script closes
    that gap: fetch, install, migrate, build, reload, verify.

    Safe to re-run. Every step is idempotent.

.PARAMETER Branch
    Branch to deploy. Defaults to 'production'.

.PARAMETER SkipMigrate
    Skip `prisma migrate deploy`. Use only when you know the release
    carries no schema change.

.EXAMPLE
    .\deploy.ps1
    .\deploy.ps1 -Branch main          # deploy the staging/dev branch
#>
[CmdletBinding()]
param(
    [string]$Branch = 'production',
    [switch]$SkipMigrate
)

$ErrorActionPreference = 'Stop'

# Repo root is this script's parent, so the script works regardless of
# where it is invoked from (a scheduled task runs from C:\Windows\System32).
$RepoRoot = Split-Path -Parent $PSScriptRoot
$ClientDir = Join-Path $RepoRoot 'Client'
$ServerDir = Join-Path $RepoRoot 'Server'
$HealthUrl = 'http://127.0.0.1:9989/health'

function Write-Step([string]$Message) {
    Write-Host ''
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Assert-LastExitCode([string]$What) {
    if ($LASTEXITCODE -ne 0) { throw "$What failed with exit code $LASTEXITCODE" }
}

Write-Host "CCMTS deploy - branch '$Branch' - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host "Repo: $RepoRoot"

# ---------------------------------------------------------------------
# 0. Preflight. Fail before touching anything if the box isn't ready.
# ---------------------------------------------------------------------
Write-Step 'Preflight checks'

foreach ($tool in @('git', 'node', 'npm', 'pm2')) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        throw "'$tool' is not on PATH. Install it or fix PATH before deploying."
    }
}

# .env is gitignored by design - it must already exist on the host. A
# missing one means the API boots, fails its own required-env check in
# app.js, and exits, which looks like a deploy that "did nothing".
$envFile = Join-Path $ServerDir '.env'
if (-not (Test-Path $envFile)) {
    throw "Server/.env not found at $envFile. Config does not travel with the branch - create it on the host first."
}

if ($Branch -eq 'production') {
    $nodeEnv = Select-String -Path $envFile -Pattern '^\s*NODE_ENV\s*=\s*production' -Quiet
    if (-not $nodeEnv) {
        Write-Warning "Server/.env does not set NODE_ENV=production. Error responses may leak stack traces and the login cookie's Secure flag stays off."
    }
}

Push-Location $RepoRoot
try {
    # -----------------------------------------------------------------
    # 1. Source. Refuse to clobber uncommitted work on the server.
    # -----------------------------------------------------------------
    Write-Step "Fetching and checking out '$Branch'"

    $dirty = git status --porcelain
    if ($dirty) {
        Write-Host $dirty
        throw "The working tree on this host has uncommitted changes (above). Commit, stash or discard them, then re-run."
    }

    git fetch --prune origin
    Assert-LastExitCode 'git fetch'

    git checkout $Branch
    Assert-LastExitCode "git checkout $Branch"

    git reset --hard "origin/$Branch"
    Assert-LastExitCode 'git reset'

    $deployedSha = (git rev-parse --short HEAD).Trim()
    Write-Host "Now at $deployedSha on $Branch"

    # -----------------------------------------------------------------
    # 2. Dependencies. `npm ci`, not `install` - it honours the lockfile
    #    exactly and wipes node_modules, so a half-updated tree can't
    #    survive into the release.
    # -----------------------------------------------------------------
    Write-Step 'Installing server dependencies'
    Push-Location $ServerDir
    npm ci
    Assert-LastExitCode 'npm ci (Server)'
    Pop-Location

    Write-Step 'Installing client dependencies'
    Push-Location $ClientDir
    npm ci
    Assert-LastExitCode 'npm ci (Client)'
    Pop-Location

    # -----------------------------------------------------------------
    # 3. Schema. `migrate deploy` applies committed migrations only - it
    #    never generates or resets, which is what makes it the safe one
    #    to run unattended against live data.
    # -----------------------------------------------------------------
    if ($SkipMigrate) {
        Write-Step 'Skipping migrations (-SkipMigrate)'
    }
    else {
        Write-Step 'Applying database migrations'
        Push-Location $ServerDir
        npx prisma migrate deploy
        Assert-LastExitCode 'prisma migrate deploy'
        npx prisma generate
        Assert-LastExitCode 'prisma generate'
        Pop-Location
    }

    # -----------------------------------------------------------------
    # 4. Build the client. THIS is the step a branch switch skips, and
    #    the reason "I changed the branch but the UI is the same".
    # -----------------------------------------------------------------
    Write-Step 'Building client'
    Push-Location $ClientDir
    npm run build
    Assert-LastExitCode 'client build'
    Pop-Location

    $distIndex = Join-Path $ClientDir 'dist\index.html'
    if (-not (Test-Path $distIndex)) {
        throw "Client build reported success but $distIndex is missing."
    }

    # -----------------------------------------------------------------
    # 5. Restart. `reload` over `restart` so the API is replaced without
    #    a window where nothing is listening.
    # -----------------------------------------------------------------
    Write-Step 'Reloading PM2 processes'
    pm2 reload (Join-Path $RepoRoot 'ecosystem.config.js') --update-env
    Assert-LastExitCode 'pm2 reload'
    pm2 save | Out-Null

    # -----------------------------------------------------------------
    # 6. Verify. A deploy that finishes without checking is a guess.
    #    /health gates on the database only (Redis is reported but not
    #    load-bearing), so a 200 here means the API is genuinely serving.
    # -----------------------------------------------------------------
    Write-Step 'Verifying /health'
    $ok = $false
    foreach ($attempt in 1..10) {
        Start-Sleep -Seconds 3
        try {
            $response = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Host "  health OK: $($response.Content)" -ForegroundColor Green
                $ok = $true
                break
            }
        }
        catch {
            Write-Host "  attempt $attempt/10 - not ready yet"
        }
    }

    if (-not $ok) {
        pm2 logs --lines 40 --nostream
        throw "Deployed, but $HealthUrl never returned 200. PM2 logs above; the previous release is NOT automatically restored."
    }

    Write-Host ''
    Write-Host "Deploy complete - $Branch @ $deployedSha" -ForegroundColor Green
}
finally {
    Pop-Location
}
