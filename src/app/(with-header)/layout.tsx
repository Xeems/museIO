import LayoutPlayer from '@/components/player/LayoutPlayer'
import Header from '@/components/visual/Header'

export default function Layout({
    children,
    modal,
}: {
    children: React.ReactNode
    modal: React.ReactNode
}) {
    return (
        <div className="pb-40">
            <Header />
            {children}
            {modal}
            <LayoutPlayer />
        </div>
    )
}
