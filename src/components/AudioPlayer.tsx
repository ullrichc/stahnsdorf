'use client'
import { useState, useRef } from 'react'
import styles from './AudioPlayer.module.css'

type Props = {
  src: string | undefined
}

export default function AudioPlayer({ src }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState('0:00')
  const [duration, setDuration] = useState('0:00')

  if (!src) {
    return null
  }

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${min}:${sec.toString().padStart(2, '0')}`
  }

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
    } else {
      audio.play()
    }
    setPlaying(!playing)
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

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audio.currentTime = pct * audio.duration
  }

  return (
    <div className={styles.player}>
      <audio
        ref={audioRef}
        src={`/media/audio/${src}`}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setPlaying(false)}
      />
      <button className={styles.playBtn} onClick={togglePlay}>
        {playing ? '\u23F8' : '\u25B6\uFE0F'}
      </button>
      <div className={styles.progress} onClick={handleSeek}>
        <div className={styles.bar} style={{ width: `${progress}%` }} />
      </div>
      <span className={styles.time}>{currentTime} / {duration}</span>
    </div>
  )
}
