import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, X, Image, Heart } from 'lucide-react'
import { config } from '../config'

// ── Media inside a card ───────────────────────────────────────────────────────
function VideoThumb({ src, onClick }) {
  return (
    <div className="relative cursor-pointer w-full h-full" onClick={onClick}>
      <video
        src={src}
        className="w-full h-full object-cover"
        preload="metadata"
        muted
        playsInline
        onLoadedMetadata={e => { e.target.currentTime = 1 }}
      />
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
        <div className="w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(232,64,122,0.85)', boxShadow: '0 0 24px rgba(232,64,122,0.5)' }}>
          <Play size={16} fill="white" className="text-white ml-0.5" />
        </div>
      </div>
    </div>
  )
}

function MediaBlock({ item }) {
  const [vOpen, setVOpen] = useState(null)
  const [pOpen, setPOpen] = useState(null)

  const photos = item.photos || (item.photo ? [item.photo] : [])
  const videos = item.videos || (item.video ? [item.video] : [])

  return (
    <>
      <div className="mt-4 rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(253,248,255,0.09)' }}>

        {/* Photos only */}
        {photos.length > 0 && videos.length === 0 && (
          <div className={`grid gap-1 ${photos.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {photos.map((img, i) => (
              <div
                key={i}
                className="relative cursor-pointer group"
                style={{ height: 160 }}
                onClick={() => setPOpen(i)}
              >
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {/* Videos only OR mixed */}
        {videos.length > 0 && (
          <div className={`grid gap-1 ${photos.length + videos.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>

            {photos.map((img, i) => (
              <div
                key={`img-${i}`}
                className="relative cursor-pointer group overflow-hidden"
                style={{ height: 140 }}
                onClick={() => setPOpen(i)}
              >
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
            ))}

            {videos.map((v, i) => (
              <div key={`vid-${i}`} style={{ height: 140 }}>
                <VideoThumb
                  src={v.url}
                  onClick={() => setVOpen(v.url)}
                />
              </div>
            ))}

          </div>
        )}
      </div>

      {/* Photo lightbox */}
      <AnimatePresence>
        {pOpen !== null && photos.length > 0 && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setPOpen(null)}
          >
            <motion.img
              src={photos[pOpen]}
              alt={item.title}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            />
            <button onClick={() => setPOpen(null)} className="absolute top-4 right-4 btn-icon">
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video modal */}
      <AnimatePresence>
        {vOpen && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setVOpen(null)}
          >
            <motion.div className="w-full max-w-4xl"
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}>
              <div className="aspect-video rounded-2xl overflow-hidden bg-black">
                <video className="w-full h-full" controls autoPlay playsInline preload="metadata" controlsList="nodownload">
                  <source src={vOpen} type="video/mp4" />
                </video>
              </div>
            </motion.div>
            <button onClick={() => setVOpen(null)} className="absolute top-4 right-4 btn-icon">
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ── Year separator badge ──────────────────────────────────────────────────────
function YearBadge({ year }) {
  return (
    <motion.div className="flex items-center justify-center py-6"
      initial={{ opacity: 0, scale: .85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: .5 }}>
      <div className="px-7 py-2.5 rounded-full font-display font-bold"
        style={{
          fontSize: 'clamp(.9rem,2vw,1.1rem)',
          background: 'linear-gradient(135deg,rgba(232,64,122,0.2),rgba(240,192,96,0.14))',
          border: '1px solid rgba(232,64,122,0.35)',
          color: 'rgba(253,248,255,0.9)',
          boxShadow: '0 0 28px rgba(232,64,122,0.18)',
        }}>
        ✦ {year} ✦
      </div>
    </motion.div>
  )
}

// ── Mobile card (single column) ───────────────────────────────────────────────
function MobileCard({ item, index, isLast }) {
  return (
    <div className="flex gap-3 relative">
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: 36 }}>
        <span className="text-xl leading-none mb-2 select-none">{item.emoji}</span>
        <motion.div
          style={{
            width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
            border: '2px solid #E8407A', background: '#08060F',
            boxShadow: '0 0 0 3px rgba(232,64,122,0.15), 0 0 16px rgba(232,64,122,0.45)',
          }}
          initial={{ scale: 0 }} whileInView={{ scale: 1 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ type: 'spring', stiffness: 300, delay: 0.1 + index * 0.03 }}
        />
        {!isLast && (
          <div style={{
            flex: 1, width: 1, marginTop: 6, minHeight: 40,
            background: 'linear-gradient(to bottom, rgba(232,64,122,0.4), rgba(232,64,122,0.08))',
          }} />
        )}
      </div>

      <div className="flex-1 pb-7">
        <motion.div className="glass p-4"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: .5, delay: 0.05 }}>
          <span className="inline-block font-ui uppercase mb-2 border rounded-full px-2.5 py-0.5"
            style={{ fontSize: 9, letterSpacing: '.2em', color: 'rgba(240,192,96,0.7)', borderColor: 'rgba(240,192,96,0.25)' }}>
            {item.date}
          </span>
          <h3 className="font-display font-bold text-pearl mb-1.5"
            style={{ fontSize: 'clamp(.95rem,3vw,1.1rem)' }}>
            {item.title}
          </h3>
          <p className="font-body leading-relaxed"
            style={{ fontSize: 'clamp(.88rem,2.4vw,.95rem)', color: 'rgba(253,248,255,0.55)' }}>
            {item.desc}
          </p>
          <MediaBlock item={item} />
        </motion.div>
      </div>
    </div>
  )
}

// ── Desktop card (alternating sides) ─────────────────────────────────────────
function DesktopCard({ item, index }) {
  const isLeft = item.side === 'left'

  return (
    <motion.div
      className={`relative flex items-start ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
      initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: .65, ease: [.25, .46, .45, .94] }}>

      <div style={{ width: '44%' }}>
        <div className="glass p-6 relative overflow-hidden" style={{ borderRadius: 20 }}>
          <div className={`absolute top-0 bottom-0 w-px ${isLeft ? 'right-0' : 'left-0'}`}
            style={{ background: 'linear-gradient(to bottom, transparent, rgba(232,64,122,0.45), transparent)' }} />

          <span className="inline-block font-ui uppercase mb-3 border rounded-full px-3 py-1"
            style={{ fontSize: 10, letterSpacing: '.25em', color: 'rgba(240,192,96,0.7)', borderColor: 'rgba(240,192,96,0.25)' }}>
            {item.date}
          </span>
          <h3 className="font-display text-xl font-bold text-pearl mb-2">{item.title}</h3>
          <p className="font-body text-base leading-relaxed"
            style={{ color: 'rgba(253,248,255,0.57)' }}>
            {item.desc}
          </p>

          {(item.photo || item.photos || item.video || item.videos) && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {(item.photo || item.photos) && (
                <span className="flex items-center gap-1 border rounded-full px-2 py-0.5"
                  style={{ fontSize: 10, color: 'rgba(240,192,96,0.55)', borderColor: 'rgba(240,192,96,0.2)' }}>
                  <Image size={10} /> foto
                </span>
              )}
              {(item.video || item.videos) && (
                <span className="flex items-center gap-1 border rounded-full px-2 py-0.5"
                  style={{ fontSize: 10, color: 'rgba(232,64,122,0.55)', borderColor: 'rgba(232,64,122,0.2)' }}>
                  <Play size={10} /> video
                </span>
              )}
            </div>
          )}
          <MediaBlock item={item} />
        </div>
      </div>

      <div style={{ width: '12%' }} className="flex flex-col items-center pt-4 flex-shrink-0">
        <span className="text-2xl mb-2 select-none leading-none">{item.emoji}</span>
        <motion.div
          style={{
            width: 16, height: 16, borderRadius: '50%',
            border: '2px solid #E8407A', background: '#08060F',
            boxShadow: '0 0 0 4px rgba(232,64,122,0.13), 0 0 20px rgba(232,64,122,0.5)',
          }}
          initial={{ scale: 0 }} whileInView={{ scale: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ type: 'spring', stiffness: 280, delay: .18 + index * .03 }}
        />
      </div>

      <div style={{ width: '44%' }} />
    </motion.div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function Timeline() {
  const [activeYear, setActiveYear] = useState('ALL')

  const rawTimeline = config.timeline

  const timeline =
    activeYear === 'ALL'
      ? rawTimeline
      : rawTimeline.filter(item => item.date.includes(activeYear))

  const years = [
    'ALL',
    ...new Set(
      rawTimeline
        .map(i => i.date.match(/\d{4}/)?.[0])
        .filter(Boolean)
    )
  ]

  const desktopList = []
  let lastYear = null
  timeline.forEach((item, i) => {
    const m = item.date.match(/\d{4}/)
    const yr = m ? m[0] : null
    if (yr && yr !== lastYear) {
      desktopList.push({ type: 'year', year: yr, key: `yr-${yr}` })
      lastYear = yr
    }
    desktopList.push({ type: 'item', item, index: i, key: `item-${i}` })
  })

  return (
    <section className="relative" style={{ padding: 'clamp(4rem,8vw,7rem) 0' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(42,21,72,0.45) 0%, transparent 70%)' }} />

      <div className="section-wrap">
        <motion.div className="text-center mb-14 md:mb-20"
          initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }} transition={{ duration: .7 }}>
          <p className="eyebrow mb-4">nuestra historia</p>
          <h2 className="h-sect mb-3">Línea del tiempo</h2>
          <p className="body-md">Tres años de momentos que nos hicieron nosotros</p>

          <div className="flex flex-wrap justify-center gap-6 md:gap-10 mt-8">
            {[
              { n: timeline.length,                                                    label: 'momentos' },
              { n: timeline.filter(x => x.photo || x.photos).length,                  label: 'con foto' },
              { n: timeline.filter(x => x.video || x.videos).length,                  label: 'con video' },
              { n: 3,                                                                  label: 'años juntos' },
            ].map(({ n, label }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className="font-display font-black text-pearl"
                  style={{ fontSize: 'clamp(1.8rem,4vw,2.5rem)', textShadow: '0 0 30px rgba(232,64,122,0.4)' }}>
                  {n}
                </span>
                <span className="eyebrow">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="flex justify-center gap-3 mb-10 flex-wrap">
          {years.map(year => {
            const active = activeYear === year
            return (
              <motion.button
                key={year}
                onClick={() => setActiveYear(year)}
                className="px-5 py-2 rounded-full text-sm font-ui"
                style={{
                  background: active ? 'rgba(232,64,122,0.18)' : 'rgba(255,255,255,0.04)',
                  border: active ? '1px solid rgba(232,64,122,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  color: active ? '#fff' : 'rgba(255,255,255,0.4)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {year}
              </motion.button>
            )
          })}
        </div>

        {/* MOBILE */}
        <div className="block md:hidden">
          {timeline.map((item, i) => (
            <MobileCard key={i} item={item} index={i} isLast={i === timeline.length - 1} />
          ))}
        </div>

        {/* DESKTOP */}
        <div className="hidden md:block relative max-w-4xl mx-auto">
          <div className="absolute top-0 bottom-0 w-px pointer-events-none"
            style={{
              left: '50%', transform: 'translateX(-50%)',
              background: 'linear-gradient(to bottom, transparent, rgba(232,64,122,0.5) 5%, rgba(240,192,96,0.3) 50%, rgba(232,64,122,0.3) 95%, transparent)',
            }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            {desktopList.map(entry =>
              entry.type === 'year'
                ? <YearBadge key={entry.key} year={entry.year} />
                : <DesktopCard key={entry.key} item={entry.item} index={entry.index} />
            )}
          </div>
        </div>

        <motion.div className="flex flex-col items-center mt-16 gap-3"
          initial={{ opacity: 0, scale: .6 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} transition={{ type: 'spring', delay: .2 }}>
          <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, rgba(232,64,122,0.5), transparent)' }} />
          <Heart size={28} fill="#E8407A"
            style={{ color: '#E8407A', filter: 'drop-shadow(0 0 14px rgba(232,64,122,0.8))' }}
            className="animate-heartbeat" />
          <p className="font-sign text-center"
            style={{ fontSize: 'clamp(1.3rem,4vw,1.8rem)', color: 'rgba(253,248,255,0.5)' }}>
            y lo que falta por vivir...
          </p>
        </motion.div>
      </div>
    </section>
  )
}
