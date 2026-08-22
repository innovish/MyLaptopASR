import { StrictMode, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

type Segment = { start: number; end: number; text: string }
type Result = { name: string; mp3Url: string; segments: Segment[]; text: string; error?: string }

const formatTime = (seconds: number) => {
  const whole = Math.max(0, Math.round(seconds))
  const mins = Math.floor(whole / 60).toString().padStart(2, '0')
  const secs = (whole % 60).toString().padStart(2, '0')
  return `${mins}:${secs}`
}

function App() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('等待音频')
  const [copied, setCopied] = useState(false)

  const addFiles = (picked: FileList | null) => {
    if (!picked) return
    const wavs = Array.from(picked).filter(file => file.name.toLowerCase().endsWith('.wav'))
    setFiles(current => [...current, ...wavs.filter(file => !current.some(item => item.name === file.name && item.size === file.size))])
    setResults([])
  }

  const processFiles = async () => {
    if (!files.length || busy) return
    setBusy(true)
    setResults([])
    setStatus(`正在依次处理 ${files.length} 个文件...`)
    const form = new FormData()
    files.forEach(file => form.append('files', file))
    try {
      const response = await fetch('/api/process', { method: 'POST', body: form })
      const payload = await response.json() as { results?: Result[]; error?: string }
      if (!response.ok) throw new Error(payload.error ?? '处理失败')
      setResults(payload.results ?? [])
      setStatus('处理完成')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '处理失败')
    } finally {
      setBusy(false)
    }
  }

  const allText = results.filter(item => !item.error).map(item => `【${item.name}】\n${item.segments.map(segment => `[${formatTime(segment.start)} - ${formatTime(segment.end)}] ${segment.text}`).join('\n')}`).join('\n\n')

  return <main className="shell">
    <header className="topbar"><div className="mark">ASR<span>·</span>LOCAL</div><div className="status"><i />本机运行 · FunASR</div></header>
    <section className="intro"><p className="kicker">PRIVATE TRANSCRIPTION DESK</p><h1>把声音，留在<br /><em>自己的电脑里。</em></h1><p className="lede">批量转码 WAV → MP3，并用本地 FunASR 生成可检索、带时间戳的文字。</p></section>
    <section className="workspace">
      <div className="upload-panel" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); addFiles(event.dataTransfer.files) }}>
        <div className="upload-icon">↥</div><h2>拖入 WAV 文件</h2><p>支持一次选择多个文件，按顺序逐个处理</p>
        <button className="outline-button" onClick={() => inputRef.current?.click()}>选择文件</button>
        <input ref={inputRef} hidden type="file" accept=".wav,audio/wav" multiple onChange={event => addFiles(event.target.files)} />
      </div>
      <div className="queue-panel"><div className="panel-heading"><h2>处理队列 <span>{files.length}</span></h2><button className="text-button" onClick={() => { setFiles([]); setResults([]); setStatus('等待音频') }} disabled={busy || !files.length}>清空</button></div>
        {!files.length ? <div className="empty">队列是空的<br /><small>你的音频不会离开这台电脑</small></div> : <div className="file-list">{files.map((file, index) => <div className="file-row" key={`${file.name}-${file.size}`}><b>{String(index + 1).padStart(2, '0')}</b><span>{file.name}</span><small>{(file.size / 1024 / 1024).toFixed(1)} MB</small></div>)}</div>}
        <div className="run-area"><div className="status-copy">{status}</div><button className="primary-button" disabled={!files.length || busy} onClick={processFiles}>{busy ? '处理中...' : '开始转换与识别'} <span>→</span></button></div>
      </div>
    </section>
    {results.length > 0 && <section className="results"><div className="results-heading"><div><p className="kicker">TRANSCRIPT OUTPUT</p><h2>识别结果</h2></div><button className="outline-button compact" onClick={() => { navigator.clipboard.writeText(allText); setCopied(true); setTimeout(() => setCopied(false), 1600) }}>{copied ? '已复制' : '复制全部'}</button></div>
      {results.map(result => <article className="result-card" key={result.name}><div className="result-meta"><strong>{result.name}</strong>{result.error ? <span className="error">{result.error}</span> : <a href={result.mp3Url} download>下载 MP3 ↓</a>}</div>{result.error ? null : <div className="transcript">{result.segments.map((segment, index) => <div className="segment" key={`${segment.start}-${index}`}><time>{formatTime(segment.start)}</time><p>{segment.text}</p></div>)}</div>}</article>)}
      <button className="download-all" onClick={() => { const blob = new Blob([allText], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'transcripts.txt'; link.click(); URL.revokeObjectURL(url) }}>下载全部文字 ↓</button>
    </section>}
    <footer>LOCAL ASR STUDIO <span>·</span> 文件只在本机处理</footer>
  </main>
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
