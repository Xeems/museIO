'use client'

import { usePlayerStore } from '@/store/playerStore'
import { Card } from '../ui/card'
import TrackTimeSlider from './TrackTimeSlider'
import PlayerModeToggle from './PlayerModeToggle'
import PlayerVolume from './PlayerVolume'
import TrackInfo from './TrackInfo'
import PlayerControls from './PlayerControls'
import { cn } from '@/lib/utils'

type Props = {
    variant?: 'default' | 'visualisation'
}

export default function LayoutPlayer({ variant = 'default' }: Props) {
    const currentTrack = usePlayerStore((s) => s.currentTrack)
    if (!currentTrack) return

    return (
        <Card
            className={cn(
                'fixed inset-x-0 bottom-0 flex w-full items-center justify-center rounded-none border-none p-0 md:border-t md:border-solid md:p-3',
                variant === 'visualisation' &&
                    'text-primary-foreground bottom-4 mx-auto w-[98%] rounded-md border-solid border-white/30 bg-white/10 backdrop-blur-sm',
            )}>
            <div className="grid w-full grid-rows-[auto_auto] gap-2 md:flex md:grid-rows-1 md:flex-row md:items-center xl:max-w-[95%]">
                <div className="row-start-2 flex flex-row justify-between px-2 pb-2 md:pb-0">
                    <TrackInfo track={currentTrack} />

                    <div className="flex flex-row items-center gap-x-2">
                        <PlayerModeToggle />
                        <PlayerControls />
                    </div>
                </div>

                <div className="row-start-1 w-full md:col-auto md:row-auto">
                    <TrackTimeSlider />
                </div>

                <div className="hidden md:block">
                    <PlayerVolume />
                </div>
            </div>
        </Card>
    )
}
