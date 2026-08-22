$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host '== Local ASR Studio setup ==' -ForegroundColor Cyan
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw '需要先安装 Node.js 20 或更高版本: https://nodejs.org/' }
if (-not (Get-Command python -ErrorAction SilentlyContinue)) { throw '需要先安装 Python 3.10-3.13，并勾选 Add Python to PATH' }

if (-not (Test-Path '.venv')) { python -m venv .venv }
& .\.venv\Scripts\python.exe -m pip install --upgrade pip
& .\.venv\Scripts\python.exe -m pip install torch --index-url https://download.pytorch.org/whl/cpu
& .\.venv\Scripts\python.exe -m pip install -r worker\requirements.txt
npm install
npm run build
Write-Host ''
Write-Host '安装完成。首次识别会自动下载 FunASR 模型。' -ForegroundColor Green
Write-Host '启动: .\.venv\Scripts\Activate.ps1; npm start' -ForegroundColor Green
