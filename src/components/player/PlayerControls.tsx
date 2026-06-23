import { Button } from '../ui/button'
import {
    PauseIcon,
    PlayIcon,
    SkipBackIcon,
    SkipForwardIcon,
} from 'lucide-react'
import { usePlayerStore } from '@/store/playerStore'
import { useShallow } from 'zustand/shallow'

type PlayerControlsProps = {
    size?: keyof typeof sizeClasses
}

const sizeClasses = {
    medium: {
        button: 'size-10',
        icon: 'size-5',
    },
    large: {
        button: 'size-13',
        icon: 'size-6',
    },
} as const

export default function PlayerControls({
    size = 'medium',
}: PlayerControlsProps) {
    const { togglePlay, isPlaying, playNext, playPrev } = usePlayerStore(
        useShallow((s) => ({
            audioRef: s.audioRef,
            togglePlay: s.togglePlay,
            isPlaying: s.isPlaying,
            playNext: s.playNext,
            playPrev: s.playPrev,
        })),
    )

    const classes = sizeClasses[size]

    return (
        <div className="flex items-center justify-center gap-x-2">
            <Button
                onClick={playPrev}
                variant="ghost"
                className={`rounded-full p-0 ${classes.button}`}>
                <SkipBackIcon className={classes.icon} />
            </Button>

            <Button
                onClick={togglePlay}
                className={`rounded-full p-0 ${classes.button}`}>
                {isPlaying ? (
                    <PauseIcon className={classes.icon} />
                ) : (
                    <PlayIcon className={classes.icon} />
                )}
            </Button>

            <Button
                onClick={playNext}
                variant="ghost"
                className={`rounded-full p-0 ${classes.button}`}>
                <SkipForwardIcon className={classes.icon} />
            </Button>
        </div>
    )
}
