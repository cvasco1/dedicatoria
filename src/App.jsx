import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { Cursor, PetalRain, SunsetBackground } from './components/Ambient'
import HeroCover        from './components/HeroCover'
import Counter          from './components/Counter'
import Gallery          from './components/Gallery'
import Videos           from './components/Videos'
import Timeline         from './components/Timeline'
import SurpriseMessages from './components/SurpriseMessages'
import Pet              from './components/Pet'
import MusicPlayer      from './components/MusicPlayer'
import { Footer, SectionDivider } from './components/Footer'
import { config } from './config'

// Side navigation dots
const NAV_SECTIONS = [
  { id:'counter',  label:'Contador'  },
  { id:'gallery',  label:'Galería'   },
  { id:'videos',   label:'Videos'    },
  { id:'timeline', label:'Historia'  },
  { id:'messages', label:'Mensajes'  },
  { id:'pet',      label:'Mascotas'  },
]

function NavDots({ active }) {
  const scroll = (id) => document.getElementById(id)?.scrollIntoView({ behavior:'smooth', block:'start' })
  return (
    <div className="fixed right-5 top-1/2 -translate-y-1/2 z-40 md:flex flex-col gap-2.5 hidden">
      {NAV_SECTIONS.map(({ id, label }) => (
        <div key={id} className="group flex items-center gap-2 justify-end cursor-pointer" onClick={() => scroll(id)}>
          <span className="font-ui text-[10px] transition-all duration-200 whitespace-nowrap"
            style={{color:'rgba(253,248,255,0)',}}
            onMouseEnter={e=>e.target.style.color='rgba(253,248,255,0.5)'}
            onMouseLeave={e=>e.target.style.color='rgba(253,248,255,0)'}>
            {label}
          </span>
          <div className={`nav-dot ${active===id?'active':''}`}/>
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const [entered,   setEntered]   = useState(false)
  const [activeNav, setActiveNav] = useState('counter')
  const refs = useRef({})

  useEffect(() => {
    if (!entered) return
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActiveNav(e.target.id) }),
      { threshold: 0.4 }
    )
    Object.values(refs.current).forEach(el => { if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [entered])

  const reg = (id) => (el) => { refs.current[id] = el }

  const hasPets = (config.pets?.length > 0) || !!config.pet

  return (
    <div className="relative min-h-screen bg-ink">

      {/* ── SUNSET BACKGROUND (always visible) ── */}
      <SunsetBackground/>

      {/* ── AMBIENT ── */}
      <PetalRain count={20}/>
      <Cursor/>

      {/* ── COVER ── */}
      <HeroCover onEnter={() => setEntered(true)}/>

      {/* ── MAIN CONTENT ── */}
      <AnimatePresence>
        {entered && (
          <motion.main key="main" initial={{opacity:0}} animate={{opacity:1}} transition={{duration:1.1}}
            className="relative z-10 pb-20">

            <NavDots active={activeNav}/>

            <div ref={reg('counter')} id="counter"><Counter/></div>

            <SectionDivider emoji="📸"/>
            <div ref={reg('gallery')} id="gallery"><Gallery/></div>

            <SectionDivider emoji="🎬"/>
            <div ref={reg('videos')} id="videos"><Videos/></div>

            <SectionDivider emoji="⏰"/>
            <div ref={reg('timeline')} id="timeline"><Timeline/></div>

            <SectionDivider emoji="💌"/>
            <div ref={reg('messages')} id="messages"><SurpriseMessages/></div>

            {hasPets && (
              <>
                <SectionDivider emoji="🐾"/>
                <div ref={reg('pet')} id="pet"><Pet/></div>
              </>
            )}

            <Footer/>
          </motion.main>
        )}
      </AnimatePresence>

      {entered && <MusicPlayer/>}
    </div>
  )
}
