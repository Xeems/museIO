import getUserPlaylists from '@/actions/getUserPlaylists'

import PlaylistCard from './PlaylistCard'
import { PlaylistType } from '../../../@types/playlist'
import CreatePlaylistDialog from './CreatePlaylistDialog'

// to-do find a better name for component
export default async function PlaylistList() {
    const response = await getUserPlaylists()
    const playlists: PlaylistType[] =
        response.success && response.data ? response.data : []

    return (
        <div>
            <CreatePlaylistDialog />

            <ul>
                {Array.isArray(playlists) &&
                    playlists.map((playlist) => (
                        <li key={playlist.id}>
                            <PlaylistCard playlist={playlist} />
                        </li>
                    ))}
            </ul>
        </div>
    )
}
