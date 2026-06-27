import { RefObject, useEffect, useState } from 'react'
import Hls from 'hls.js'
import { TrackType } from '../../../@types/track'
import { usePlayerStore } from '@/store/playerStore'

export function useAudioLoader(
    currentTrack: TrackType | null,
    audioRef: RefObject<HTMLAudioElement | null>,
) {
    const [bufferedPercent, setBufferedPercent] = useState(0)
    const [duration, setDuration] = useState(0)

    useEffect(() => {
        if (!currentTrack || !audioRef?.current) return

        const audio = audioRef.current
        const hls = new Hls()

        hls.loadSource(`/api/hls/${currentTrack.trackDir}/index.m3u8`)
        hls.attachMedia(audio)

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            const { queue } = usePlayerStore.getState()
            if (queue.length > 0) {
                audio.play().catch((err) => {
                    console.warn('Автоплей заблокирован браузером:', err)
                })
            }
        })

        const updateBuffer = () => {
            try {
                const buffered = audio.buffered
                const current = audio.currentTime
                for (let i = 0; i < buffered.length; i++) {
                    if (
                        buffered.start(i) <= current &&
                        buffered.end(i) >= current
                    ) {
                        const bufferEnd = buffered.end(i)
                        const realDuration =
                            audio.seekable.length > 0
                                ? audio.seekable.end(0)
                                : audio.duration
                        setDuration(realDuration)
                        setBufferedPercent((bufferEnd / realDuration) * 100)
                        break
                    }
                }
            } catch {}
        }

        audio.addEventListener('progress', updateBuffer)
        audio.addEventListener('loadedmetadata', updateBuffer)

        return () => {
            hls.destroy()
            audio.removeEventListener('progress', updateBuffer)
            audio.removeEventListener('loadedmetadata', updateBuffer)
        }
    }, [currentTrack, audioRef])

    return { bufferedPercent, duration }
}
