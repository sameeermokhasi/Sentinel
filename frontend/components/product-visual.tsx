'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

const IVORY = '#e9e3d5'
const GOLD = '#c9a15a'
const GRAPHITE = '#1b1b1e'

type Shape = 'footwear' | 'apparel' | 'object'

export function shapeFor(category: string, name = ''): Shape {
  const hay = `${category} ${name}`.toLowerCase()
  if (/(shoe|sneaker|runner|trainer|boot|footwear|sandal|loafer|heel)/.test(hay)) return 'footwear'
  if (/(shirt|tee|apparel|jacket|dress|top|hoodie|knit|coat|trouser|pant|linen)/.test(hay))
    return 'apparel'
  return 'object'
}

/* ------------------------------ scene pieces ------------------------------ */

function Turntable({
  children,
  spin,
  materialize,
}: {
  children: React.ReactNode
  spin: boolean
  materialize: boolean
}) {
  const group = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Group>(null)
  const t = useRef(materialize ? 0 : 1)

  useFrame((_, delta) => {
    if (group.current && spin) group.current.rotation.y += delta * 0.3
    if (!inner.current) return
    t.current = Math.min(1, t.current + delta * 1.6)
    // easeOutExpo
    const e = t.current >= 1 ? 1 : 1 - Math.pow(2, -9 * t.current)
    inner.current.scale.setScalar(0.62 + e * 0.38)
    inner.current.position.y = (1 - e) * 0.5
    inner.current.traverse((child) => {
      const mesh = child as THREE.Mesh
      const mat = mesh.material as THREE.Material | undefined
      if (mat && 'opacity' in mat) {
        mat.transparent = e < 1
        ;(mat as THREE.MeshStandardMaterial).opacity = e
      }
    })
  })

  return (
    <group ref={group}>
      <group ref={inner}>{children}</group>
      {/* stage disc */}
      <mesh position={[0, -0.62, 0]} receiveShadow>
        <cylinderGeometry args={[1.35, 1.42, 0.07, 64]} />
        <meshStandardMaterial color={GRAPHITE} roughness={0.55} metalness={0.15} />
      </mesh>
      <mesh position={[0, -0.575, 0]}>
        <torusGeometry args={[1.34, 0.006, 8, 96]} />
        <meshStandardMaterial color={GOLD} roughness={0.3} metalness={0.8} />
      </mesh>
    </group>
  )
}

function ShoeBoxShape() {
  return (
    <group rotation={[0, 0.5, 0]}>
      {/* box body */}
      <mesh castShadow receiveShadow position={[0, -0.18, 0]}>
        <boxGeometry args={[1.5, 0.55, 0.95]} />
        <meshStandardMaterial color={IVORY} roughness={0.72} metalness={0.03} />
      </mesh>
      {/* lid, offset like it was just opened */}
      <mesh castShadow position={[0.06, 0.16, -0.03]} rotation={[0, 0.06, 0.02]}>
        <boxGeometry args={[1.56, 0.14, 1.0]} />
        <meshStandardMaterial color="#d8d1c1" roughness={0.65} metalness={0.05} />
      </mesh>
      {/* gold band */}
      <mesh position={[0, -0.18, 0]}>
        <boxGeometry args={[1.53, 0.045, 0.98]} />
        <meshStandardMaterial color={GOLD} roughness={0.32} metalness={0.75} />
      </mesh>
      {/* abstract low-poly shoe silhouette resting on the lid */}
      <group position={[-0.02, 0.35, 0]} rotation={[0, 0.15, 0]}>
        <mesh castShadow position={[0, 0.06, 0]} rotation={[0, 0, -0.06]}>
          <capsuleGeometry args={[0.15, 0.62, 3, 8]} />
          <meshStandardMaterial color={IVORY} roughness={0.5} />
        </mesh>
        <mesh castShadow position={[0.34, -0.03, 0]} rotation={[0, 0, 0.35]}>
          <capsuleGeometry args={[0.13, 0.24, 3, 8]} />
          <meshStandardMaterial color={IVORY} roughness={0.5} />
        </mesh>
        <mesh castShadow position={[0.02, -0.09, 0]}>
          <boxGeometry args={[1.02, 0.07, 0.3]} />
          <meshStandardMaterial color={GOLD} roughness={0.35} metalness={0.7} />
        </mesh>
      </group>
    </group>
  )
}

function ClothShape() {
  const mesh = useRef<THREE.Mesh>(null)
  const geometry = useMemo(() => new THREE.PlaneGeometry(1.85, 1.5, 40, 34), [])
  const base = useMemo(() => Float32Array.from(geometry.attributes.position.array), [geometry])

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame(({ clock }) => {
    if (!mesh.current) return
    const time = clock.elapsedTime
    const attr = mesh.current.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < attr.count; i++) {
      const x = base[i * 3]
      const y = base[i * 3 + 1]
      const z =
        Math.sin(x * 2.2 + time * 0.9) * 0.11 +
        Math.cos(y * 2.6 - time * 0.65) * 0.07 +
        Math.sin((x + y) * 1.4 + time * 0.4) * 0.05
      attr.setZ(i, z)
    }
    attr.needsUpdate = true
    mesh.current.geometry.computeVertexNormals()
  })

  return (
    <group rotation={[0, 0, 0]}>
      <mesh ref={mesh} geometry={geometry} rotation={[-0.42, 0, 0.06]} castShadow receiveShadow>
        <meshStandardMaterial
          color={IVORY}
          roughness={0.85}
          metalness={0.02}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* hanging rail */}
      <mesh position={[0, 0.74, -0.1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, 2.05, 16]} />
        <meshStandardMaterial color={GOLD} roughness={0.3} metalness={0.8} />
      </mesh>
    </group>
  )
}

function ObjectShape() {
  return (
    <group rotation={[0.2, 0.4, 0]}>
      <mesh castShadow receiveShadow>
        <icosahedronGeometry args={[0.72, 0]} />
        <meshStandardMaterial color={IVORY} roughness={0.55} metalness={0.1} flatShading />
      </mesh>
      <mesh rotation={[Math.PI / 2.4, 0.3, 0]}>
        <torusGeometry args={[1.02, 0.012, 8, 96]} />
        <meshStandardMaterial color={GOLD} roughness={0.3} metalness={0.85} />
      </mesh>
    </group>
  )
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.4} color="#f5f1e8" />
      {/* key */}
      <directionalLight
        position={[3.2, 4.4, 3]}
        intensity={2.1}
        color="#fff8ea"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      {/* fill */}
      <directionalLight position={[-3.6, 1.6, 2.4]} intensity={0.55} color={GOLD} />
      {/* rim */}
      <directionalLight position={[0, 2.2, -4]} intensity={1.1} color="#cfd6e4" />
    </>
  )
}

/* ------------------------------ public surface ---------------------------- */

function useInView<T extends HTMLElement>(rootMargin = '160px') {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [rootMargin])

  return { ref, inView }
}

export function ProductVisual({
  category,
  name,
  interactive = false,
  materialize = false,
  className,
}: {
  category: string
  name?: string
  interactive?: boolean
  materialize?: boolean
  className?: string
}) {
  const { ref, inView } = useInView<HTMLDivElement>()
  const [hovering, setHovering] = useState(false)
  const shape = shapeFor(category, name)

  return (
    <div
      ref={ref}
      className={className}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      aria-hidden="true"
    >
      {inView ? (
        <Canvas
          shadows
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: true }}
          camera={{ position: [0, 0.95, 3.9], fov: 34 }}
          frameloop={inView ? 'always' : 'never'}
          className="h-full w-full"
        >
          <Lighting />
          <Turntable spin={!hovering || !interactive} materialize={materialize}>
            {shape === 'footwear' ? (
              <ShoeBoxShape />
            ) : shape === 'apparel' ? (
              <ClothShape />
            ) : (
              <ObjectShape />
            )}
          </Turntable>
          <ContactShadows
            position={[0, -0.66, 0]}
            opacity={0.5}
            scale={6}
            blur={2.6}
            far={3}
            color="#000000"
          />
          {interactive && (
            <OrbitControls
              enabled={hovering}
              enablePan={false}
              enableZoom={false}
              minPolarAngle={0.7}
              maxPolarAngle={1.55}
              rotateSpeed={0.6}
            />
          )}
        </Canvas>
      ) : (
        <div className="h-full w-full" />
      )}
    </div>
  )
}
