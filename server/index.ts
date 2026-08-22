import express from 'express'
import multer from 'multer'
import ffmpegPath from 'ffmpeg-static'
import { spawn } from 'node:child_process'
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const workDir = path.join(root, '.work')
const upload = multer({ dest: workDir, limits: { files: 50, fileSize: 500 * 1024 * 1024 } })
const app = express()
const port = Number(process.env.PORT ?? 4317)

function convertToMp3(input: string, output: string) {
  return new Promise<void>((resolve, reject) => {
    if (!ffmpegPath) return reject(new Error('找不到 ffmpeg-static'))
    const process = spawn(ffmpegPath, ['-y', '-i', input, '-codec:a', 'libmp3lame', '-q:a', '2', output], { windowsHide: true })
    let error = ''
    process.stderr.on('data', chunk => { error += chunk.toString() })
    process.on('close', code => code === 0 ? resolve() : reject(new Error(error.split('\n').filter(Boolean).pop() ?? 'FFmpeg 转码失败')))
  })
}

function callFunAsr(filePath: string): Promise<{ start: number; end: number; text: string }[]> {
  return new Promise((resolve, reject) => {
    const worker = spawn(process.env.PYTHON ?? 'python', [path.join(root, 'worker', 'transcribe.py'), filePath], { windowsHide: true })
    let stdout = ''
    let stderr = ''
    worker.stdout.on('data', chunk => { stdout += chunk.toString() })
    worker.stderr.on('data', chunk => { stderr += chunk.toString() })
    worker.on('close', code => {
      if (code !== 0) return reject(new Error(stderr.trim() || 'FunASR 识别失败'))
      try { resolve(JSON.parse(stdout).segments ?? []) } catch { reject(new Error('FunASR 返回了无法解析的结果')) }
    })
  })
}

app.post('/api/process', upload.array('files', 50), async (request, response) => {
  const files = (request.files ?? []) as Express.Multer.File[]
  if (!files.length) return response.status(400).json({ error: '请上传 WAV 文件' })
  const results = []
  for (const file of files) {
    const outputName = `${path.parse(file.originalname).name}.mp3`
    const outputPath = path.join(workDir, `${file.filename}.mp3`)
    try {
      await convertToMp3(file.path, outputPath)
      const segments = await callFunAsr(file.path)
      results.push({ name: file.originalname, mp3Url: `/media/${file.filename}.mp3`, segments, text: segments.map(segment => segment.text).join(' '), outputName })
    } catch (error) {
      results.push({ name: file.originalname, mp3Url: '', segments: [], text: '', error: error instanceof Error ? error.message : '处理失败' })
    } finally {
      await rm(file.path, { force: true })
    }
  }
  response.json({ results })
})

app.use('/media', express.static(workDir))
if (process.env.NODE_ENV === 'production') app.use(express.static(path.join(root, 'dist/client')))
app.get(/.*/, (_request, response) => response.sendFile(path.join(root, process.env.NODE_ENV === 'production' ? 'dist/client/index.html' : 'index.html')))

await mkdir(workDir, { recursive: true })
app.listen(port, () => console.log(`Local ASR Studio: http://localhost:${port}`))
