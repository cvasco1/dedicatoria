import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, ChevronLeft, ChevronRight, Trash2, Upload, Link } from 'lucide-react'
import { usePersistedPhotos } from '../useMediaStore'
import { config } from '../config'
import heic2any from 'heic2any'

const ROTS = ['-2deg','1.5deg','-1deg','2deg','-1.5deg','1deg','-2.5deg','0.8deg']

async function convertHeicToJpeg(file) {
  const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 })
  const converted = Array.isArray(blob) ? blob[0] : blob
  return new File([converted], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' })
}

function isHeic(file) {
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    /\.(heic|heif)$/i.test(file.name)
  )
}

export default function Gallery() {
  const store = usePersistedPhotos(config.photos, 20)

  const [lightbox, setLightbox] = useState(null)
  const [adding,   setAdding]   = useState(false)
  const [tab,      setTab]      = useState('file')
  const [drag,     setDrag]     = useState(false)
  const [form,     setForm]     = useState({ caption:'', url:'' })
  const [preview,  setPreview]  = useState(null)
  const [pending,  setPending]  = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [converting, setConverting] = useState(false)
  const [err,      setErr]      = useState('')
  const fileRef = useRef()
  const [showAll, setShowAll] = useState(false)
  const [albumLightbox, setAlbumLightbox] = useState(null)

  const openLight = (photo, idx) => setLightbox({ photo, idx })
  const closeLight = () => setLightbox(null)
  const prevLight = (e) => {
    e.stopPropagation()
    const i = (lightbox.idx - 1 + store.all.length) % store.all.length
    setLightbox({ photo: store.all[i], idx: i })
  }
  const nextLight = (e) => {
    e.stopPropagation()
    const i = (lightbox.idx + 1) % store.all.length
    setLightbox({ photo: store.all[i], idx: i })
  }

  const prevAlbum = (e) => {
    e.stopPropagation()
    const i = (albumLightbox.idx - 1 + config.album.length) % config.album.length
    setAlbumLightbox({ photo: config.album[i], idx: i })
  }

  const nextAlbum = (e) => {
    e.stopPropagation()
    const i = (albumLightbox.idx + 1) % config.album.length
    setAlbumLightbox({ photo: config.album[i], idx: i })
  }

  const handleFiles = useCallback(async (files) => {
    let f = files[0]
    if (!f) return
    const heic = isHeic(f)
    if (!heic && !f.type.startsWith('image/')) {
      setErr('Solo imágenes (jpg, png, webp, heic...)')
      return
    }
    setErr('')
    if (heic) {
      setConverting(true)
      setPreview(null)
      setPending(null)
      try {
        f = await convertHeicToJpeg(f)
      } catch (e) {
        setErr('No se pudo convertir el HEIC. Intenta exportarlo como JPG.')
        setConverting(false)
        return
      }
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
    cancelAdd(); setSaving(false)
  }

  const cancelAdd = () => {
    setAdding(false); setPreview(null); setPending(null)
    setForm({ caption:'', url:'' }); setErr(''); setConverting(false)
  }

  useEffect(() => {
    if (adding || showAll || albumLightbox || lightbox) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }

    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [adding, showAll, albumLightbox, lightbox])

  const atMax = store.count >= store.max

  return (
    <section className="relative py-24 px-4 overflow-hidden">
      <div className="section-wrap">
        <motion.div className="text-center mb-14"
          initial={{y:30,opacity:0}} whileInView={{y:0,opacity:1}} viewport={{once:true}} transition={{duration:.7}}>
          <p className="eyebrow mb-3">nuestros recuerdos</p>
          <h2 className="h-sect mb-2">Galería de momentos</h2>
          <p className="body-md">Fotos que guardan pedacitos de nosotros</p>
          <p className="font-ui text-xs mt-3" style={{color:'rgba(253,248,255,0.25)'}}>
            {store.count}/{store.max} fotos · {store.saved.length} guardadas en tu dispositivo
          </p>
        </motion.div>

        {/* Masonry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-10">
          {store.all.map((photo, i) => (
            <motion.div key={photo.id || i} className="masonry-item"
              initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
              transition={{delay:i*.05, duration:.5, type:'spring'}}>
              <div
                className="polaroid cursor-pointer relative group"
                style={{ rotate: photo.rotate }}
                onClick={() => openLight(photo, i)}
              >
                {photo.fromDB && (
                  <button
                    onClick={(e) => { e.stopPropagation(); store.remove(photo.id) }}
                    className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ background: 'rgba(8,6,15,0.75)', border: '1px solid rgba(232,64,122,0.4)' }}
                  >
                    <Trash2 size={14} className="text-rose-400" />
                  </button>
                )}
                <div className="overflow-hidden bg-grape/20 relative" style={{ aspectRatio: '4/3' }}>
                  <img src={photo.src} alt={photo.caption}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                    loading="lazy"
                    onError={e => { e.target.src='https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&q=80' }}/>
                </div>
                <p className="mt-2 font-sign text-grape text-sm text-center leading-tight px-1">{photo.caption}</p>
              </div>
            </motion.div>
          ))}
          <motion.div whileHover={{ scale: 1.03 }}>
            <div className="polaroid cursor-pointer" onClick={() => setShowAll(true)}>
              <div className="overflow-hidden bg-rose/20 aspect-[4/3] flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">💕</div>
                  <p className="font-sign text-lg text-white">Todos nuestros recuerdos</p>
                </div>
              </div>
              <p className="mt-2 font-sign text-grape text-sm text-center">
                {config.album?.length || 0} fotografías
              </p>
            </div>
          </motion.div>
        </div>

        {!atMax && (
          <div className="flex justify-center">
            <motion.button className="btn-primary" onClick={() => setAdding(true)}
              whileHover={{scale:1.04}} whileTap={{scale:.97}}>
              <Plus size={18}/> Agregar foto
            </motion.button>
          </div>
        )}
        {atMax && (
          <p className="text-center font-ui text-xs mt-4" style={{color:'rgba(253,248,255,0.25)'}}>
            ✦ Máximo de {store.max} fotos alcanzado
          </p>
        )}
      </div>

      {/* Add modal */}
      <AnimatePresence>
        {adding && (
          <motion.div className="modal-overlay overflow-y-auto py-4" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={cancelAdd}>
            <motion.div className="glass-sm p-7 w-full max-w-md mx-4 self-start mt-2 max-h-[90vh] overflow-y-auto"
              initial={{scale:.85,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:.85,opacity:0}}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-sign text-4xl" style={{color:'#E8407A'}}>Agregar foto</h3>
                <button onClick={cancelAdd} className="btn-icon"><X size={16}/></button>
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
                <button onClick={cancelAdd} className="btn-ghost flex-1 justify-center">Cancelar</button>
                <button onClick={save} disabled={saving || converting}
                  className="btn-primary flex-1 justify-center disabled:opacity-50">
                  {saving ? 'Guardando...' : '✨ Guardar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div className="modal-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={closeLight}>
            <button onClick={prevLight} className="absolute left-4 md:left-10 btn-icon z-10"><ChevronLeft size={20}/></button>
            <motion.div className="polaroid max-w-xs w-full mx-16"
              initial={{scale:.75,opacity:0,rotate:lightbox.photo.rotate}}
              animate={{scale:1,opacity:1,rotate:'0deg'}}
              exit={{scale:.75,opacity:0}}
              onClick={e => e.stopPropagation()}>
              <img src={lightbox.photo.src} alt={lightbox.photo.caption}
                className="w-full max-h-[65vh] object-contain rounded-sm"/>
              <p className="mt-3 font-sign text-grape text-xl text-center">{lightbox.photo.caption}</p>
              <p className="font-ui text-grape/40 text-xs text-center mt-1">{lightbox.idx+1}/{store.all.length}</p>
            </motion.div>
            <button onClick={nextLight} className="absolute right-4 md:right-10 btn-icon z-10"><ChevronRight size={20}/></button>
            <div className="absolute top-5 right-5 flex gap-2">
              {lightbox.photo.fromDB && (
                <button onClick={() => { store.remove(lightbox.photo.id); closeLight() }} className="btn-icon">
                  <Trash2 size={14} style={{color:'#f87171'}}/>
                </button>
              )}
              <button onClick={closeLight} className="btn-icon"><X size={18}/></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAll && (
          <motion.div className="fixed inset-0 z-40 bg-black/90 backdrop-blur-md overflow-y-auto"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="sticky top-0 flex justify-end p-4">
              <button onClick={() => setShowAll(false)} className="text-white"><X size={32} /></button>
            </div>
            <div className="max-w-7xl mx-auto p-8">
              <h2 className="font-sign text-5xl text-center text-rose mb-4">💕 Todos nuestros recuerdos</h2>
              <p className="text-center text-white/60 mb-10">Nuestra historia en fotografías</p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {config.album?.map((photo, index) => (
                  <div key={index} className="cursor-pointer overflow-hidden rounded-xl"
                    onClick={() => setAlbumLightbox({ photo, idx: index })}>
                    <img src={photo.src} alt={photo.caption} className="w-full aspect-[3/4] object-cover"/>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {albumLightbox && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setAlbumLightbox(null)}>
            <button onClick={prevAlbum} className="absolute left-4 md:left-10 btn-icon z-10"><ChevronLeft size={20} /></button>
            <motion.div className="polaroid max-w-xs w-full mx-16"
              initial={{ scale: .75, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: .75, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}>
              <img src={albumLightbox.photo.src} alt={albumLightbox.photo.caption}
                className="w-full max-h-[65vh] object-contain rounded-sm"/>
              <p className="mt-3 font-sign text-grape text-xl text-center">{albumLightbox.photo.caption}</p>
              <p className="font-ui text-grape/40 text-xs text-center mt-1">
                {albumLightbox.idx + 1} / {config.album.length}
              </p>
            </motion.div>
            <button onClick={nextAlbum} className="absolute right-4 md:right-10 btn-icon z-10"><ChevronRight size={20} /></button>
            <button onClick={() => setAlbumLightbox(null)} className="absolute top-5 right-5 btn-icon"><X size={18} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}