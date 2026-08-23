# Local ASR Studio

基于 TypeScript + React + FunASR 的本地 WAV 批量转写工具。音频在本机完成 WAV -> MP3 和语音识别，结果包含时间戳，可复制或下载。

## 一键安装（Windows PowerShell）

需要先安装 Node.js 20+ 和 Python 3.10-3.13。然后在 PowerShell 执行：

```powershell
git clone https://github.com/YOUR_NAME/funasr-local-studio.git
cd funasr-local-studio
Set-ExecutionPolicy -Scope Process Bypass
.\install.ps1
.\.venv\Scripts\Activate.ps1
npm start
```

打开 http://localhost:4317。首次识别会从 ModelScope/Hugging Face 下载模型，之后可离线使用缓存模型。安装脚本会安装匹配的 CPU 版 PyTorch/torchaudio，并从官方 npm registry 下载依赖。

## 配置

```powershell
$env:FUNASR_MODEL = 'paraformer-zh'
$env:FUNASR_DEVICE = 'cpu' # 有 CUDA 环境时可改为 cuda
$env:PYTHON = "$PWD\.venv\Scripts\python.exe"
npm start
```

可用 `npm run dev` 同时启动 Vite 前端和 API 服务。上传限制为 50 个文件、单个 500 MB。

## 推送 GitHub

```powershell
git init
git add .
git commit -m "Build local FunASR transcription app"
git branch -M main
git remote add origin https://github.com/YOUR_NAME/funasr-local-studio.git
git push -u origin main
```

不要把模型文件、`.venv`、`.work` 或 `node_modules` 提交到仓库。
