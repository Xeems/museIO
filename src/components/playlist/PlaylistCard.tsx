import { PlaylistType } from '../../../@types/playlist'
import { Card, CardHeader } from '../ui/card'

type Props = {
    playlist: PlaylistType
}

export default function PlaylistCard({ playlist }: Props) {
    return (
        <Card className="size-50">
            <CardHeader>{playlist.name}</CardHeader>
        </Card>
    )
}
