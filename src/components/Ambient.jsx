import React, { useEffect, useMemo } from 'react'

// ── Custom heart cursor ───────────────────────────────────────────────────
export function Cursor() {
  useEffect(() => {
    const cur  = document.getElementById('cur')
    const ring = document.getElementById('cur-ring')
    if (!cur || !ring) return
    let rx = 0, ry = 0
    const onMove = (e) => { cur.style.left = e.clientX+'px'; cur.style.top = e.clientY+'px' }
    const onDown = () => { cur.style.transform='translate(-50%,-50%) scale(0.7)' }
    const onUp   = () => { cur.style.transform='translate(-50%,-50%) scale(1)' }
    let raf
    const loop = () => {
      const x = parseFloat(cur.style.left)||0, y = parseFloat(cur.style.top)||0
      rx += (x-rx)*.10; ry += (y-ry)*.10
      ring.style.left = rx+'px'; ring.style.top = ry+'px'
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup',   onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup',   onUp)
      cancelAnimationFrame(raf)
    }
  }, [])
  return (
    <>
      <div id="cur"  aria-hidden="true">❤️</div>
      <div id="cur-ring" aria-hidden="true"/>
    </>
  )
}

// ── Falling petals ────────────────────────────────────────────────────────
const EMOJIS = ['🌸','🌹','💕','✨','💫','🌷','💗','🍂','⭐','💞','🧡','✦']

export function PetalRain({ count = 22 }) {
  const petals = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      emoji:    EMOJIS[i % EMOJIS.length],
      left:     `${(i/count)*100 + (Math.random()-0.5)*4}%`,
      delay:    `${Math.random()*14}s`,
      duration: `${9+Math.random()*12}s`,
      size:     `${0.7+Math.random()*0.9}rem`,
      opacity:  0.2+Math.random()*0.4,
    })), [count])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {petals.map(p => (
        <span key={p.id} className="petal select-none"
          style={{ left:p.left, animationDelay:p.delay, animationDuration:p.duration, fontSize:p.size, opacity:p.opacity }}>
          {p.emoji}
        </span>
      ))}
    </div>
  )
}

// ── Sunset background layers ──────────────────────────────────────────────
export function SunsetBackground() {
  return (
    <>
      {/* Animated gradient sky */}
      <div className="sunset-bg" aria-hidden="true"/>
      {/* Warm horizon glow */}
      <div className="sunset-horizon" aria-hidden="true"/>
      {/* Dark top for stars */}
      <div className="sunset-stars" aria-hidden="true"/>
      {/* SVG silhouette hills */}
      <div className="sunset-hills" aria-hidden="true">
        <svg viewBox="0 0 1440 140" preserveAspectRatio="none"
          style={{position:'absolute',bottom:0,width:'100%',height:'100%'}}>
          {/* Back hills */}
          <path d="M0,90 C200,40 380,120 600,70 C820,20 1000,100 1200,60 C1350,30 1420,80 1440,70 L1440,140 L0,140 Z"
            fill="rgba(15,6,30,0.6)"/>
          {/* Front hills */}
          <path d="M0,120 C100,80 280,140 480,100 C680,60 880,130 1100,95 C1280,68 1380,115 1440,105 L1440,140 L0,140 Z"
            fill="rgba(8,4,18,0.85)"/>
        </svg>
      </div>
      {/* Noise texture */}
      <div className="noise-overlay" aria-hidden="true"/>
    </>
  )
}
