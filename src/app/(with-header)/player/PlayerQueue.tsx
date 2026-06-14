'use client'

import TrackList from '@/components/track-list/TrackList'
import { TrackListProvider } from '@/components/track-list/TrackListContext'
import TrackListInfiniteScrollTrigger from '@/components/track-list/TrackListInfiniteScrollTrigger'
import { usePlayerStore } from '@/store/playerStore'
import { useShallow } from 'zustand/shallow'

export default function PlayerQueue() {
    const { tracks, source } = usePlayerStore(
        useShallow((s) => ({
            currentTrack: s.currentTrack,
            tracks: s.queue,
            source: s.queueSource,
            setCurrentTrack: s.setCurrentTrack,
        })),
    )
    return (
        tracks.length > 1 && (
            <TrackListProvider
                initialState={{
                    source: source,
                    tracks: tracks,
                }}>
                <TrackList />
                <TrackListInfiniteScrollTrigger />
            </TrackListProvider>
        )
    )
}
