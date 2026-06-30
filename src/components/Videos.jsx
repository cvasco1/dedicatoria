import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Play, Upload, Link, Trash2, Film, Loader2, Zap, CheckCircle } from 'lucide-react'
import { usePersistedVideos } from '../useMediaStore'
import { useFFmpeg } from '../useFFmpeg'
import { config } from '../config'

// ─────────────────────────────────────────────────────────────────────────────
// Formats that browsers can play natively — skip FFmpeg for these
const NATIVE_TYPES = ['video/mp4','video/webm','video/ogg']
const isNative = (file) => NATIVE_TYPES.includes(file.type) ||
  /\.(mp4|webm|ogg)$/i.test(file.name)

// Auto-convert YouTube watch URL → embed
function toEmbedUrl(url) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return yt ? `https://www.youtube.com/embed/${yt[1]}` : url
}

// ── Conversion progress overlay ──────────────────────────────────────────────
function ConvertingOverlay({ stage, progress, onCancel }) {
  return (
    <motion.div className="modal-overlay" initial={{opacity:0}} animate={{opacity:1}}>
      <motion.div className="glass-sm p-10 w-full max-w-sm mx-4 text-center"
        initial={{scale:.85}} animate={{scale:1}}>

        {/* Animated ring */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(253,248,255,0.08)" strokeWidth="6"/>
            <circle cx="48" cy="48" r="40" fill="none"
              stroke="url(#pg)" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
              style={{transition:'stroke-dashoffset .3s ease'}}
            />
            <defs>
              <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
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

        {/* Progress bar */}
        <div className="prog-track mb-6">
          <div className="prog-fill" style={{width:`${progress}%`, transition:'width .3s ease'}}/>
        </div>

        <button onClick={onCancel} className="btn-ghost text-sm">Cancelar</button>
      </motion.div>
    </motion.div>
  )
}

// ── Video player modal ────────────────────────────────────────────────────────
function VideoPlayer({ video, onClose }) {
  const isLocal = !!video.src
  const isEmbed = video.url && (video.url.includes('/embed/') || video.url.includes('youtube'))

  return (
    <motion.div className="modal-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      onClick={onClose}>
      <motion.div className="w-full max-w-4xl mx-4"
        initial={{scale:.85,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:.85,opacity:0}}
        onClick={e => e.stopPropagation()}>
        <div className="aspect-video rounded-2xl overflow-hidden bg-black"
          style={{boxShadow:'0 0 80px rgba(232,64,122,0.2)'}}>
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

// ── Video thumbnail card ──────────────────────────────────────────────────────
function VideoCard({ video, idx, onClick, onDelete }) {
  const isLocal = !!video.src
  const thumb   = video.thumbnail

  return (
    <motion.div className="relative rounded-2xl overflow-hidden cursor-pointer card-lift"
      style={{boxShadow:'0 8px 32px rgba(0,0,0,0.5)', border:'1px solid rgba(253,248,255,0.07)'}}
      initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
      transition={{delay:idx*.06, duration:.5}}
      onClick={onClick}>

      {/* Thumbnail */}
      <div
        className="bg-ink overflow-hidden relative"
        style={{
          aspectRatio: '16 / 9',
          maxHeight: '260px'
        }}
      >
        {isLocal ? (
          <video src={video.src} className="w-full h-full object-cover" preload="metadata" muted playsInline
            style={{pointerEvents:'none'}}/>
        ) : thumb ? (
          <img src={thumb} alt={video.title} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"/>
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{background:'linear-gradient(135deg,rgba(42,21,72,0.8),rgba(8,6,15,0.9))'}}>
            <Film size={40} className="text-pearl/20"/>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent to-transparent"/>

        {/* Play */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{background:'rgba(232,64,122,0.8)',backdropFilter:'blur(8px)',boxShadow:'0 0 30px rgba(232,64,122,0.5)'}}
            whileHover={{scale:1.15}} transition={{type:'spring',stiffness:300}}>
            <Play size={22} fill="white" className="text-white ml-1"/>
          </motion.div>
        </div>

        {/* Badges */}
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

        {/* Delete */}
        {video.fromDB && (
          <button onClick={e=>{e.stopPropagation();onDelete(video.id)}}
            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200"
            style={{background:'rgba(8,6,15,0.75)',border:'1px solid rgba(232,64,122,0.4)'}}>
            <Trash2 size={12} className="text-rose"/>
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{video.emoji}</span>
          <h3 className="font-display text-base font-semibold text-pearl truncate">{video.title}</h3>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main section ──────────────────────────────────────────────────────────────
export default function Videos() {
  const store  = usePersistedVideos(config.videos, 15)
  const ffmpeg = useFFmpeg()

  const [active,  setActive]  = useState(null)
  const [adding,  setAdding]  = useState(false)
  const [tab,     setTab]     = useState('file')
  const [drag,    setDrag]    = useState(false)
  const [form,    setForm]    = useState({ title:'', url:'', thumb:'' })
  const [pending, setPending] = useState(null)   // { file, native }
  const [err,     setErr]     = useState('')
  const fileRef = useRef()
    useEffect(() => {
    if (ffmpeg.converting || adding || active) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [ffmpeg.converting, adding, active])

  const ACCEPT = 'video/*,.mov,.mp4,.m4v,.webm,.avi,.mkv,.hevc,.heic,.3gp,.flv,.wmv,.mts,.m2ts'

  const handleFiles = useCallback((files) => {
    const f = files[0]
    if (!f) return
    if (f.size > 500 * 1024 * 1024) { setErr('Máximo 500MB'); return }
    setPending({ file: f, native: isNative(f) })
    setForm(x => ({ ...x, title: x.title || f.name.replace(/\.[^.]+$/, '') }))
    setErr('')
  }, [])

  const save = async () => {
    setErr('')
    if (tab === 'url') {
      if (!form.url.trim()) { setErr('Ingresa una URL'); return }
      let url = toEmbedUrl(form.url.trim())
      const res = await store.addFromUrl(url, form.title || 'Mi video', form.thumb || null)
      if (res?.error) { setErr(res.error); return }
      cancelAdd(); return
    }

    if (!pending) { setErr('Elige un archivo de video'); return }

    if (pending.native) {
      // mp4/webm → store directly, no conversion needed
      const res = await store.addFromFile(pending.file, form.title)
      if (res?.error) { setErr(res.error); return }
      cancelAdd(); return
    }

    // Non-native format → convert with FFmpeg.wasm first
    setAdding(false)  // hide modal while converting (overlay shows progress)
    try {
      const { blob } = await ffmpeg.convert(pending.file)
      const res = await store.addFromBlob(blob, form.title || pending.file.name.replace(/\.[^.]+$/,''))
      if (res?.error) { setErr(res.error); return }
      setPending(null); setForm({ title:'', url:'', thumb:'' })
    } catch (e) {
      setErr('Error al convertir: ' + (e.message || 'intenta con otro archivo'))
      setAdding(true)   // re-open modal on error
    }
  }

  const cancelAdd = () => {
    setAdding(false); setPending(null)
    setForm({ title:'', url:'', thumb:'' }); setErr('')
  }

  const atMax = store.count >= store.max

  return (
    <section className="relative py-24 px-4">
      <div className="section-wrap">

        {/* Heading */}
        <motion.div className="text-center mb-14"
          initial={{y:30,opacity:0}} whileInView={{y:0,opacity:1}} viewport={{once:true}} transition={{duration:.7}}>
          <p className="eyebrow mb-3">momentos en movimiento</p>
          <h2 className="h-sect mb-2">Nuestros videos</h2>
          <p className="body-md">Cualquier formato — se convierte automáticamente ✨</p>
          <p className="font-ui text-xs mt-3" style={{color:'rgba(253,248,255,0.25)'}}>
            {store.count}/{store.max} videos · {store.saved.length} guardados en tu dispositivo
          </p>
        </motion.div>

        {/* Grid */}
        <div className="video-grid mb-10">
          {store.all.map((video, i) => (
            <VideoCard key={video.id || i} video={video} idx={i}
              onClick={() => setActive(video)}
              onDelete={id => store.remove(id)}/>
          ))}
        </div>

        {!atMax && (
          <div className="flex justify-center">
            <motion.button className="btn-primary" onClick={() => setAdding(true)}
              whileHover={{scale:1.04}} whileTap={{scale:.97}}>
              <Plus size={18}/> Agregar video
            </motion.button>
          </div>
        )}
        {atMax && (
          <p className="text-center font-ui text-xs mt-4" style={{color:'rgba(253,248,255,0.25)'}}>
            ✦ Máximo de {store.max} videos alcanzado
          </p>
        )}
      </div>

      {/* FFmpeg conversion overlay */}
      <AnimatePresence>
        {ffmpeg.converting && (
          <ConvertingOverlay
            stage={ffmpeg.stage}
            progress={ffmpeg.progress}
            onCancel={ffmpeg.cancel}/>
        )}
      </AnimatePresence>

      {/* Add modal */}
      <AnimatePresence>
        {adding && !ffmpeg.converting && (
          <motion.div className="modal-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={cancelAdd}>
            <motion.div className="glass-sm p-7 w-full max-w-md mx-4"
              initial={{scale:.85,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:.85,opacity:0}}
              onClick={e => e.stopPropagation()}>

              <div className="flex items-center justify-between mb-6">
                <h3 className="font-sign text-4xl" style={{color:'#E8407A'}}>Agregar video</h3>
                <button onClick={cancelAdd} className="btn-icon"><X size={16}/></button>
              </div>

              {/* Tabs */}
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

              {/* File tab */}
              {tab === 'file' && (
                <>
                  <div
                    className={`drop-zone mb-3 ${drag ? 'dragging' : ''}`}
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDrag(true) }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files) }}>

                    {pending ? (
                      <div className="text-center">
                        <CheckCircle size={24} className="mx-auto mb-2" style={{color:pending.native ? 'rgba(64,200,200,0.8)' : 'rgba(240,192,96,0.8)'}}/>
                        <p className="font-ui text-sm mb-0.5" style={{color:'rgba(253,248,255,0.8)'}}>
                          {pending.file.name}
                        </p>
                        <p className="font-ui text-xs" style={{color:'rgba(253,248,255,0.35)'}}>
                          {(pending.file.size/1024/1024).toFixed(1)} MB
                          {pending.native
                            ? ' · Compatible nativo ✓'
                            : ' · Se convertirá a mp4'}
                        </p>
                      </div>
                    ) : (
                      <>
                        <Film size={28} className="text-pearl/30 mx-auto mb-2"/>
                        <p className="font-ui text-sm text-pearl/40">
                          Arrastra o <span style={{color:'#E8407A'}}>elige archivo</span>
                        </p>
                        <p className="font-ui text-xs mt-1 text-pearl/20">
                          mp4 · mov · hevc · webm · avi · mkv · 3gp · flv · hasta 500MB
                        </p>
                      </>
                    )}
                    <input ref={fileRef} type="file" accept={ACCEPT} className="hidden"
                      onChange={e => handleFiles(e.target.files)}/>
                  </div>

                  {/* Info box about FFmpeg */}
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

              {/* URL tab */}
              {tab === 'url' && (
                <div className="space-y-2 mb-4">
                  <input type="text" placeholder="https://youtube.com/watch?v=... o URL directa"
                    value={form.url} onChange={e => { setForm(f=>({...f,url:e.target.value})); setErr('') }}
                    className="w-full glass-dark px-4 py-3 text-pearl font-ui text-sm rounded-xl focus:outline-none focus:ring-1 placeholder-pearl/20"
                    style={{'--tw-ring-color':'rgba(232,64,122,0.5)'}}/>
                  <input type="text" placeholder="URL de miniatura (opcional)"
                    value={form.thumb} onChange={e => setForm(f=>({...f,thumb:e.target.value}))}
                    className="w-full glass-dark px-4 py-3 text-pearl font-ui text-sm rounded-xl focus:outline-none focus:ring-1 placeholder-pearl/20"/>
                </div>
              )}

              {/* Title */}
              <input type="text" placeholder="Título del video..."
                value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))}
                className="w-full glass-dark px-4 py-3 text-pearl font-ui text-sm rounded-xl focus:outline-none mb-2 placeholder-pearl/20"/>

              {err && <p className="text-xs mb-3" style={{color:'#E8407A'}}>{err}</p>}

              {/* Quota */}
              <div className="flex items-center gap-2 mb-5">
                <div className="prog-track flex-1">
                  <div className="prog-fill" style={{width:`${(store.count/store.max)*100}%`}}/>
                </div>
                <span className="font-ui text-xs" style={{color:'rgba(253,248,255,0.3)'}}>{store.count}/{store.max}</span>
              </div>

              <div className="flex gap-3">
                <button onClick={cancelAdd} className="btn-ghost flex-1 justify-center">Cancelar</button>
                <button onClick={save}
                  className="btn-primary flex-1 justify-center">
                  {pending && !pending?.native ? (
                    <><Zap size={16}/> Convertir y guardar</>
                  ) : '🎬 Guardar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player */}
      <AnimatePresence>
        {active && <VideoPlayer video={active} onClose={() => setActive(null)}/>}
      </AnimatePresence>
    </section>
  )
}
