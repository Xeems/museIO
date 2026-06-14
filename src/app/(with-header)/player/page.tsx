import PlayerCard from './PlayerCard'
import getTrackById from '@/lib/api/getTrackById'

type PlayerPageProps = {
    searchParams: {
        track?: string
    }
}

export default async function page({ searchParams }: PlayerPageProps) {
    const { track } = await searchParams
    const initialTrack = track ? await getTrackById(track) : undefined

    return (
        <main className="flex flex-1 justify-center p-4">
            <div className="flex w-full max-w-xl flex-1 items-center">
                <PlayerCard initialTrack={initialTrack} />
            </div>
        </main>
    )
}
