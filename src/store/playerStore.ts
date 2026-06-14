import { RefObject } from 'react'
import { TrackType } from '../../@types/track'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import getTrackById from '@/lib/api/getTrackById'

type PlayerStoreType = {
    audioRef: RefObject<HTMLAudioElement> | null

    setAudioRef: (ref: RefObject<HTMLAudioElement>) => void

    currentTrack: TrackType | null
    isPlaying: boolean
    currentTrackTime: number
    currentTrackBufferedPercent: number
    volume: number

    setCurrentTrack: (track: TrackType) => void
    setCurrentTrackById: (id: string) => void
    togglePlay: () => void
    setCurrentTrackTime: (time: number) => void
    setVolume: (val: number) => void

    queue: TrackType[]
    queueSource: string

    bindTrackList: (params: { queue: TrackType[]; queueSource: string }) => void
    clearQueue: () => void

    analyser: AnalyserNode | null
}

export const usePlayerStore = create<PlayerStoreType>()(
    subscribeWithSelector((set, get) => ({
        audioRef: null,
        currentTrack: null,
        isPlaying: false,
        currentTrackTime: 0,
        currentTrackBufferedPercent: 0,
        volume: 0.7,
        queue: [],
        queueSource: '',

        setAudioRef: (ref) => set({ audioRef: ref }),

        setCurrentTrack: (track) => set({ currentTrack: track }),

        setCurrentTrackById: async (id) => {
            const track = await getTrackById(id)
            if (track) {
                set({ currentTrack: track })
            }
        },

        togglePlay: () => {
            const { audioRef, isPlaying } = get()
            if (!audioRef?.current) return

            if (isPlaying) {
                audioRef.current.pause()
            } else {
                audioRef.current.play()
            }

            set({ isPlaying: !isPlaying })
        },

        bindTrackList: ({ queue, queueSource }) => {
            set({ queue: queue, queueSource })
        },

        setCurrentTrackTime: (time) => {
            const { audioRef } = get()
            if (!audioRef?.current) return
            audioRef.current.currentTime = time
            set({ currentTrackTime: time })
        },

        setVolume: (value) => {
            const { audioRef } = get()
            if (!audioRef?.current) return

            audioRef.current.volume = value
            set({ volume: value })
        },

        clearQueue: () => set({ queue: [] }),

        analyser: null,
    })),
)
