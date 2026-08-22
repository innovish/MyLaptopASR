$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host '== Local ASR Studio setup ==' -ForegroundColor Cyan
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Install Node.js 20 or newer first: https://nodejs.org/' }
if (-not (Get-Command python -ErrorAction SilentlyContinue)) { throw 'Install Python 3.10-3.13 first and enable Add Python to PATH.' }

if (-not (Test-Path '.venv')) { python -m venv .venv }
& .\.venv\Scripts\python.exe -m pip install --upgrade pip
& .\.venv\Scripts\python.exe -m pip install torch --index-url https://download.pytorch.org/whl/cpu
& .\.venv\Scripts\python.exe -m pip install -r worker\requirements.txt
npm install
if ($LASTEXITCODE -ne 0) { throw 'npm install failed. Check network access and run the installer again.' }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'Build failed. Review the error above.' }
Write-Host ''
Write-Host 'Setup complete. FunASR models will download on first transcription.' -ForegroundColor Green
Write-Host 'Start: .\.venv\Scripts\Activate.ps1; npm start' -ForegroundColor Green
