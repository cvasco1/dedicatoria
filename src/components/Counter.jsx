import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { config } from '../config'

function calcTime(start) {
  const diff = Date.now() - start
  const ts   = Math.floor(diff / 1000)
  const s    = ts % 60
  const tm   = Math.floor(ts / 60)
  const m    = tm % 60
  const th   = Math.floor(tm / 60)
  const h    = th % 24
  const td   = Math.floor(th / 24)
  const y    = Math.floor(td / 365.25)
  const mo   = Math.floor((td % 365.25) / 30.44)
  const d    = Math.floor((td % 365.25) % 30.44)
  return { y, mo, d, h, m, s, td }
}

function FlipDigit({ value, label }) {
  const [prev, setPrev] = useState(value)
  const [flip, setFlip] = useState(false)
  useEffect(() => {
    if (value !== prev) {
      setFlip(true)
      const t = setTimeout(() => { setPrev(value); setFlip(false) }, 300)
      return () => clearTimeout(t)
    }
  }, [value, prev])

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative glass-sm flex items-center justify-center overflow-hidden"
        style={{minWidth:72, paddingTop:20, paddingBottom:20, paddingLeft:16, paddingRight:16,
          boxShadow:'0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)'}}>
        <div className="absolute left-0 right-0" style={{top:'50%',height:1,background:'rgba(232,64,122,0.18)'}}/>
        <motion.span
          key={value}
          className="font-display font-black tabular-nums text-pearl"
          style={{fontSize:'clamp(2rem,5vw,3.5rem)', textShadow:'0 0 40px rgba(232,64,122,0.4)'}}
          initial={{y: flip ? -30 : 0, opacity: flip ? 0 : 1}}
          animate={{y:0, opacity:1}}
          transition={{duration:.3, ease:'easeOut'}}>
          {String(value).padStart(2,'0')}
        </motion.span>
      </div>
      <span className="font-ui uppercase text-pearl/35" style={{fontSize:9,letterSpacing:'0.3em'}}>{label}</span>
    </div>
  )
}

const UNITS = [{key:'y',label:'Años'},{key:'mo',label:'Meses'},{key:'d',label:'Días'},{key:'h',label:'Horas'},{key:'m',label:'Min'},{key:'s',label:'Seg'}]

export default function Counter() {
  const [t, setT] = useState(() => calcTime(config.startDate.getTime()))
  useEffect(() => {
    const id = setInterval(() => setT(calcTime(config.startDate.getTime())), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="relative py-28 px-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{background:'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(42,21,72,0.45) 0%, transparent 75%)'}}/>
      <div className="relative max-w-5xl mx-auto text-center">
        <motion.div initial={{y:30,opacity:0}} whileInView={{y:0,opacity:1}} viewport={{once:true}} transition={{duration:.7}}>
          <p className="eyebrow mb-4">llevamos juntos exactamente</p>
          <h2 className="h-sign mb-2">{t.td.toLocaleString()} días</h2>
          <p className="body-lg">de pura magia</p>
        </motion.div>
        <div className="grad-line w-56 mx-auto my-12"/>
        <motion.div className="flex flex-wrap justify-center gap-4 md:gap-5"
          initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:.8,delay:.2}}>
          {UNITS.map(({key,label},i) => (
            <motion.div key={key}
              initial={{scale:.8,opacity:0}} whileInView={{scale:1,opacity:1}}
              viewport={{once:true}} transition={{delay:i*.07}}>
              <FlipDigit value={t[key]} label={label}/>
            </motion.div>
          ))}
        </motion.div>
        <motion.p className="font-body italic text-pearl/25 text-base mt-16"
          initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} transition={{delay:.7}}>
          "El tiempo pasa, pero lo que siento por ti solo crece."
        </motion.p>
      </div>
    </section>
  )
}
