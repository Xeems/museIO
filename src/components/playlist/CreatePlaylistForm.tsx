import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '../ui/form'
import { Input } from '../ui/input'
import z from 'zod'
import { trackUploadSchema } from '../../../@types/validators'

type CreatePlaylistFormProps = {
    onSuccess?: () => void
}

export default function CreatePlaylistForm({
    onSuccess,
}: CreatePlaylistFormProps) {
    const form = useForm<z.infer<typeof trackUploadSchema>>({
        resolver: zodResolver(trackUploadSchema),
        defaultValues: {
            author: '',
            name: '',
        },
    })

    async function onSubmit(values: z.infer<typeof trackUploadSchema>) {
        const data = new FormData()
        data.append('author', values.author)
        data.append('name', values.name)
        data.append(
            'coverImageFile',
            values.coverImageFile,
            values.coverImageFile.name,
        )
        data.append('trackFile', values.trackFile, values.trackFile.name)

        const res = await fetch('/api/track', {
            method: 'POST',
            body: data,
        })

        if (res.ok) {
            onSuccess?.()

            form.reset()
        } else {
            const error = await res.json()
            console.error('Upload failed:', error)
        }
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4">
                {/* Track Name */}
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="Enter track title"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />{' '}
            </form>
        </Form>
    )
}
