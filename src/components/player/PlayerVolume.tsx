import { Button } from '../ui/button'
import { Volume2Icon, VolumeXIcon } from 'lucide-react'
import { Slider } from '../ui/slider'
import { usePlayerStore } from '@/store/playerStore'

export default function PlayerVolume({
    isSliderHidden = false,
}: {
    isSliderHidden?: boolean
}) {
    const volume = usePlayerStore((s) => s.volume)
    const setVolume = usePlayerStore((s) => s.setVolume)

    function handleVolumeChange(value: number[]) {
        setVolume(value[0])
    }

    return (
        <div className="flex flex-row items-center gap-x-2">
            <Button
                variant="ghost"
                onClick={() => setVolume(0)}
                className="!p-2">
                {volume === 0 ? (
                    <VolumeXIcon className="size-6" />
                ) : (
                    <Volume2Icon className="size-6" />
                )}
            </Button>
            {!isSliderHidden && (
                <Slider
                    className="w-20"
                    max={1.0}
                    min={0.0}
                    step={0.01}
                    value={[volume]}
                    onValueChange={handleVolumeChange}
                />
            )}
        </div>
    )
}
