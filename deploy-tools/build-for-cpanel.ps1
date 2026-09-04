$ErrorActionPreference = "Stop"

Write-Host "`n[1/5] Checking prerequisites..." -ForegroundColor Cyan
if (-not (Test-Path "package.json")) { throw "Run this from the project root." }
if (-not (Test-Path ".env.local")) { throw ".env.local not found. NEXT_PUBLIC_ values are baked in at build time." }

$envText = Get-Content ".env.local" -Raw
foreach ($key in @("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY")) {
  if ($envText -notmatch "(?m)^\s*$key\s*=\s*\S+") { throw "$key is empty in .env.local." }
}
Write-Host "      .env.local looks populated." -ForegroundColor Green

$cfg = Get-Content "next.config.ts" -Raw
if ($cfg -notmatch "output:\s*.standalone.") { throw "next.config.ts is missing output: standalone." }
if ($cfg -match "PROJECTREF") { throw "Replace PROJECTREF in next.config.ts with your Supabase subdomain." }
Write-Host "      standalone output enabled." -ForegroundColor Green

Write-Host "`n[2/5] Building..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { throw "Build failed." }

Write-Host "`n[3/5] Assembling..." -ForegroundColor Cyan
$out = "deploy\app"
if (Test-Path "deploy") { Remove-Item -Recurse -Force "deploy" }
New-Item -ItemType Directory -Path $out -Force | Out-Null

Copy-Item -Recurse ".next\standalone\*" $out
New-Item -ItemType Directory -Path "$out\.next\static" -Force | Out-Null
Copy-Item -Recurse ".next\static\*" "$out\.next\static"
if (Test-Path "public") {
  New-Item -ItemType Directory -Path "$out\public" -Force | Out-Null
  Copy-Item -Recurse "public\*" "$out\public"
}
Copy-Item ".env.local" "$out\.env" -Force

Write-Host "`n[4/5] Zipping..." -ForegroundColor Cyan
Compress-Archive -Path "$out\*" -DestinationPath "deploy\sibiahstar-deploy.zip" -Force
$size = "{0:N1} MB" -f ((Get-Item "deploy\sibiahstar-deploy.zip").Length / 1MB)

Write-Host "`n[5/5] Done: deploy\sibiahstar-deploy.zip ($size)" -ForegroundColor Green