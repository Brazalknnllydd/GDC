$ErrorActionPreference = "Stop"

function Require-Command {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $Name"
  }
}

function Run-Step {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Label,
    [Parameter(Mandatory = $true)]
    [scriptblock]$Action
  )

  Write-Host ""
  Write-Host "==> $Label" -ForegroundColor Cyan
  & $Action
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$mobileDir = Join-Path $repoRoot "mobile"
$backendDir = Join-Path $repoRoot "backend"

Require-Command node
Require-Command npm

$nodeVersion = [Version]((node -v).TrimStart("v"))
$minimumNodeVersion = [Version]"22.12.0"

if ($nodeVersion -lt $minimumNodeVersion) {
  throw "Node.js 22.12.0 or newer is required. Current version: $nodeVersion"
}

if (-not (Test-Path $mobileDir)) {
  throw "Missing mobile directory: $mobileDir"
}

if (-not (Test-Path $backendDir)) {
  throw "Missing backend directory: $backendDir"
}

Run-Step "Installing mobile dependencies with npm" {
  Push-Location $mobileDir
  try {
    npm install
  }
  finally {
    Pop-Location
  }
}

Run-Step "Installing backend dependencies with npm" {
  Push-Location $backendDir
  try {
    npm install
    npx prisma generate
  }
  finally {
    Pop-Location
  }
}

Write-Host ""
Write-Host "Dependencies installed." -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Create or update backend/.env with DATABASE_URL, JWT_SECRET, and PORT."
Write-Host "2. Make sure PostgreSQL is installed and the database in DATABASE_URL exists."
Write-Host "3. Start the backend:  cd backend; npm run dev"
Write-Host "4. Start the mobile app: cd mobile; npx expo start"
Write-Host ""
Write-Host "If npm is misconfigured on a specific machine, use pnpm via Corepack as a fallback." -ForegroundColor DarkYellow
