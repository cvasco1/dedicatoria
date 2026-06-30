import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, Play } from 'lucide-react'
import { config } from '../config'

const ACCENTS = [
  {border:'rgba(232,64,122,0.2)',glow:'rgba(232,64,122,0.06)'},
  {border:'rgba(240,192,96,0.2)',glow:'rgba(240,192,96,0.06)'},
  {border:'rgba(64,200,200,0.2)',glow:'rgba(64,200,200,0.06)'},
  {border:'rgba(155,64,232,0.2)',glow:'rgba(155,64,232,0.06)'},
]

function WaxSeal({ emoji, colorIdx }) {
  const c = ACCENTS[colorIdx % 4]
  return (
    <motion.div
      className="w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0 select-none"
      style={{
        background:`radial-gradient(circle at 35% 35%, ${c.border.replace('0.2','0.9')}, rgba(80,0,30,0.95))`,
        boxShadow:`0 4px 20px ${c.border}, inset 0 2px 4px rgba(255,255,255,0.2)`
      }}
      initial={{scale:0,rotate:-30}} animate={{scale:1,rotate:0}}
      transition={{type:'spring',stiffness:250,delay:.1}}>
      {emoji}
    </motion.div>
  )
}

function VideoThumb({ src, onClick }) {
  return (
    <div className="relative cursor-pointer w-full h-52 rounded-2xl overflow-hidden" onClick={onClick}>
      <video
        src={src}
        className="w-full h-full object-cover"
        preload="metadata"
        muted
        playsInline
        onLoadedMetadata={e => { e.target.currentTime = 1 }}
      />
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(232,64,122,0.85)', boxShadow: '0 0 24px rgba(232,64,122,0.5)' }}>
          <Play size={18} fill="white" className="text-white ml-0.5" />
        </div>
      </div>
    </div>
  )
}

export default function SurpriseMessages() {
  const [open,    setOpen]    = useState(null)
  const [photo,   setPhoto]   = useState(null)
  const [vOpen,   setVOpen]   = useState(null)
  
  useEffect(() => {
      if (photo || vOpen) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }

      return () => {
        document.body.style.overflow = ''
      }
    }, [photo, vOpen])

  return (
    <section className="relative py-24 px-4">
      <div className="section-wrap">
        <motion.div className="text-center mb-14"
          initial={{y:30,opacity:0}} whileInView={{y:0,opacity:1}} viewport={{once:true}} transition={{duration:.7}}>
          <p className="eyebrow mb-3">solo para ti</p>
          <h2 className="h-sect mb-2">Mensajes sorpresa</h2>
          <p className="body-md">Rompe el sello para leer 💌</p>
        </motion.div>

        <div className="max-w-2xl mx-auto space-y-4">
          {config.surpriseMessages.map((msg, i) => {
            const acc    = ACCENTS[i % 4]
            const isOpen = open === i
            return (
              <motion.div key={i}
                className="relative rounded-2xl overflow-hidden cursor-pointer"
                style={{
                  background: isOpen ? acc.glow : 'rgba(253,248,255,0.03)',
                  border: `1px solid ${isOpen ? acc.border : 'rgba(253,248,255,0.07)'}`,
                  transition:'all 0.4s ease'
                }}
                initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}}
                viewport={{once:true}} transition={{delay:i*.1}}
                onClick={() => setOpen(isOpen ? null : i)}>

                <div className="flex items-center gap-4 p-5">
                  <WaxSeal emoji={msg.emoji} colorIdx={i}/>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg font-semibold text-pearl truncate">{msg.title}</h3>
                    <p className="font-ui text-xs mt-0.5" style={{color:'rgba(253,248,255,0.3)'}}>
                      {isOpen ? 'Toca para cerrar' : 'Toca para abrir'}
                    </p>
                  </div>
                  <motion.div animate={{rotate:isOpen?180:0}} transition={{duration:.4}}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 6l4 4 4-4" stroke="rgba(253,248,255,0.3)" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </motion.div>
                </div>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}}
                      exit={{height:0,opacity:0}} transition={{duration:.45,ease:'easeInOut'}}
                      className="overflow-hidden">
                      <div className="px-6 pb-6 border-t pt-4" style={{borderColor:'rgba(253,248,255,0.05)'}}>
                        <div className="font-display -mb-6 select-none leading-none" style={{fontSize:72,color:'rgba(232,64,122,0.1)'}}>"</div>
                        <p className="font-body italic text-xl leading-relaxed relative z-10" style={{color:'rgba(253,248,255,0.75)'}}>
                          {msg.text}
                        </p>

                        {/* Foto */}
                        {msg.photo && (
                          <motion.div
                            className="mt-5 rounded-2xl overflow-hidden cursor-pointer relative"
                            initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.25}}
                            onClick={e => { e.stopPropagation(); setPhoto(msg) }}>
                            <img src={msg.photo} alt={msg.title}
                              className="w-full h-52 object-cover transition-transform duration-500 hover:scale-105"/>
                            <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                              style={{background:'rgba(0,0,0,0.2)'}}>
                              <span className="font-ui text-xs text-white px-4 py-2 rounded-full" style={{background:'rgba(0,0,0,0.5)'}}>Ver más grande</span>
                            </div>
                          </motion.div>
                        )}

                        {/* Video */}
                        {msg.video && (
                          <motion.div
                            className="mt-5"
                            initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.3}}
                            onClick={e => e.stopPropagation()}>
                            <VideoThumb src={msg.video} onClick={() => setVOpen(msg.video)} />
                          </motion.div>
                        )}

                        <div className="flex justify-end mt-4">
                          <Heart size={16} className="text-rose fill-rose"/>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Lightbox foto */}
      <AnimatePresence>
        {photo && (
          <motion.div className="modal-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={() => setPhoto(null)}>
            <motion.div className="mx-4 flex flex-col items-center"
              initial={{scale:.8}} animate={{scale:1}} exit={{scale:.8}}
              onClick={e => e.stopPropagation()}>
              <img src={photo.photo} alt={photo.title}
                className="rounded-2xl"
                style={{
                  maxWidth: '100%',
                  maxHeight: '85vh',
                  width: 'auto',
                  height: 'auto',
                  boxShadow:'0 0 80px rgba(232,64,122,0.2)'
                }}/>
              <p className="text-center font-sign text-3xl text-pearl mt-4">{photo.emoji} {photo.title}</p>
            </motion.div>
            <button onClick={() => setPhoto(null)} className="absolute top-5 right-5 btn-icon"><X size={18}/></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal video */}
      <AnimatePresence>
        {vOpen && (
          <motion.div className="modal-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={() => setVOpen(null)}>
            <motion.div className="w-full max-w-4xl mx-4"
              initial={{scale:.9}} animate={{scale:1}} exit={{scale:.9}}
              onClick={e => e.stopPropagation()}>
              <div className="aspect-video rounded-2xl overflow-hidden bg-black">
                <video className="w-full h-full" controls autoPlay playsInline preload="metadata" controlsList="nodownload">
                  <source src={vOpen} type="video/mp4" />
                </video>
              </div>
            </motion.div>
            <button onClick={() => setVOpen(null)} className="absolute top-5 right-5 btn-icon"><X size={18}/></button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
