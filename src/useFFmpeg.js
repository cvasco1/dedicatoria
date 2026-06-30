// useFFmpeg.js
// Loads FFmpeg.wasm once, converts ANY video format → mp4 in-browser.
// No server needed. Conversion runs locally on the user's CPU via WebAssembly.

import { useState, useRef, useCallback } from 'react'

let ffmpegInstance = null
let loadPromise    = null

async function getFFmpeg() {
  if (ffmpegInstance) return ffmpegInstance

  // Lazy-load to avoid bloating the initial bundle
  const { FFmpeg }     = await import('@ffmpeg/ffmpeg')
  const { toBlobURL }  = await import('@ffmpeg/util')

  if (loadPromise) return loadPromise

  const ff = new FFmpeg()
  loadPromise = (async () => {
    // Load core + wasm from CDN (these are ~30MB, cached after first load)
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
    await ff.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`,   'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    })
    ffmpegInstance = ff
    return ff
  })()

  return loadPromise
}

// ── Hook ────────────────────────────────────────────────────────────────────
export function useFFmpeg() {
  const [converting, setConverting] = useState(false)
  const [progress,   setProgress]   = useState(0)   // 0-100
  const [stage,      setStage]      = useState('')   // e.g. "Cargando FFmpeg…"
  const abortRef = useRef(false)

  /**
   * Convert any video file → mp4 Blob.
   * Returns { blob, mimeType } or throws on error.
   */
  const convert = useCallback(async (file) => {
    abortRef.current = false
    setConverting(true)
    setProgress(0)
    setStage('Cargando FFmpeg…')

    try {
      const ff = await getFFmpeg()

      // Wire up progress
      ff.on('progress', ({ progress: p }) => {
        setProgress(Math.round(p * 100))
      })

      setStage('Leyendo archivo…')
      const { fetchFile } = await import('@ffmpeg/util')
      const inputName  = `input_${Date.now()}.${file.name.split('.').pop()}`
      const outputName = `output_${Date.now()}.mp4`

      await ff.writeFile(inputName, await fetchFile(file))

      setStage('Convirtiendo a mp4…')

      // -c:v libx264 -preset fast -crf 23 -c:a aac -movflags +faststart
      // Works for: mov, hevc, heic (video), avi, mkv, webm, wmv, 3gp, flv
      await ff.exec([
        '-i',       inputName,
        '-c:v',     'libx264',
        '-preset',  'fast',
        '-crf',     '23',
        '-c:a',     'aac',
        '-b:a',     '128k',
        '-movflags','+faststart',
        '-y',
        outputName,
      ])

      setStage('Finalizando…')
      const data = await ff.readFile(outputName)
      const blob = new Blob([data.buffer], { type: 'video/mp4' })

      // Cleanup temp files
      await ff.deleteFile(inputName).catch(() => {})
      await ff.deleteFile(outputName).catch(() => {})

      ff.off('progress')
      setConverting(false)
      setProgress(100)
      setStage('')

      return { blob, mimeType: 'video/mp4' }
    } catch (err) {
      setConverting(false)
      setStage('')
      setProgress(0)
      throw err
    }
  }, [])

  const cancel = useCallback(() => {
    abortRef.current = true
    setConverting(false)
    setStage('')
    setProgress(0)
  }, [])

  return { convert, converting, progress, stage, cancel }
}
