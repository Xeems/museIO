'use client'

import { usePlayerStore } from '@/store/playerStore'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

export default function Visualiser() {
    const analyser = usePlayerStore((s) => s.analyser)
    const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
    const meshRef = useRef<THREE.Mesh>(null)

    const materialRef = useRef<THREE.MeshBasicMaterial>(null)

    const scoreWeights = new Float32Array([0.65, 0.85, 1.5, 1.9, 2.5]) // how often the sphere changes color for each frequency range

    const targetHues = new Float32Array([0.82, 0.7, 0.55, 0.4, 0.3]) // colors for each frequency range

    const rangeSums = new Float32Array(5) // total score for each range per frame

    const bloomRef = useRef<any>(null)

    const baseSphereRadius = 13

    const currentHueRef = useRef(0.55)

    const initialDirections = useMemo(() => {
        const tempGeo = new THREE.IcosahedronGeometry(1, 5)
        const posAttr = tempGeo.attributes.position
        const dirs = new Float32Array(posAttr.count * 3)
        const vector = new THREE.Vector3()

        for (let i = 0; i < posAttr.count; i++) {
            vector.fromBufferAttribute(posAttr, i).normalize()
            dirs[i * 3] = vector.x
            dirs[i * 3 + 1] = vector.y
            dirs[i * 3 + 2] = vector.z
        }

        tempGeo.dispose()
        return dirs
    }, [])

    const vertex = useMemo(() => new THREE.Vector3(), [])

    useFrame((state) => {
        if (!analyser || !meshRef.current) return

        if (!dataArrayRef.current) {
            dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount)
        }

        analyser.getByteFrequencyData(dataArrayRef.current)

        const geometry = meshRef.current.geometry as THREE.BufferGeometry
        const positionAttribute = geometry.attributes
            .position as THREE.BufferAttribute

        if (!positionAttribute) return

        const time = state.clock.getElapsedTime()
        const totalBins = dataArrayRef.current.length
        const totalVertices = positionAttribute.count

        rangeSums.fill(0)
        const binsPerRange = Math.floor(totalBins / 5)

        // --- SPHERE COLOR ---
        for (let k = 0; k < totalBins; k++) {
            const rangeIndex = Math.min(4, Math.floor(k / binsPerRange))
            rangeSums[rangeIndex] += dataArrayRef.current[k]
        }

        let maxScore = -1
        let targetHue = 0.55
        let totalSum = 0

        const normalizationFactor = 1 / (binsPerRange * 255)

        for (let r = 0; r < 5; r++) {
            const pureValue = rangeSums[r] * normalizationFactor
            totalSum += pureValue

            const currentScore = pureValue * scoreWeights[r]

            if (currentScore > maxScore) {
                maxScore = currentScore
                targetHue = targetHues[r]
            }
        }

        const globalVolume = totalSum / 5
        const bassTrigger = Math.pow(
            ((rangeSums[0] + rangeSums[1]) * normalizationFactor) / 2,
            1.2,
        )

        currentHueRef.current += (targetHue - currentHueRef.current) * 0.05
        const globalSphereHue = currentHueRef.current

        let globalLightness = 0.4 + globalVolume * 0.25

        if (globalVolume > 0.38) {
            globalLightness = THREE.MathUtils.lerp(
                globalLightness,
                0.95,
                (globalVolume - 0.38) * 2.0,
            )
        }

        if (materialRef.current) {
            materialRef.current.color.setHSL(
                globalSphereHue,
                0.9,
                globalLightness,
            )
        }

        // --- SPHERE GEOMETRY ---
        for (let i = 0; i < totalVertices; i++) {
            const dirX = initialDirections[i * 3]
            const dirY = initialDirections[i * 3 + 1]
            const dirZ = initialDirections[i * 3 + 2]

            vertex.set(dirX, dirY, dirZ)

            const n1 =
                Math.sin(dirX * 4.0 + time * 0.6) *
                Math.cos(dirY * 4.0 - time * 0.4)
            const n2 =
                Math.sin(dirZ * 5.0 - time * 0.7) *
                Math.cos(dirX * 5.0 + time * 0.5)
            const noiseValue = n1 * 0.5 + n2 * 0.5

            const positionFactor = Math.abs(dirY)

            let compressedFactor = Math.pow(positionFactor, 1.8)
            let sampleIndex = Math.floor(compressedFactor * (totalBins * 0.65))
            sampleIndex =
                (sampleIndex + Math.floor(Math.abs(noiseValue) * 10)) %
                totalBins

            let audioValue = dataArrayRef.current[sampleIndex] / 255

            if (positionFactor > 0.6) {
                audioValue *= 2.4
            } else if (positionFactor < 0.3) {
                audioValue *= 1.3
            }

            const displacement =
                baseSphereRadius +
                noiseValue * 0.5 +
                audioValue * 7.5 * (noiseValue + 0.8) +
                bassTrigger * 3.5 +
                globalVolume * 1.5

            vertex.multiplyScalar(displacement)
            positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z)
        }

        positionAttribute.needsUpdate = true

        meshRef.current.rotation.x += 0.002
        meshRef.current.rotation.y += 0.002
    })

    return (
        <>
            <EffectComposer>
                <Bloom
                    //ref={bloomRef}
                    intensity={1.5}
                    luminanceThreshold={0.1}
                    luminanceSmoothing={0.9}
                    mipmapBlur={true}
                />
            </EffectComposer>
            <mesh ref={meshRef}>
                <icosahedronGeometry args={[baseSphereRadius, 5]} />
                <meshBasicMaterial
                    ref={materialRef}
                    wireframe={true}
                    transparent={true}
                    opacity={0.65}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>
            <OrbitControls enableDamping dampingFactor={0.05} />
        </>
    )
}
