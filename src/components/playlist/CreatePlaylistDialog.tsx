'use client'
import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { MusicIcon } from 'lucide-react'
import CreatePlaylistForm from './CreatePlaylistForm'

export default function CreatePlaylistDialog() {
    const [isOpen, setIsOpen] = useState(false)
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>Create playlst</Button>
            </DialogTrigger>
            <DialogContent className="-md p-6 md:max-w-xl [&>button:last-child]:hidden">
                <DialogHeader className="gap-1">
                    <DialogTitle className="text-primary flex flex-row items-center gap-x-2 text-2xl font-semibold">
                        <MusicIcon /> Create Playlist
                    </DialogTitle>
                    <DialogDescription>TO DO</DialogDescription>
                </DialogHeader>

                <CreatePlaylistForm onSuccess={() => setIsOpen(false)} />
            </DialogContent>
        </Dialog>
    )
}
