'use client'

import { Canvas } from '@react-three/fiber'
import Visualiser from './visualiser'
import LayoutPlayer from '@/components/player/LayoutPlayer'

export default function VisualisationPage() {
    return (
        <main className="flex h-screen w-full bg-gray-300">
            <div className="relative h-full w-full">
                <Canvas
                    camera={{ position: [30, 30, 30], fov: 60 }}
                    gl={{ antialias: true, toneMappingExposure: 1.5 }}>
                    <color attach="background" args={['#0a0f0d']} />{' '}
                    <ambientLight intensity={0.4} />
                    <Visualiser />
                </Canvas>
            </div>
            <LayoutPlayer variant="visualisation" />
        </main>
    )
}
