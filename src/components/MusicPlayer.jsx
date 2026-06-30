import React, { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, Volume2, VolumeX, Music2, SkipBack } from 'lucide-react'
import { config } from '../config'

function WaveBars({ playing }) {
  const bars = [4,7,5,9,6,8,4,7,5,6]
  return (
    <div className="flex items-end gap-0.5 h-5">
      {bars.map((h,i) => (
        <motion.div key={i} className="w-0.5 rounded-full" style={{background:'#E8407A'}}
          animate={playing ? {height:[3,h,3],opacity:[0.5,1,0.5]} : {height:3,opacity:0.3}}
          transition={{duration:.7+i*.08, repeat:Infinity, delay:i*.07, ease:'easeInOut'}}/>
      ))}
    </div>
  )
}

export default function MusicPlayer() {
  const audioRef  = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [muted,   setMuted]   = useState(false)
  const [vol,     setVol]     = useState(0.5)
  const [prog,    setProg]    = useState(0)
  const [canPlay, setCanPlay] = useState(false)

  useEffect(() => { if (audioRef.current) audioRef.current.volume = vol },  [vol])
  useEffect(() => { if (audioRef.current) audioRef.current.muted  = muted }, [muted])

  const toggle = () => {
    if (!audioRef.current) return
    if (playing) { audioRef.current.pause(); setPlaying(false) }
    else audioRef.current.play().then(() => setPlaying(true)).catch(() => {})
  }

  const onTimeUpdate = () => {
    const { currentTime, duration } = audioRef.current
    if (duration) setProg((currentTime / duration) * 100)
  }

  const onSeek = (e) => {
    if (!audioRef.current?.duration) return
    const r = e.currentTarget.getBoundingClientRect()
    audioRef.current.currentTime = ((e.clientX - r.left) / r.width) * audioRef.current.duration
  }

  return (
    <>
      <audio ref={audioRef} src={config.musicSrc} loop preload="auto"
        onTimeUpdate={onTimeUpdate} onCanPlay={() => setCanPlay(true)}/>
      <motion.div className="music-bar"
        initial={{y:80,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:1.8,duration:.6,type:'spring'}}>
        <div className="flex items-center gap-2 flex-shrink-0">
          <motion.div animate={playing?{rotate:360}:{rotate:0}}
            transition={playing?{duration:8,repeat:Infinity,ease:'linear'}:{duration:.3}}>
            <Music2 size={16} style={{color:'#E8407A'}}/>
          </motion.div>
          <WaveBars playing={playing}/>
        </div>
        <div className="flex-1 min-w-0 hidden sm:block">
          <p className="font-ui text-xs truncate" style={{color:'rgba(253,248,255,0.7)'}}>{config.musicTitle}</p>
          <p className="font-ui truncate" style={{fontSize:10,color:'rgba(240,192,96,0.4)'}}>{config.musicArtist}</p>
        </div>
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div className="prog-track flex-1 cursor-pointer" onClick={onSeek}>
            <div className="prog-fill" style={{width:`${prog}%`}}/>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => { if (audioRef.current) audioRef.current.currentTime=0 }} className="btn-icon w-7 h-7">
            <SkipBack size={13} style={{color:'rgba(253,248,255,0.4)'}}/>
          </button>
          <button onClick={() => setMuted(m => !m)} className="btn-icon w-7 h-7">
            {muted ? <VolumeX size={13} style={{color:'rgba(253,248,255,0.4)'}}/> : <Volume2 size={13} style={{color:'rgba(253,248,255,0.4)'}}/>}
          </button>
          <input type="range" min="0" max="1" step="0.05" value={vol}
            onChange={e => setVol(Number(e.target.value))}
            className="w-14 hidden md:block cursor-pointer" style={{accentColor:'#E8407A'}}/>
          <motion.button onClick={toggle} disabled={!canPlay}
            className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-40"
            style={{background:'linear-gradient(135deg,#E8407A,#B02D5C)',boxShadow:'0 0 20px rgba(232,64,122,0.4)'}}
            whileHover={{scale:1.12}} whileTap={{scale:.9}}>
            {playing
              ? <Pause size={15} fill="white" className="text-white"/>
              : <Play  size={15} fill="white" className="text-white ml-0.5"/>
            }
          </motion.button>
        </div>
      </motion.div>
    </>
  )
}
