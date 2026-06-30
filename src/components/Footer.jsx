import React from 'react'
import { motion } from 'framer-motion'
import { config } from '../config'

export function SectionDivider({ emoji = '✦' }) {
  return (
    <div className="sect-divider px-8 max-w-4xl mx-auto">
      <span style={{color:'rgba(253,248,255,0.2)',fontSize:'1rem'}}>{emoji}</span>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="relative py-28 px-4 text-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{background:'radial-gradient(ellipse 60% 50% at 50% 60%, rgba(42,21,72,0.5) 0%, transparent 75%)'}}/>

      {/* Sunset glow at footer */}
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{background:'radial-gradient(ellipse 100% 80% at 50% 100%, rgba(200,100,40,0.12) 0%, transparent 70%)'}}/>

      <div className="relative max-w-xl mx-auto">
        <motion.div initial={{scale:0,opacity:0}} whileInView={{scale:1,opacity:1}}
          viewport={{once:true}} transition={{type:'spring',stiffness:180}}>
          <span className="text-7xl block mb-8 select-none animate-heartbeat"
            style={{filter:'drop-shadow(0 0 20px rgba(232,64,122,0.7))'}}>❤️</span>
        </motion.div>

        <motion.h2 className="font-sign text-6xl md:text-7xl text-pearl mb-4"
          initial={{y:20,opacity:0}} whileInView={{y:0,opacity:1}} viewport={{once:true}} transition={{delay:.2,duration:.7}}>
          {config.yourName} & {config.partnerName}
        </motion.h2>

        <motion.p className="shimmer-text font-display text-xl font-bold"
          initial={{y:20,opacity:0}} whileInView={{y:0,opacity:1}} viewport={{once:true}} transition={{delay:.4}}>
          Para siempre y un día más.
        </motion.p>

        <div className="grad-line w-40 mx-auto my-10"/>

        <motion.p className="font-ui text-xs" style={{color:'rgba(253,248,255,0.15)'}}
          initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} transition={{delay:.6}}>
          Hecho con amor · {new Date().getFullYear()}
        </motion.p>
      </div>
    </footer>
  )
}
