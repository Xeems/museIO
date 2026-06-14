'use client'
import { useAudioLoader } from '@/hooks/player/useAudioLoader'
import { usePlayerStore } from '@/store/playerStore'
import React, { RefObject, useEffect, useLayoutEffect, useRef } from 'react'

export default function GlobalAudio() {
    const audioRef = useRef<HTMLAudioElement>(null)
    const track = usePlayerStore((s) => s.currentTrack)
    const setAudioRef = usePlayerStore((s) => s.setAudioRef)

    const { bufferedPercent } = useAudioLoader(track, audioRef)

    const isConnected = useRef(false)

    useLayoutEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        setAudioRef(audioRef as RefObject<HTMLAudioElement>)

        const handleTimeUpdate = () =>
            usePlayerStore.setState({ currentTrackTime: audio.currentTime })

        audio.addEventListener('timeupdate', handleTimeUpdate)

        return () => audio.removeEventListener('timeupdate', handleTimeUpdate)
    })

    useEffect(() => {
        usePlayerStore.setState({
            currentTrackBufferedPercent: bufferedPercent,
        })
    }, [bufferedPercent])

    const handleAudioInit = () => {
        // Если уже подключились к этому тегу <audio> — выходим, чтобы не было ошибки!
        if (isConnected.current || !audioRef.current) return

        const AudioContextClass = window.AudioContext
        const audioCtx = new AudioContextClass()

        const source = audioCtx.createMediaElementSource(audioRef.current)
        const audioAnalyser = audioCtx.createAnalyser()
        audioAnalyser.fftSize = 512
        audioAnalyser.smoothingTimeConstant = 0.05 // Ваша плавная настройка!

        source.connect(audioAnalyser)
        audioAnalyser.connect(audioCtx.destination)

        // Закидываем анализатор в Zustand ОДИН раз для всего приложения
        usePlayerStore.setState({ analyser: audioAnalyser })
        isConnected.current = true
    }

    return (
        <audio
            ref={audioRef}
            onPlay={handleAudioInit}
            crossOrigin="anonymous"
        />
    )
}
