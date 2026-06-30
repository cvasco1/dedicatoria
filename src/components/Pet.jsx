import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, ChevronLeft, ChevronRight, Heart, Star, Plus, Upload, Link,
  Trash2, Play, Film, Zap, CheckCircle
} from 'lucide-react'
import heic2any from 'heic2any'
import { config } from '../config'
import { usePersistedPhotos, usePersistedVideos } from '../useMediaStore'
import { useFFmpeg } from '../useFFmpeg'

const ROTS      = ['-2deg','1.5deg','-1deg','2deg','-1.5deg','1deg','-2.5deg','0.8deg']
const SCATTERED = ['-3deg','2.5deg','-1.5deg','3deg','-2deg','1.5deg','-2.5deg','2deg']
const NATIVE_TYPES = ['video/mp4','video/webm','video/ogg']
const ACCEPT_VIDEO = 'video/*,.mov,.mp4,.m4v,.webm,.avi,.mkv,.hevc,.heic,.3gp,.flv,.wmv,.mts,.m2ts'

function slug(str) {
  return (str || 'mascota').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'mascota'
}

function isHeic(file) {
  return file.type === 'image/heic' || file.type === 'image/heif' || /\.(heic|heif)$/i.test(file.name)
}

async function convertHeicToJpeg(file) {
  const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 })
  const converted = Array.isArray(blob) ? blob[0] : blob
  return new File([converted], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' })
}

function isNativeVideo(file) {
  return NATIVE_TYPES.includes(file.type) || /\.(mp4|webm|ogg)$/i.test(file.name)
}

function toEmbedUrl(url) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return yt ? `https://www.youtube.com/embed/${yt[1]}` : url
}

const SPANISH_MONTHS = {
  enero:0, febrero:1, marzo:2, abril:3, mayo:4, junio:5,
  julio:6, agosto:7, septiembre:8, setiembre:8, octubre:9, noviembre:10, diciembre:11
}

function parseSpanishDate(str) {
  if (!str) return null
  const m = str.trim().toLowerCase().match(/^([a-záéíóúñ]+)\s+(\d{4})$/i)
  if (!m) return null
  const monthKey = m[1].normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const month = SPANISH_MONTHS[monthKey]
  if (month === undefined) return null
  return new Date(parseInt(m[2], 10), month, 1)
}

function timeSince(sinceStr) {
  const start = parseSpanishDate(sinceStr)
  if (!start) return null
  const now = new Date()
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  if (months < 0) months = 0
  const years = Math.floor(months / 12)
  const remMonths = months % 12
  const parts = []
  if (years > 0) parts.push(`${years} ${years === 1 ? 'año' : 'años'}`)
  if (remMonths > 0 || years === 0) parts.push(`${remMonths} ${remMonths === 1 ? 'mes' : 'meses'}`)
  return parts.join(' y ')
}

// ── Lightbox de fotos ───────────────────────────────────────────────────────
function PetLightbox({ photos, startIdx, onClose, onRemove }) {
  const [idx, setIdx] = useState(startIdx)
  const prev = (e) => { e.stopPropagation(); setIdx(i => (i - 1 + photos.length) % photos.length) }
  const next = (e) => { e.stopPropagation(); setIdx(i => (i + 1) % photos.length) }
  const photo = photos[idx]

  return (
    <motion.div className="modal-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      onClick={onClose}>
      <button onClick={prev} className="absolute left-4 md:left-10 btn-icon z-10"><ChevronLeft size={20}/></button>

      <motion.div className="polaroid max-w-xs w-full mx-20"
        initial={{scale:.75, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:.75, opacity:0}}
        onClick={e => e.stopPropagation()}>
        <img src={photo.src} alt={photo.caption}
          className="w-full max-h-[65vh] object-contain rounded-sm"/>
        <p className="mt-3 font-sign text-grape text-xl text-center">{photo.caption}</p>
        <p className="font-ui text-grape/40 text-xs text-center mt-1">{idx+1}/{photos.length}</p>
      </motion.div>

      <button onClick={next} className="absolute right-4 md:right-10 btn-icon z-10"><ChevronRight size={20}/></button>
      <div className="absolute top-5 right-5 flex gap-2">
        {photo.fromDB && (
          <button onClick={(e) => { e.stopPropagation(); onRemove(photo.id); onClose() }} className="btn-icon">
            <Trash2 size={14} style={{color:'#f87171'}}/>
          </button>
        )}
        <button onClick={onClose} className="btn-icon"><X size={18}/></button>
      </div>
    </motion.div>
  )
}

// ── Modal: agregar foto ─────────────────────────────────────────────────────
function AddPhotoModal({ store, onClose }) {
  const [tab, setTab]           = useState('file')
  const [drag, setDrag]         = useState(false)
  const [form, setForm]         = useState({ caption: '', url: '' })
  const [preview, setPreview]   = useState(null)
  const [pending, setPending]   = useState(null)
  const [saving, setSaving]     = useState(false)
  const [converting, setConverting] = useState(false)
  const [err, setErr]           = useState('')
  const fileRef = useRef()

  const handleFiles = useCallback(async (files) => {
    let f = files[0]
    if (!f) return
    const heic = isHeic(f)
    if (!heic && !f.type.startsWith('image/')) { setErr('Solo imágenes (jpg, png, webp, heic...)'); return }
    setErr('')
    if (heic) {
      setConverting(true); setPreview(null); setPending(null)
      try { f = await convertHeicToJpeg(f) }
      catch { setErr('No se pudo convertir el HEIC. Intenta exportarlo como JPG.'); setConverting(false); return }
      setConverting(false)
    }
    setPending(f)
    setPreview(URL.createObjectURL(f))
  }, [])

  const save = async () => {
    setSaving(true); setErr('')
    let res
    if (tab === 'file' && pending) {
      res = await store.addFromFile(pending, form.caption, ROTS[store.count % ROTS.length])
    } else if (tab === 'url' && form.url.trim()) {
      res = await store.addFromUrl(form.url.trim(), form.caption, ROTS[store.count % ROTS.length])
    } else {
      setErr(tab === 'file' ? 'Elige una imagen' : 'Ingresa una URL'); setSaving(false); return
    }
    if (res?.error) { setErr(res.error); setSaving(false); return }
    setSaving(false); onClose()
  }

  return (
    <motion.div className="modal-overlay overflow-y-auto py-4" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}>
      <motion.div className="glass-sm p-7 w-full max-w-md mx-4 self-start mt-2 max-h-[90vh] overflow-y-auto"
        initial={{scale:.85,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:.85,opacity:0}}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-sign text-4xl" style={{color:'#E8407A'}}>Agregar foto</h3>
          <button onClick={onClose} className="btn-icon"><X size={16}/></button>
        </div>
        <div className="flex gap-2 mb-5 p-1 glass-dark rounded-xl">
          {[['file','Desde archivo',Upload],['url','Por URL',Link]].map(([t,label,Icon]) => (
            <button key={t}
              onClick={() => { setTab(t); setPreview(null); setPending(null); setForm(f=>({...f,url:''})); setErr('') }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-ui text-sm transition-all duration-200"
              style={tab===t ? {background:'#E8407A',color:'white',boxShadow:'0 0 20px rgba(232,64,122,0.4)'} : {color:'rgba(253,248,255,0.5)'}}>
              <Icon size={14}/> {label}
            </button>
          ))}
        </div>

        {tab === 'file' && (
          <div className={`drop-zone mb-4 ${drag?'dragging':''}`}
            onClick={() => !converting && fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files) }}>
            {converting ? (
              <div className="text-center py-4">
                <div className="text-2xl mb-2 animate-pulse">🔄</div>
                <p className="font-ui text-sm" style={{color:'#E8407A'}}>Convirtiendo HEIC a JPEG...</p>
              </div>
            ) : preview ? (
              <img src={preview} alt="" className="max-h-[200px] w-auto mx-auto rounded-xl object-contain"/>
            ) : (
              <>
                <Upload size={28} className="text-pearl/30 mx-auto mb-2"/>
                <p className="font-ui text-sm text-pearl/40">Arrastra o <span style={{color:'#E8407A'}}>elige archivo</span></p>
                <p className="font-ui text-xs mt-1 text-pearl/20">jpg · png · webp · gif · heic</p>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/*,.heic,.heif" className="hidden"
              onChange={e => handleFiles(e.target.files)}/>
          </div>
        )}

        {tab === 'url' && (
          <div className="mb-4 space-y-2">
            <input type="text" placeholder="https://..." value={form.url}
              onChange={e => { setForm(f=>({...f,url:e.target.value})); setErr('') }}
              className="w-full glass-dark px-4 py-3 text-pearl font-ui text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-rose/50 placeholder-pearl/20"/>
            {form.url && (
              <img src={form.url} alt="" className="max-h-32 mx-auto rounded-xl object-cover"
                onError={e => e.target.style.display='none'}/>
            )}
          </div>
        )}

        <input type="text" placeholder="Pie de foto..." value={form.caption}
          onChange={e => setForm(f=>({...f,caption:e.target.value}))}
          className="w-full glass-dark px-4 py-3 text-pearl font-ui text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-rose/50 placeholder-pearl/20 mb-2"/>

        {err && <p className="text-xs mb-3" style={{color:'#E8407A'}}>{err}</p>}

        <div className="flex items-center gap-2 mb-5">
          <div className="prog-track flex-1">
            <div className="prog-fill" style={{width:`${(store.count/store.max)*100}%`}}/>
          </div>
          <span className="font-ui text-xs" style={{color:'rgba(253,248,255,0.3)'}}>{store.count}/{store.max}</span>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
          <button onClick={save} disabled={saving || converting}
            className="btn-primary flex-1 justify-center disabled:opacity-50">
            {saving ? 'Guardando...' : '✨ Guardar'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Overlay de conversión de video ──────────────────────────────────────────
function ConvertingOverlay({ stage, progress, onCancel }) {
  return (
    <motion.div className="modal-overlay" initial={{opacity:0}} animate={{opacity:1}}>
      <motion.div className="glass-sm p-10 w-full max-w-sm mx-4 text-center"
        initial={{scale:.85}} animate={{scale:1}}>
        <div className="relative w-24 h-24 mx-auto mb-6">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(253,248,255,0.08)" strokeWidth="6"/>
            <circle cx="48" cy="48" r="40" fill="none"
              stroke="url(#pg-pet)" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
              style={{transition:'stroke-dashoffset .3s ease'}}/>
            <defs>
              <linearGradient id="pg-pet" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F0C060"/>
                <stop offset="100%" stopColor="#E8407A"/>
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display font-black text-xl text-pearl">{progress}%</span>
          </div>
        </div>
        <p className="font-sign text-3xl text-rose mb-2">Convirtiendo video</p>
        <p className="font-ui text-sm text-pearl/50 mb-1">{stage || 'Procesando…'}</p>
        <p className="font-ui text-xs text-pearl/25 mb-8">
          FFmpeg corre en tu navegador — no se envía nada a internet
        </p>
        <div className="prog-track mb-6">
          <div className="prog-fill" style={{width:`${progress}%`, transition:'width .3s ease'}}/>
        </div>
        <button onClick={onCancel} className="btn-ghost text-sm">Cancelar</button>
      </motion.div>
    </motion.div>
  )
}

// ── Modal: agregar video ────────────────────────────────────────────────────
function AddVideoModal({ store, ffmpeg, onClose }) {
  const [tab, setTab]         = useState('file')
  const [drag, setDrag]       = useState(false)
  const [form, setForm]       = useState({ title:'', url:'', thumb:'' })
  const [pending, setPending] = useState(null)
  const [err, setErr]         = useState('')
  const fileRef = useRef()

  const handleFiles = useCallback((files) => {
    const f = files[0]
    if (!f) return
    if (f.size > 500 * 1024 * 1024) { setErr('Máximo 500MB'); return }
    setPending({ file: f, native: isNativeVideo(f) })
    setForm(x => ({ ...x, title: x.title || f.name.replace(/\.[^.]+$/, '') }))
    setErr('')
  }, [])

  const save = async () => {
    setErr('')
    if (tab === 'url') {
      if (!form.url.trim()) { setErr('Ingresa una URL'); return }
      const url = toEmbedUrl(form.url.trim())
      const res = await store.addFromUrl(url, form.title || 'Mi video', form.thumb || null)
      if (res?.error) { setErr(res.error); return }
      onClose(); return
    }

    if (!pending) { setErr('Elige un archivo de video'); return }

    if (pending.native) {
      const res = await store.addFromFile(pending.file, form.title)
      if (res?.error) { setErr(res.error); return }
      onClose(); return
    }

    onClose() // ocultamos el modal, el overlay de progreso lo reemplaza
    try {
      const { blob } = await ffmpeg.convert(pending.file)
      const res = await store.addFromBlob(blob, form.title || pending.file.name.replace(/\.[^.]+$/, ''))
      if (res?.error) { setErr(res.error) }
    } catch (e) {
      // El padre vuelve a mostrar el error si se reabre el modal manualmente
      console.error('Error al convertir video:', e)
    }
  }

  return (
    <motion.div className="modal-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}>
      <motion.div className="glass-sm p-7 w-full max-w-md mx-4"
        initial={{scale:.85,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:.85,opacity:0}}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-6">
          <h3 className="font-sign text-4xl" style={{color:'#E8407A'}}>Agregar video</h3>
          <button onClick={onClose} className="btn-icon"><X size={16}/></button>
        </div>

        <div className="flex gap-2 mb-5 p-1 glass-dark rounded-xl">
          {[['file','Archivo local',Upload],['url','YouTube / URL',Link]].map(([t,label,Icon]) => (
            <button key={t}
              onClick={() => { setTab(t); setPending(null); setForm(f=>({...f,url:'',thumb:''})); setErr('') }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-ui text-sm transition-all duration-200"
              style={tab===t ? {background:'#E8407A',color:'white',boxShadow:'0 0 20px rgba(232,64,122,0.4)'} : {color:'rgba(253,248,255,0.5)'}}>
              <Icon size={14}/> {label}
            </button>
          ))}
        </div>

        {tab === 'file' && (
          <>
            <div className={`drop-zone mb-3 ${drag ? 'dragging' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDrag(true) }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files) }}>
              {pending ? (
                <div className="text-center">
                  <CheckCircle size={24} className="mx-auto mb-2" style={{color:pending.native ? 'rgba(64,200,200,0.8)' : 'rgba(240,192,96,0.8)'}}/>
                  <p className="font-ui text-sm mb-0.5" style={{color:'rgba(253,248,255,0.8)'}}>{pending.file.name}</p>
                  <p className="font-ui text-xs" style={{color:'rgba(253,248,255,0.35)'}}>
                    {(pending.file.size/1024/1024).toFixed(1)} MB
                    {pending.native ? ' · Compatible nativo ✓' : ' · Se convertirá a mp4'}
                  </p>
                </div>
              ) : (
                <>
                  <Film size={28} className="text-pearl/30 mx-auto mb-2"/>
                  <p className="font-ui text-sm text-pearl/40">Arrastra o <span style={{color:'#E8407A'}}>elige archivo</span></p>
                  <p className="font-ui text-xs mt-1 text-pearl/20">mp4 · mov · hevc · webm · avi · mkv · 3gp · flv · hasta 500MB</p>
                </>
              )}
              <input ref={fileRef} type="file" accept={ACCEPT_VIDEO} className="hidden"
                onChange={e => handleFiles(e.target.files)}/>
            </div>

            {pending && !pending.native && (
              <motion.div initial={{opacity:0,y:5}} animate={{opacity:1,y:0}}
                className="flex items-start gap-2 mb-4 p-3 rounded-xl"
                style={{background:'rgba(240,192,96,0.07)',border:'1px solid rgba(240,192,96,0.18)'}}>
                <Zap size={14} className="flex-shrink-0 mt-0.5" style={{color:'rgba(240,192,96,0.8)'}}/>
                <p className="font-ui text-xs leading-relaxed" style={{color:'rgba(240,192,96,0.7)'}}>
                  Este formato se convertirá a mp4 automáticamente en tu navegador con <strong>FFmpeg</strong>. No se envía nada a internet. Puede tardar 1-3 minutos según el tamaño.
                </p>
              </motion.div>
            )}
          </>
        )}

        {tab === 'url' && (
          <div className="space-y-2 mb-4">
            <input type="text" placeholder="https://youtube.com/watch?v=... o URL directa"
              value={form.url} onChange={e => { setForm(f=>({...f,url:e.target.value})); setErr('') }}
              className="w-full glass-dark px-4 py-3 text-pearl font-ui text-sm rounded-xl focus:outline-none focus:ring-1 placeholder-pearl/20"/>
            <input type="text" placeholder="URL de miniatura (opcional)"
              value={form.thumb} onChange={e => setForm(f=>({...f,thumb:e.target.value}))}
              className="w-full glass-dark px-4 py-3 text-pearl font-ui text-sm rounded-xl focus:outline-none focus:ring-1 placeholder-pearl/20"/>
          </div>
        )}

        <input type="text" placeholder="Título del video..."
          value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))}
          className="w-full glass-dark px-4 py-3 text-pearl font-ui text-sm rounded-xl focus:outline-none mb-2 placeholder-pearl/20"/>

        {err && <p className="text-xs mb-3" style={{color:'#E8407A'}}>{err}</p>}

        <div className="flex items-center gap-2 mb-5">
          <div className="prog-track flex-1">
            <div className="prog-fill" style={{width:`${(store.count/store.max)*100}%`}}/>
          </div>
          <span className="font-ui text-xs" style={{color:'rgba(253,248,255,0.3)'}}>{store.count}/{store.max}</span>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
          <button onClick={save} className="btn-primary flex-1 justify-center">
            {pending && !pending?.native ? (<><Zap size={16}/> Convertir y guardar</>) : '🎬 Guardar'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Reproductor de video ────────────────────────────────────────────────────
function PetVideoPlayer({ video, onClose }) {
  const isLocal = !!video.src
  const isEmbed = video.url && (video.url.includes('/embed/') || video.url.includes('youtube'))

  return (
    <motion.div className="modal-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}>
      <motion.div className="w-full max-w-4xl mx-4"
        initial={{scale:.85,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:.85,opacity:0}}
        onClick={e => e.stopPropagation()}>
        <div className="aspect-video rounded-2xl overflow-hidden bg-black" style={{boxShadow:'0 0 80px rgba(232,64,122,0.2)'}}>
          {isLocal ? (
            <video controls autoPlay playsInline className="w-full h-full">
              <source src={video.src} type="video/mp4"/>
              <source src={video.src} type="video/webm"/>
            </video>
          ) : isEmbed ? (
            <iframe src={`${video.url}?autoplay=1&rel=0`} className="w-full h-full"
              allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen title={video.title}/>
          ) : (
            <video controls autoPlay playsInline className="w-full h-full">
              <source src={video.url}/>
            </video>
          )}
        </div>
        <p className="text-center font-sign text-3xl text-pearl mt-4">{video.emoji} {video.title}</p>
        {video.converted && (
          <p className="text-center font-ui text-xs mt-1" style={{color:'rgba(64,200,200,0.5)'}}>
            ✓ Convertido a mp4 con FFmpeg
          </p>
        )}
      </motion.div>
      <button onClick={onClose} className="absolute top-5 right-5 btn-icon"><X size={18}/></button>
    </motion.div>
  )
}

function PetVideoCard({ video, idx, onClick, onDelete }) {
  const isLocal = !!video.src
  const thumb   = video.thumbnail

  return (
    <motion.div className="relative rounded-2xl overflow-hidden cursor-pointer card-lift"
      style={{boxShadow:'0 8px 32px rgba(0,0,0,0.5)', border:'1px solid rgba(253,248,255,0.07)'}}
      initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
      transition={{delay:idx*.06, duration:.5}}
      onClick={onClick}>
      <div className="bg-ink overflow-hidden relative" style={{aspectRatio:'16 / 9', maxHeight:'220px'}}>
        {isLocal ? (
          <video src={video.src} className="w-full h-full object-cover" preload="metadata" muted playsInline style={{pointerEvents:'none'}}/>
        ) : thumb ? (
          <img src={thumb} alt={video.title} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"/>
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{background:'linear-gradient(135deg,rgba(42,21,72,0.8),rgba(8,6,15,0.9))'}}>
            <Film size={36} className="text-pearl/20"/>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent to-transparent"/>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{background:'rgba(232,64,122,0.8)',backdropFilter:'blur(8px)',boxShadow:'0 0 30px rgba(232,64,122,0.5)'}}
            whileHover={{scale:1.15}} transition={{type:'spring',stiffness:300}}>
            <Play size={18} fill="white" className="text-white ml-0.5"/>
          </motion.div>
        </div>
        <div className="absolute top-2 left-2 flex gap-1">
          {isLocal && video.converted && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full font-ui"
              style={{fontSize:9,background:'rgba(8,6,15,0.7)',border:'1px solid rgba(64,200,200,0.35)',color:'rgba(64,200,200,0.85)'}}>
              <Zap size={8}/> mp4
            </span>
          )}
          {isLocal && !video.converted && (
            <span className="px-2 py-0.5 rounded-full font-ui"
              style={{fontSize:9,background:'rgba(8,6,15,0.7)',border:'1px solid rgba(253,248,255,0.15)',color:'rgba(253,248,255,0.5)'}}>
              LOCAL
            </span>
          )}
        </div>
        {video.fromDB && (
          <button onClick={e=>{e.stopPropagation();onDelete(video.id)}}
            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200"
            style={{background:'rgba(8,6,15,0.75)',border:'1px solid rgba(232,64,122,0.4)'}}>
            <Trash2 size={12} className="text-rose"/>
          </button>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{video.emoji}</span>
          <h4 className="font-display text-sm font-semibold text-pearl truncate">{video.title}</h4>
        </div>
      </div>
    </motion.div>
  )
}

// ── Tarjeta de mascota (foto + videos editables) ────────────────────────────
function PetCard({ pet, isDeceased }) {
  const scope = `pet_${slug(pet.id || pet.name)}`
  const photoStore = usePersistedPhotos(pet.photos || [], 20, scope)
  const videoStore = usePersistedVideos(pet.videos || [], 15, scope)
  const ffmpeg = useFFmpeg()

  const [light, setLight]           = useState(null)
  const [activeVideo, setActiveVideo] = useState(null)
  const [addingPhoto, setAddingPhoto] = useState(false)
  const [addingVideo, setAddingVideo] = useState(false)

  useEffect(() => {
    const open = addingPhoto || addingVideo || light !== null || activeVideo || ffmpeg.converting
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [addingPhoto, addingVideo, light, activeVideo, ffmpeg.converting])

  const photos = photoStore.all
  const atPhotoMax = photoStore.count >= photoStore.max
  const atVideoMax = videoStore.count >= videoStore.max

  return (
    <div className="relative">
      {isDeceased && (
        <motion.div
          className="flex items-center gap-3 mb-6 px-5 py-3 rounded-2xl"
          style={{background:'linear-gradient(135deg, rgba(155,120,200,0.12), rgba(232,64,122,0.08))', border:'1px solid rgba(155,120,200,0.25)'}}
          initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} transition={{delay:.3}}>
          <Star size={16} style={{color:'rgba(200,170,255,0.8)'}} fill="rgba(200,170,255,0.4)"/>
          <p className="font-display italic text-lg" style={{color:'rgba(200,170,255,0.75)'}}>
            {pet.since} — {pet.passedDate || 'siempre en nuestros corazones'}
          </p>
          <Star size={16} style={{color:'rgba(200,170,255,0.8)'}} fill="rgba(200,170,255,0.4)"/>
        </motion.div>
      )}

      {!isDeceased && (
        <motion.div
          className="flex items-center gap-3 mb-6 px-5 py-3 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(232,64,122,0.10), rgba(240,192,96,0.08))',
            border: '1px solid rgba(232,64,122,0.22)'
          }}
          initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} transition={{delay:.3}}>
          <Heart size={16} style={{color:'#E8407A'}} fill="#E8407A"/>
          <p className="font-display italic text-lg" style={{color:'rgba(253,248,255,0.78)'}}>
            {pet.since} — hoy
            {timeSince(pet.since) ? ` · ${timeSince(pet.since)} juntos 💕` : ''}
          </p>
          <Heart size={16} style={{color:'#E8407A'}} fill="#E8407A"/>
        </motion.div>
      )}

      <div className="flex flex-col lg:flex-row gap-10 items-start">

        {/* Panel de info */}
        <motion.div className="glass p-8 lg:w-80 flex-shrink-0"
          initial={{opacity:0, x:-30}} whileInView={{opacity:1, x:0}} viewport={{once:true}} transition={{duration:.7}}>

          {photos[0] && (
            <motion.div className="polaroid bg-white mx-auto mb-6 cursor-pointer"
              style={{width:180, rotate:'-2deg'}}
              whileHover={{rotate:'0deg', scale:1.05}}
              onClick={() => setLight(0)}>
              <div className="overflow-hidden bg-grape/20" style={{aspectRatio:'1/1'}}>
                <img src={photos[0].src} alt={pet.name} className="w-full h-full object-cover"
                  style={isDeceased ? {filter:'sepia(0.3) contrast(0.95)'} : {}} loading="lazy"/>
              </div>
              <p className="mt-2 font-sign text-grape text-sm text-center">{photos[0].caption}</p>
            </motion.div>
          )}

          <p className="font-body italic text-xl leading-relaxed mb-6" style={{color:'rgba(253,248,255,0.72)'}}>
            "{pet.description}"
          </p>

          <div className="grad-line mb-5"/>

          <p className="eyebrow mb-4">cosas que amamos de {pet.name}</p>
          <ul className="space-y-3">
            {pet.funFacts.map((f, i) => (
              <motion.li key={i} className="flex items-start gap-3"
                initial={{opacity:0, x:-15}} whileInView={{opacity:1, x:0}}
                viewport={{once:true}} transition={{delay:i*.08}}>
                <Heart size={12} className="flex-shrink-0 mt-1.5"
                  style={isDeceased ? {color:'rgba(200,170,255,0.7)', fill:'rgba(200,170,255,0.3)'} : {color:'#E8407A', fill:'#E8407A'}}/>
                <span className="font-body text-lg" style={{color:'rgba(253,248,255,0.62)'}}>{f}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Galería de fotos */}
        <div className="flex-1 w-full">
          <div className="flex items-center justify-between mb-4">
            <p className="font-ui text-xs" style={{color:'rgba(253,248,255,0.3)'}}>
              {photoStore.count}/{photoStore.max} fotos
            </p>
            {!atPhotoMax && (
              <motion.button className="btn-ghost text-xs flex items-center gap-1.5 px-3 py-1.5"
                onClick={() => setAddingPhoto(true)} whileHover={{scale:1.04}} whileTap={{scale:.97}}>
                <Plus size={14}/> Agregar foto
              </motion.button>
            )}
          </div>

          {/* Mobile: grid simple */}
          <div className="grid grid-cols-2 gap-4 lg:hidden">
            {photos.map((p, i) => (
              <motion.div key={p.id || i}
                className="polaroid bg-white cursor-pointer relative group"
                style={{rotate: p.rotate, filter: isDeceased ? 'sepia(0.25)' : 'none'}}
                initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}}
                viewport={{once:true}} transition={{delay:i*.07, type:'spring'}}
                whileHover={{rotate:'0deg', scale:1.06}}
                onClick={() => setLight(i)}>
                {p.fromDB && (
                  <button onClick={(e) => { e.stopPropagation(); photoStore.remove(p.id) }}
                    className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{background:'rgba(8,6,15,0.75)', border:'1px solid rgba(232,64,122,0.4)'}}>
                    <Trash2 size={12} className="text-rose-400"/>
                  </button>
                )}
                <div className="aspect-square overflow-hidden bg-grape/20">
                  <img src={p.src} alt={p.caption} className="w-full h-full object-cover" loading="lazy"/>
                </div>
                <p className="mt-2 font-sign text-grape text-sm text-center">{p.caption}</p>
              </motion.div>
            ))}
          </div>

          {/* Desktop: layout disperso */}
          <div className="hidden lg:block relative" style={{height: Math.ceil(photos.length/3)*220 + 100}}>
            {photos.map((p, i) => {
              const row = Math.floor(i/3)
              const col = i % 3
              return (
                <motion.div key={p.id || i}
                  className="polaroid bg-white absolute cursor-pointer group"
                  style={{
                    width: 160, left: col * 185, top: row * 215,
                    rotate: SCATTERED[i % SCATTERED.length],
                    filter: isDeceased ? 'sepia(0.3)' : 'none',
                    zIndex: i
                  }}
                  initial={{opacity:0, scale:.7}}
                  whileInView={{opacity:1, scale:1}}
                  viewport={{once:true}}
                  transition={{delay:i*.09, type:'spring', stiffness:160}}
                  whileHover={{rotate:'0deg', scale:1.1, zIndex:20}}
                  onClick={() => setLight(i)}>
                  {p.fromDB && (
                    <button onClick={(e) => { e.stopPropagation(); photoStore.remove(p.id) }}
                      className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{background:'rgba(8,6,15,0.75)', border:'1px solid rgba(232,64,122,0.4)'}}>
                      <Trash2 size={10} className="text-rose-400"/>
                    </button>
                  )}
                  <div className="overflow-hidden bg-grape/20" style={{aspectRatio:'1/1'}}>
                    <img src={p.src} alt={p.caption} className="w-full h-full object-cover" loading="lazy"/>
                  </div>
                  <p className="mt-1.5 font-sign text-grape text-xs text-center leading-tight">{p.caption}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Videos de la mascota */}
      <div className="mt-14">
        <div className="flex items-center justify-between mb-5">
          <p className="eyebrow">videos de {pet.name}</p>
          <p className="font-ui text-xs" style={{color:'rgba(253,248,255,0.3)'}}>
            {videoStore.count}/{videoStore.max} videos
          </p>
        </div>

        {videoStore.all.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
            {videoStore.all.map((v, i) => (
              <PetVideoCard key={v.id || i} video={v} idx={i}
                onClick={() => setActiveVideo(v)} onDelete={(id) => videoStore.remove(id)}/>
            ))}
          </div>
        ) : (
          <p className="font-body italic text-base mb-6" style={{color:'rgba(253,248,255,0.3)'}}>
            Todavía no hay videos de {pet.name}.
          </p>
        )}

        {!atVideoMax && (
          <motion.button className="btn-ghost text-sm flex items-center gap-2 px-4 py-2"
            onClick={() => setAddingVideo(true)} whileHover={{scale:1.04}} whileTap={{scale:.97}}>
            <Plus size={16}/> Agregar video
          </motion.button>
        )}
        {atVideoMax && (
          <p className="font-ui text-xs" style={{color:'rgba(253,248,255,0.25)'}}>
            ✦ Máximo de {videoStore.max} videos alcanzado
          </p>
        )}
      </div>

      {/* Modales y overlays */}
      <AnimatePresence>
        {light !== null && (
          <PetLightbox photos={photos} startIdx={light} onClose={() => setLight(null)} onRemove={photoStore.remove}/>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {addingPhoto && <AddPhotoModal store={photoStore} onClose={() => setAddingPhoto(false)}/>}
      </AnimatePresence>

      <AnimatePresence>
        {addingVideo && !ffmpeg.converting && (
          <AddVideoModal store={videoStore} ffmpeg={ffmpeg} onClose={() => setAddingVideo(false)}/>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {ffmpeg.converting && (
          <ConvertingOverlay stage={ffmpeg.stage} progress={ffmpeg.progress} onCancel={ffmpeg.cancel}/>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeVideo && <PetVideoPlayer video={activeVideo} onClose={() => setActiveVideo(null)}/>}
      </AnimatePresence>
    </div>
  )
}

// ── Sección principal de mascotas ───────────────────────────────────────────
export default function Pet() {
  const { pets } = config
  const rawList = pets || (config.pet ? [config.pet] : [])
  if (!rawList.length) return null

  // Mascotas fallecidas primero, luego las demás (orden original entre sí se conserva)
  const petList = [...rawList].sort((a, b) => {
    const aDec = !!a.passedDate || a.deceased === true
    const bDec = !!b.passedDate || b.deceased === true
    return (bDec ? 1 : 0) - (aDec ? 1 : 0)
  })

  const [activePet, setActivePet] = useState(0)
  const current   = petList[activePet]
  const isDeceased = !!current.passedDate || current.deceased === true

  return (
    <section className="relative py-24 px-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{background:'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(42,21,72,0.4) 0%, transparent 70%)'}}/>

      <div className="section-wrap">

        <motion.div className="text-center mb-14"
          initial={{y:30,opacity:0}} whileInView={{y:0,opacity:1}} viewport={{once:true}} transition={{duration:.7}}>
          <p className="eyebrow mb-3">el amor peludo</p>
          <h2 className="h-sect mb-2">
            {petList.length === 1 ? `${petList[0].emoji} ${petList[0].name}` : 'Nuestras mascotas'}
          </h2>
          <p className="body-md">
            {petList.length === 1 ? `${current.breed} · Con nosotros desde ${current.since}` : 'Los amores de cuatro patas de nuestra familia'}
          </p>
        </motion.div>

        {petList.length > 1 && (
          <div className="flex justify-center gap-3 mb-14">
            {petList.map((pet, i) => {
              const dec = !!pet.passedDate || pet.deceased === true
              return (
                <motion.button key={i}
                  onClick={() => setActivePet(i)}
                  className="flex items-center gap-3 px-6 py-3 rounded-2xl font-ui text-sm transition-all duration-300"
                  style={activePet === i
                    ? dec
                      ? {background:'rgba(155,120,200,0.2)', border:'1px solid rgba(155,120,200,0.4)', color:'rgba(200,170,255,0.9)'}
                      : {background:'rgba(232,64,122,0.15)', border:'1px solid rgba(232,64,122,0.4)', color:'rgba(253,248,255,0.9)'}
                    : {background:'rgba(253,248,255,0.04)', border:'1px solid rgba(253,248,255,0.08)', color:'rgba(253,248,255,0.4)'}
                  }
                  whileHover={{scale:1.04}} whileTap={{scale:.97}}>
                  <span className="text-xl">{pet.emoji}</span>
                  <div className="text-left">
                    <p className="font-semibold leading-none">{pet.name}</p>
                    {dec && (
                      <p className="text-[10px] mt-0.5" style={{color:'rgba(200,170,255,0.6)'}}>✦ En el cielo</p>
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={activePet}
            initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}}
            transition={{duration:.5}}>
            <PetCard pet={current} isDeceased={isDeceased}/>
          </motion.div>
        </AnimatePresence>

        {isDeceased && (
          <motion.div className="mt-16 text-center"
            initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} transition={{delay:.4}}>
            <div className="inline-block px-8 py-5 rounded-3xl"
              style={{background:'rgba(155,120,200,0.08)', border:'1px solid rgba(155,120,200,0.2)'}}>
              <p className="font-sign text-4xl mb-2" style={{color:'rgba(200,170,255,0.8)'}}>
                {current.memorialText || `Siempre en nuestros corazones, ${current.name} 🌈`}
              </p>
              <p className="font-body italic text-base" style={{color:'rgba(253,248,255,0.35)'}}>
                Gracias por todos los momentos felices que nos regalaste.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}