import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { config } from '../config'

function DrawHeart() {
  return (
    <svg viewBox="0 0 100 90" className="w-40 h-36 md:w-52 md:h-48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.path
        d="M50 80 C50 80 10 55 10 30 C10 15 20 8 35 8 C42 8 48 12 50 16 C52 12 58 8 65 8 C80 8 90 15 90 30 C90 55 50 80 50 80Z"
        fill="rgba(232,64,122,0.10)"
        initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.5}}
      />
      <motion.path
        d="M50 80 C50 80 10 55 10 30 C10 15 20 8 35 8 C42 8 48 12 50 16 C52 12 58 8 65 8 C80 8 90 15 90 30 C90 55 50 80 50 80Z"
        stroke="url(#hg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{strokeDasharray:800, strokeDashoffset:800}}
        animate={{strokeDashoffset:0}}
        transition={{duration:2.2, ease:'easeInOut', delay:.3}}
      />
      <motion.path
        d="M50 72 C50 72 18 52 18 32 C18 20 26 14 36 14 C43 14 48 18 50 21"
        stroke="rgba(240,192,96,0.4)" strokeWidth="1" strokeLinecap="round"
        style={{strokeDasharray:300, strokeDashoffset:300}}
        animate={{strokeDashoffset:0}}
        transition={{duration:1.8, ease:'easeInOut', delay:1.2}}
      />
      <defs>
        <linearGradient id="hg" x1="10" y1="8" x2="90" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F0C060"/>
          <stop offset="50%" stopColor="#E8407A"/>
          <stop offset="100%" stopColor="#9B40E8"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function HeroCover({ onEnter }) {
  const [clicked, setClicked] = useState(false)
  const [stars,   setStars]   = useState([])

  useEffect(() => {
    setStars(Array.from({ length: 55 }, (_, i) => ({
      id: i,
      x:  Math.random() * 100,
      y:  Math.random() * 60,   // only top 60% — below is sunset
      s:  0.8 + Math.random() * 2,
      d:  2 + Math.random() * 4,
      delay: Math.random() * 3,
    })))
  }, [])

  const handleEnter = () => {
    setClicked(true)
    setTimeout(onEnter, 900)
  }

  return (
    <AnimatePresence>
      {!clicked && (
        <motion.section key="cover"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
          style={{
            background: 'linear-gradient(175deg, #0D0517 0%, #1A0A2E 20%, #2D0E3F 35%, #4A1535 48%, #7B1F3A 58%, #C23B2A 70%, #E86B24 80%, #F5A445 90%, #FAD27A 100%)'
          }}
          exit={{opacity:0, scale:1.05}}
          transition={{duration:.9, ease:'easeInOut'}}>

          {/* Stars */}
          {stars.map(s => (
            <div key={s.id} className="absolute rounded-full bg-white"
              style={{
                left:`${s.x}%`, top:`${s.y}%`,
                width:s.s, height:s.s,
                opacity: 0.1 + Math.random()*.5,
                animation:`twinkle ${s.d}s ease-in-out ${s.delay}s infinite`
              }}/>
          ))}

          {/* Sunset horizon glow from below */}
          <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none"
            style={{background:'radial-gradient(ellipse 120% 80% at 50% 100%, rgba(240,140,60,0.35) 0%, rgba(220,80,40,0.15) 40%, transparent 70%)'}}/>

          {/* SVG hills silhouette */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{height:120}}>
            <svg viewBox="0 0 1440 120" preserveAspectRatio="none" style={{width:'100%',height:'100%'}}>
              <path d="M0,75 C200,30 400,100 650,55 C900,10 1100,85 1300,45 C1380,25 1420,65 1440,55 L1440,120 L0,120 Z"
                fill="rgba(15,6,30,0.55)"/>
              <path d="M0,100 C150,65 350,115 550,85 C750,55 950,108 1150,78 C1310,55 1400,95 1440,88 L1440,120 L0,120 Z"
                fill="rgba(8,4,18,0.85)"/>
            </svg>
          </div>

          {/* Orbit rings */}
          {[340,240,160].map((r,i) => (
            <motion.div key={i} className="absolute rounded-full"
              style={{width:r, height:r, border:`1px solid rgba(232,64,122,${0.06+i*.03})`}}
              animate={{rotate: i%2===0 ? 360 : -360}}
              transition={{duration:25+i*8, repeat:Infinity, ease:'linear'}}/>
          ))}

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-5 px-8 text-center">
            <motion.div className="animate-float"
              initial={{scale:0,opacity:0}} animate={{scale:1,opacity:1}}
              transition={{delay:.2, type:'spring', stiffness:180}}>
              <DrawHeart/>
            </motion.div>

            <motion.h1 className="font-sign text-6xl md:text-8xl text-pearl leading-none"
              initial={{y:30,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:.8,duration:.8}}>
              {config.yourName}
              <span className="mx-2 inline-block animate-heartbeat" style={{color:'#E8407A'}}>&</span>
              {config.partnerName}
            </motion.h1>

            <motion.p
              className="font-body italic text-lg md:text-xl max-w-sm leading-relaxed whitespace-pre-line"
              style={{color:'rgba(253,248,255,0.6)'}}
              initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:1.1,duration:.8}}>
              {config.heroTagline}
            </motion.p>

            <motion.div className="w-48 grad-line"
              initial={{scaleX:0}} animate={{scaleX:1}} transition={{delay:1.4,duration:.7}}/>

            <motion.button className="btn-primary text-base mt-1"
              onClick={handleEnter}
              initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:1.6,duration:.6}}
              whileHover={{scale:1.05}} whileTap={{scale:.96}}>
              <span>Abrir nuestra historia</span>
              <span className="text-xl">💌</span>
            </motion.button>
          </div>

          <style>{`
            @keyframes twinkle{0%,100%{opacity:.1;transform:scale(.7)}50%{opacity:.8;transform:scale(1.4)}}
          `}</style>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
