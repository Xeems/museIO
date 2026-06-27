'use client'
import { useAudioLoader } from '@/hooks/player/useAudioLoader'
import { usePlayerStore } from '@/store/playerStore'
import { RefObject, useEffect, useLayoutEffect, useRef } from 'react'
import { useShallow } from 'zustand/shallow'

export default function GlobalAudio() {
    const audioRef = useRef<HTMLAudioElement>(null)
    const audioCtxRef = useRef<AudioContext | null>(null)

    const { track, setAudioRef, handleEnded, playNext, playPrev } =
        usePlayerStore(
            useShallow((s) => ({
                track: s.currentTrack,
                setAudioRef: s.setAudioRef,
                handleEnded: s.handleTrackEnded,
                isPlaying: s.isPlaying,
                playNext: s.playNext,
                playPrev: s.playPrev,
            })),
        )

    const { bufferedPercent } = useAudioLoader(track, audioRef)

    useLayoutEffect(() => {
        if (audioRef.current) {
            setAudioRef(audioRef as RefObject<HTMLAudioElement>)
        }
    })

    // Audio AnalyserNode for visualisation
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const AudioContextClass =
            window.AudioContext || (window as any).webkitAudioContext
        const audioCtx = new AudioContextClass()
        audioCtxRef.current = audioCtx

        const source = audioCtx.createMediaElementSource(audio)
        const audioAnalyser = audioCtx.createAnalyser()
        audioAnalyser.fftSize = 2048
        audioAnalyser.smoothingTimeConstant = 0.65

        const gainNode = audioCtx.createGain()

        source.connect(audioAnalyser)
        source.connect(gainNode)
        gainNode.connect(audioCtx.destination)

        gainNode.gain.setValueAtTime(
            usePlayerStore.getState().volume,
            audioCtx.currentTime,
        )

        usePlayerStore.setState({ analyser: audioAnalyser, gainNode: gainNode })

        return () => {
            if (audioCtx.state !== 'closed') {
                audioCtx.close()
            }
        }
    }, [])

    useEffect(() => {
        usePlayerStore.setState({
            currentTrackBufferedPercent: bufferedPercent,
        })
    }, [bufferedPercent])

    useEffect(() => {
        if (!track || !('mediaSession' in navigator)) return

        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.name,
            artist: track.author || 'Unknown Artist',
            album: '',
            artwork: track.imageName
                ? [
                      {
                          src: `/api/images/${track.imageName}`,
                          sizes: '512x512',
                          type: 'image/png',
                      },
                  ]
                : [],
        })

        navigator.mediaSession.setActionHandler('play', () =>
            audioRef.current?.play(),
        )
        navigator.mediaSession.setActionHandler('pause', () =>
            audioRef.current?.pause(),
        )

        navigator.mediaSession.setActionHandler('previoustrack', () => {
            playPrev()
        })
        navigator.mediaSession.setActionHandler('nexttrack', () => {
            playNext()
        })
    }, [track])

    const handleTimeUpdate = () => {
        const audio = audioRef.current
        if (!audio) return
        usePlayerStore.setState({ currentTrackTime: audio.currentTime })
    }

    async function handlePlay() {
        usePlayerStore.setState({ isPlaying: true })

        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
            await audioCtxRef.current.resume()
        }
    }

    function handlePause() {
        usePlayerStore.setState({ isPlaying: false })
    }

    return (
        <audio
            ref={audioRef}
            onPlay={handlePlay}
            onPause={handlePause}
            crossOrigin="anonymous"
            onEnded={handleEnded}
            onTimeUpdate={handleTimeUpdate}
        />
    )
}
