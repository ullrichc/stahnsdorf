'use client'
import { useEffect, useState, useRef } from 'react'
import styles from './AudioPlayer.module.css'
import { resolveAudioUrl } from '@/lib/app-path'
import { useLocale } from '@/lib/useLocale'
import { useDictionary } from '@/lib/ui-dictionary'

type Props = {
  src: string | undefined
}

export default function AudioPlayer({ src }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState('0:00')
  const [duration, setDuration] = useState('0:00')
  const [error, setError] = useState(false)
  const locale = useLocale()
  const dict = useDictionary(locale)

  useEffect(() => {
    const audio = audioRef.current
    return () => {
      audio?.pause()
    }
  }, [src])

  if (!src) {
    return null
  }

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${min}:${sec.toString().padStart(2, '0')}`
  }

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
    } else {
      setError(false)
      try {
        await audio.play()
      } catch {
        setPlaying(false)
        setError(true)
      }
    }
  }

  const handleTimeUpdate = () => {
    const audio = audioRef.current
    if (!audio) return
    setCurrentTime(formatTime(audio.currentTime))
    setProgress((audio.currentTime / audio.duration) * 100 || 0)
  }

  const handleLoadedMetadata = () => {
    const audio = audioRef.current
    if (!audio) return
    setDuration(formatTime(audio.duration))
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return
    const pct = Number(e.currentTarget.value) / 100
    audio.currentTime = pct * audio.duration
  }

  return (
    <div className={styles.player}>
      <audio
        ref={audioRef}
        src={resolveAudioUrl(src)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => { setPlaying(false); setError(true) }}
      />
      <button
        className={styles.playBtn}
        onClick={togglePlay}
        aria-label={playing ? dict.audioPause : dict.audioPlay}
      >
        {playing ? '\u23F8' : '\u25B6\uFE0F'}
      </button>
      <input
        className={styles.progress}
        type="range"
        min="0"
        max="100"
        step="0.1"
        value={progress}
        onChange={handleSeek}
        aria-label={dict.audioSeek}
      />
      <span className={styles.time}>{currentTime} / {duration}</span>
      {error && <span className={styles.error} role="status">{dict.audioError}</span>}
    </div>
  )
}
