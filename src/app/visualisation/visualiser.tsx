'use client'

import { usePlayerStore } from '@/store/playerStore'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

export default function Visualiser() {
    const analyser = usePlayerStore((s) => s.analyser)
    const dataArrayRef = useRef<Uint8Array | null>(null)
    const meshRef = useRef<THREE.Mesh>(null)
    const bloomRef = useRef<any>(null)

    const baseSphereRadius = 13

    const smoothedBassRef = useRef(0)
    const smoothedVolumeRef = useRef(0)

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

    const initialColors = useMemo(() => {
        const tempGeo = new THREE.IcosahedronGeometry(1, 5)
        const cols = new Float32Array(tempGeo.attributes.position.count * 3)
        tempGeo.dispose()
        return cols
    }, [])

    const vertex = useMemo(() => new THREE.Vector3(), [])
    const tempColor = useMemo(() => new THREE.Color(), [])

    useEffect(() => {
        if (meshRef.current) {
            const geometry = meshRef.current.geometry
            geometry.setAttribute(
                'color',
                new THREE.BufferAttribute(initialColors, 3),
            )
        }
    }, [initialColors])

    useFrame((state) => {
        if (!analyser || !meshRef.current) return

        if (!dataArrayRef.current) {
            dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount)
        }

        analyser.getByteFrequencyData(
            dataArrayRef.current as unknown as Uint8Array<ArrayBuffer>,
        )

        const geometry = meshRef.current.geometry as THREE.BufferGeometry
        const positionAttribute = geometry.attributes
            .position as THREE.BufferAttribute
        const colorAttribute = geometry.attributes
            .color as THREE.BufferAttribute

        if (!positionAttribute || !colorAttribute) return

        const time = state.clock.getElapsedTime()
        const totalBins = dataArrayRef.current.length
        const totalVertices = positionAttribute.count

        // --- 1. АНАЛИЗ ДОМИНАНТНЫХ ЧАСТОТ С ВЫРАВНИВАНИЕМ ПОРОГОВ ---
        const oneFifth = Math.floor(totalBins / 5)

        let subBassSum = 0
        let bassSum = 0
        let midsSum = 0
        let upperMidsSum = 0
        let highsSum = 0

        for (let k = 0; k < totalBins; k++) {
            const fValue = dataArrayRef.current[k]
            if (k < oneFifth) {
                subBassSum += fValue
            } else if (k < oneFifth * 2) {
                bassSum += fValue
            } else if (k < oneFifth * 3) {
                midsSum += fValue
            } else if (k < oneFifth * 4) {
                upperMidsSum += fValue
            } else {
                highsSum += fValue
            }
        }

        // Чистые средние значения
        const pureSubBass = subBassSum / oneFifth / 255
        const pureBass = bassSum / oneFifth / 255
        const pureMids = midsSum / oneFifth / 255
        const pureUpMids = upperMidsSum / oneFifth / 255
        const pureHighs = highsSum / oneFifth / 255

        // КАЛИБРОВКА: Искусственно меняем баланс сил (уравниваем шансы частот)
        // Бас искусственно принижаем (он слишком мощный в аудиопотоке)
        // Середину и Высокие — значительно умножаем, так как физически они тише
        const subBassScore = pureSubBass * 0.65
        const bassScore = pureBass * 0.85
        const midsScore = pureMids * 1.5
        const upMidsScore = pureUpMids * 1.9
        const highsScore = pureHighs * 2.5

        // Общие параметры для деформации геометрии оставляем на честных значениях
        const globalVolume =
            (pureSubBass + pureBass + pureMids + pureUpMids + pureHighs) / 5
        const bassTrigger = Math.pow((pureSubBass + pureBass) / 2, 1.2)

        // --- 2. ВЫБОР ОБЩЕГО ЦВЕТА НА ОСНОВЕ СКОРРЕКТИРОВАННЫХ ВЕСОВ ---
        // Палитра из 5 сочных неоновых оттенков (значения Hue в HSL от 0 до 1):
        const subBassHue = 0.82 // Электрический ярко-розовый / Маджента
        const bassHue = 0.7 // Насыщенный фиолетовый / Пурпур
        const midsHue = 0.55 // Глубокий космический синий
        const upMidsHue = 0.4 // Яркий циановый / Аквамарин
        const highsHue = 0.3 // Кислотно-мятный зелёный (как на вашем референсе)

        let targetHue = midsHue

        // Ищем, какой диапазон набрал больше всего «очков» (доминанту)
        const maxScore = Math.max(
            subBassScore,
            bassScore,
            midsScore,
            upMidsScore,
            highsScore,
        )

        if (maxScore === subBassScore) {
            targetHue = subBassHue
        } else if (maxScore === bassScore) {
            targetHue = bassHue
        } else if (maxScore === midsScore) {
            targetHue = midsHue
        } else if (maxScore === upMidsScore) {
            targetHue = upMidsHue
        } else if (maxScore === highsScore) {
            targetHue = highsHue
        }

        // Плавное перетекание цвета всей сферы
        // Увеличили скорость интерполяции с 0.04 до 0.07, чтобы сфера шустрее реагировала на смену доминанты
        currentHueRef.current += (targetHue - currentHueRef.current) * 0.07
        const globalSphereHue = currentHueRef.current

        // --- 3. СИНХРОННЫЙ РАСЧЕТ ЯРКОСТИ И ВСПЫШЕК ---
        let globalLightness = 0.4 + globalVolume * 0.25

        // Эффект полной вспышки: если трек взрывается громкостью, ВСЯ сфера мгновенно белеет
        if (globalVolume > 0.38) {
            globalLightness = THREE.MathUtils.lerp(
                globalLightness,
                0.95,
                (globalVolume - 0.38) * 2.0,
            )
        }

        // --- 4. ОСНОВНОЙ ЦИКЛ ПО ВСЕМ ВЕРШИНАМ ---
        for (let i = 0; i < totalVertices; i++) {
            const dirX = initialDirections[i * 3]
            const dirY = initialDirections[i * 3 + 1]
            const dirZ = initialDirections[i * 3 + 2]

            vertex.set(dirX, dirY, dirZ)

            // Математический шум для эффекта жидкой плазмы
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

            // Физическая деформация геометрии
            const displacement =
                baseSphereRadius +
                noiseValue * 1.5 +
                audioValue * 6.5 * (noiseValue + 0.8) +
                bassTrigger * 3.5 +
                globalVolume * 1.5

            vertex.multiplyScalar(displacement)
            positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z)

            // Микро-перелив нитей внутри паутины
            let hue = globalSphereHue + noiseValue * 0.01

            // Записываем цвет и яркость для каждой вершины
            tempColor.setHSL(hue, 0.9, globalLightness)
            colorAttribute.setXYZ(i, tempColor.r, tempColor.g, tempColor.b)
        }

        positionAttribute.needsUpdate = true
        colorAttribute.needsUpdate = true

        meshRef.current.rotation.x += 0.002
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
                    vertexColors={true}
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
