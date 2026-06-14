'use client'
import PlayerCard from '../../player/PlayerCard'
import PlayerQueue from '../../player/PlayerQueue'
import { PagerView } from '@/components/functional/PagerView'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function MobilePlayer() {
    return (
        <div className="w-full">
            <PagerView>
                <div className="h-full w-full">
                    <PlayerCard />
                </div>

                <div className="h-full w-full">
                    <ScrollArea className="h-full">
                        <div className="h-12" />
                        <PlayerQueue />
                    </ScrollArea>
                </div>
            </PagerView>
        </div>
    )
}
