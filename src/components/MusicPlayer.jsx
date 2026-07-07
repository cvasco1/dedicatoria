import React, { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music2,
  SkipBack
} from 'lucide-react'
import { config } from '../config'

function WaveBars({ playing }) {
  const bars = [4, 7, 5, 9, 6, 8, 4, 7, 5, 6]

  return (
    <div className="flex items-end gap-0.5 h-5">
      {bars.map((height, index) => (
        <motion.div
          key={index}
          className="w-0.5 rounded-full"
          style={{ background: '#E8407A' }}
          animate={
            playing
              ? {
                  height: [3, height, 3],
                  opacity: [0.5, 1, 0.5]
                }
              : {
                  height: 3,
                  opacity: 0.3
                }
          }
          transition={{
            duration: 0.7 + index * 0.08,
            repeat: Infinity,
            delay: index * 0.07,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  )
}

export default function MusicPlayer() {
  const audioRef = useRef(null)

  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [vol, setVol] = useState(0.5)
  const [prog, setProg] = useState(0)
  const [loading, setLoading] = useState(false)
  const [audioError, setAudioError] = useState(false)

  useEffect(() => {
    const audio = audioRef.current

    if (audio) {
      audio.volume = vol
    }
  }, [vol])

  useEffect(() => {
    const audio = audioRef.current

    if (audio) {
      audio.muted = muted
    }
  }, [muted])

  const toggle = async () => {
    const audio = audioRef.current

    if (!audio) return

    setAudioError(false)

    if (!audio.paused) {
      audio.pause()
      return
    }

    try {
      setLoading(true)

      // Se ejecuta directamente desde el toque del usuario.
      await audio.play()
    } catch (error) {
      console.error('No se pudo reproducir el audio:', error)

      setPlaying(false)
      setLoading(false)
      setAudioError(true)
    }
  }

  const onTimeUpdate = () => {
    const audio = audioRef.current

    if (!audio || !Number.isFinite(audio.duration)) return

    const percentage =
      (audio.currentTime / audio.duration) * 100

    setProg(percentage)
  }

  const onSeek = (event) => {
    const audio = audioRef.current

    if (!audio || !Number.isFinite(audio.duration)) return

    const rect = event.currentTarget.getBoundingClientRect()
    const position = event.clientX - rect.left
    const percentage = Math.min(
      Math.max(position / rect.width, 0),
      1
    )

    audio.currentTime = percentage * audio.duration
  }

  const restart = () => {
    const audio = audioRef.current

    if (!audio) return

    audio.currentTime = 0
  }

  const handleAudioError = () => {
    const audio = audioRef.current

    console.error(
      'Error cargando el audio:',
      audio?.error,
      config.musicSrc
    )

    setLoading(false)
    setPlaying(false)
    setAudioError(true)
  }

  return (
    <>
      <audio
        ref={audioRef}
        loop
        preload="metadata"
        onTimeUpdate={onTimeUpdate}
        onPlay={() => {
          setPlaying(true)
          setLoading(false)
        }}
        onPlaying={() => {
          setPlaying(true)
          setLoading(false)
        }}
        onPause={() => {
          setPlaying(false)
          setLoading(false)
        }}
        onWaiting={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        onError={handleAudioError}
      >
        <source
          src={config.musicSrc}
          type="audio/mpeg"
        />

        Tu navegador no permite reproducir este audio.
      </audio>

      <motion.div
        className="music-bar"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          delay: 1.8,
          duration: 0.6,
          type: 'spring'
        }}
      >
        <div className="flex items-center gap-2 flex-shrink-0">
          <motion.div
            animate={playing ? { rotate: 360 } : { rotate: 0 }}
            transition={
              playing
                ? {
                    duration: 8,
                    repeat: Infinity,
                    ease: 'linear'
                  }
                : {
                    duration: 0.3
                  }
            }
          >
            <Music2
              size={16}
              style={{ color: '#E8407A' }}
            />
          </motion.div>

          <WaveBars playing={playing} />
        </div>

        <div className="flex-1 min-w-0 hidden sm:block">
          <p
            className="font-ui text-xs truncate"
            style={{
              color: audioError
                ? '#ff8a8a'
                : 'rgba(253,248,255,0.7)'
            }}
          >
            {audioError
              ? 'No se pudo cargar la canción'
              : config.musicTitle}
          </p>

          <p
            className="font-ui truncate"
            style={{
              fontSize: 10,
              color: 'rgba(240,192,96,0.4)'
            }}
          >
            {config.musicArtist}
          </p>
        </div>

        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div
            className="prog-track flex-1 cursor-pointer"
            onClick={onSeek}
          >
            <div
              className="prog-fill"
              style={{ width: `${prog}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={restart}
            className="btn-icon w-7 h-7"
            aria-label="Reiniciar canción"
          >
            <SkipBack
              size={13}
              style={{
                color: 'rgba(253,248,255,0.4)'
              }}
            />
          </button>

          <button
            type="button"
            onClick={() => setMuted(current => !current)}
            className="btn-icon w-7 h-7"
            aria-label={muted ? 'Activar sonido' : 'Silenciar'}
          >
            {muted ? (
              <VolumeX
                size={13}
                style={{
                  color: 'rgba(253,248,255,0.4)'
                }}
              />
            ) : (
              <Volume2
                size={13}
                style={{
                  color: 'rgba(253,248,255,0.4)'
                }}
              />
            )}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={vol}
            onChange={event =>
              setVol(Number(event.target.value))
            }
            aria-label="Volumen"
            className="w-14 hidden md:block cursor-pointer"
            style={{ accentColor: '#E8407A' }}
          />

          <motion.button
            type="button"
            onClick={toggle}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            aria-label={
              playing ? 'Pausar canción' : 'Reproducir canción'
            }
            style={{
              background:
                'linear-gradient(135deg,#E8407A,#B02D5C)',
              boxShadow:
                '0 0 20px rgba(232,64,122,0.4)',
              opacity: loading ? 0.65 : 1
            }}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.9 }}
          >
            {playing ? (
              <Pause
                size={15}
                fill="white"
                className="text-white"
              />
            ) : (
              <Play
                size={15}
                fill="white"
                className="text-white ml-0.5"
              />
            )}
          </motion.button>
        </div>
      </motion.div>
    </>
  )
}