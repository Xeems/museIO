'use client'
import { useAudioLoader } from '@/hooks/player/useAudioLoader'
import { usePlayerStore } from '@/store/playerStore'
import { RefObject, useEffect, useLayoutEffect, useRef } from 'react'
import { useShallow } from 'zustand/shallow'

export default function GlobalAudio() {
    const audioRef = useRef<HTMLAudioElement>(null)

    const { track, setAudioRef, handleEnded } = usePlayerStore(
        useShallow((s) => ({
            track: s.currentTrack,
            setAudioRef: s.setAudioRef,
            handleEnded: s.handleTrackEnded,
        })),
    )

    const { bufferedPercent } = useAudioLoader(track, audioRef)

    const isConnected = useRef(false)

    useLayoutEffect(() => {
        const audio = audioRef.current
        if (!audio) return
        setAudioRef(audioRef as RefObject<HTMLAudioElement>)
    })

    useEffect(() => {
        usePlayerStore.setState({
            currentTrackBufferedPercent: bufferedPercent,
        })
    }, [bufferedPercent])

    const handleTimeUpdate = () => {
        const audio = audioRef.current
        if (!audio) return
        usePlayerStore.setState({ currentTrackTime: audio.currentTime })
    }

    //create AnalyserNode and saves it in store for visualisation
    const handleAudioInit = () => {
        if (isConnected.current || !audioRef.current) return

        const AudioContextClass = window.AudioContext
        const audioCtx = new AudioContextClass()

        const source = audioCtx.createMediaElementSource(audioRef.current)
        const audioAnalyser = audioCtx.createAnalyser()
        audioAnalyser.fftSize = 512
        audioAnalyser.smoothingTimeConstant = 0.05

        const gainNode = audioCtx.createGain()

        source.connect(audioAnalyser)
        source.connect(gainNode)

        gainNode.connect(audioCtx.destination)

        usePlayerStore.setState({ analyser: audioAnalyser, gainNode: gainNode })
        isConnected.current = true
    }

    return (
        <audio
            ref={audioRef}
            onPlay={handleAudioInit}
            crossOrigin="anonymous"
            onEnded={handleEnded}
            onTimeUpdate={handleTimeUpdate}
        />
    )
}
