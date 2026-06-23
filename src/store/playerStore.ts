import { RefObject } from 'react'
import { TrackType } from '../../@types/track'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import getTrackById from '@/lib/api/getTrackById'

type QueuePlayMode = 'queue' | 'loop' | 'random'

type PlayerStoreType = {
    audioRef: RefObject<HTMLAudioElement> | null
    setAudioRef: (ref: RefObject<HTMLAudioElement>) => void

    analyser: AnalyserNode | null
    gainNode: GainNode | null

    isPlaying: boolean
    togglePlay: () => void

    currentTrackTime: number
    currentTrackBufferedPercent: number
    setCurrentTrackTime: (time: number) => void

    currentTrack: TrackType | null
    setCurrentTrack: (track: TrackType) => void
    setCurrentTrackById: (id: string) => void

    volume: number
    setVolume: (val: number) => void

    queue: TrackType[]
    queuePlayMode: QueuePlayMode
    queueSource: string
    setQueuePlayMode: (mode: QueuePlayMode) => void
    bindTrackList: (params: { queue: TrackType[]; queueSource: string }) => void
    clearQueue: () => void

    playTrackByIndex: (index: number) => void
    playNext: () => void
    playPrev: () => void
    handleTrackEnded: () => void
}

export const usePlayerStore = create<PlayerStoreType>()(
    subscribeWithSelector((set, get) => ({
        audioRef: null,
        analyser: null,
        gainNode: null,

        currentTrack: null,
        isPlaying: false,
        currentTrackTime: 0,
        currentTrackBufferedPercent: 0,
        volume: 0.7,

        queue: [],
        queuePlayMode: 'queue',
        queueSource: '',

        setAudioRef: (ref) => set({ audioRef: ref }),

        setCurrentTrack: (track) => {
            const { queue } = get()
            const exists = queue.some((t) => t.id === track.id)

            set({
                currentTrack: track,
                isPlaying: true,
                queue: exists ? queue : [track], // if no queue, create one with initial track
            })
        },

        setCurrentTrackById: async (id) => {
            const track = await getTrackById(id)
            if (track) {
                get().setCurrentTrack(track)
            }
        },

        togglePlay: () => {
            const { audioRef, isPlaying } = get()
            if (!audioRef?.current) return

            if (isPlaying) {
                audioRef.current.pause()
            } else {
                audioRef.current.play().catch(() => {})
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
            const { audioRef, gainNode } = get()
            if (!audioRef?.current) return

            if (gainNode) {
                gainNode.gain.setValueAtTime(
                    value,
                    gainNode.context.currentTime,
                )
            } else {
                audioRef.current.volume = value
            }
            set({ volume: value })
        },

        setQueuePlayMode: (mode: QueuePlayMode) => set({ queuePlayMode: mode }),
        clearQueue: () => set({ queue: [] }),

        playTrackByIndex: (index) => {
            const { queue } = get()
            if (queue.length === 0) return

            const targetIndex = (index + queue.length) % queue.length
            const nextTrack = queue[targetIndex]

            set({ currentTrack: nextTrack, isPlaying: true })
        },

        playNext: () => {
            const { currentTrack, queue, playTrackByIndex } = get()
            if (!currentTrack || queue.length === 0) return

            const currentIndex = queue.findIndex(
                (t) => t.id === currentTrack.id,
            )
            if (currentIndex === -1) return

            playTrackByIndex(currentIndex + 1)
        },

        playPrev: () => {
            const { currentTrack, queue, playTrackByIndex, audioRef } = get()
            if (!currentTrack || queue.length === 0) return

            // Фича плееров: если трек играет больше 3 секунд, Назад просто мотает в начало
            if (audioRef?.current && audioRef.current.currentTime > 3) {
                audioRef.current.currentTime = 0
                set({ currentTrackTime: 0 })
                return
            }

            const currentIndex = queue.findIndex(
                (t) => t.id === currentTrack.id,
            )
            if (currentIndex === -1) return

            playTrackByIndex(currentIndex - 1)
        },

        handleTrackEnded: () => {
            const {
                queue,
                currentTrack,
                queuePlayMode,
                playTrackByIndex,
                audioRef,
            } = get()
            if (queue.length === 0 || !currentTrack) return

            switch (queuePlayMode) {
                case 'loop':
                    if (audioRef?.current) {
                        audioRef.current.currentTime = 0
                        audioRef.current.play().catch(() => {})
                    }
                    set({ currentTrackTime: 0, isPlaying: true })
                    break

                case 'queue':
                    get().playNext()
                    break

                case 'random':
                    const randomIndex = Math.floor(Math.random() * queue.length)
                    playTrackByIndex(randomIndex)
                    break
            }
        },
    })),
)
