'use client'

import { Button } from '../ui/button'
import { Repeat1Icon, RepeatIcon, ShuffleIcon } from 'lucide-react'
import { usePlayerStore } from '@/store/playerStore'
import { useShallow } from 'zustand/shallow'

export default function PlayerModeToggle() {
    const { queuePlayMode, setQueuePlayMode } = usePlayerStore(
        useShallow((s) => ({
            queuePlayMode: s.queuePlayMode,
            setQueuePlayMode: s.setQueuePlayMode,
        })),
    )

    function togglePlayMode() {
        const mode =
            queuePlayMode === 'queue'
                ? 'random'
                : queuePlayMode === 'random'
                  ? 'loop'
                  : 'queue'
        setQueuePlayMode(mode)
    }

    return (
        <Button variant={'ghost'} onClick={togglePlayMode} className="!p-2">
            {queuePlayMode === 'queue' && <RepeatIcon className="size-5" />}
            {queuePlayMode === 'random' && <ShuffleIcon className="size-5" />}
            {queuePlayMode === 'loop' && <Repeat1Icon className="size-5" />}
        </Button>
    )
}
