'use client'

import { Canvas } from '@react-three/fiber'
import Visualiser from './visualiser'
import LayoutPlayer from '@/components/player/LayoutPlayer'

export default function VisualisationPage() {
    return (
        <main className="flex h-screen w-full bg-gray-300">
            <Canvas camera={{ position: [0, 15, 30], fov: 60 }}>
                <color attach="background" args={['#000000']} />

                <ambientLight intensity={0.3} />
                <pointLight
                    position={[20, 30, 10]}
                    intensity={1.5}
                    color="#00ffff"
                />
                <pointLight
                    position={[-20, -10, -10]}
                    intensity={0.5}
                    color="#ff00ff"
                />
                <Visualiser />
            </Canvas>
            <LayoutPlayer variant="visualisation" />
        </main>
    )
}
