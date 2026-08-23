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
  if (/(shoe|sneaker|runner|trainer|boot|footwear|sandal|loafer|heel|puma|nike|adidas|reebok)/.test(hay)) return 'footwear'
  if (/(shirt|tee|apparel|jacket|dress|top|hoodie|knit|coat|trouser|pant|linen|jean)/.test(hay))
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
    if (group.current && spin) group.current.rotation.y += delta * 0.6
    if (!inner.current) return
    t.current = Math.min(1, t.current + delta * 1.6)
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

function Shoe3DShape({ colorName }: { colorName?: string }) {
  const mainColor = useMemo(() => {
    if (!colorName) return '#dc2626' // Vibrant Puma Red
    const c = colorName.toLowerCase()
    if (c.includes('red')) return '#dc2626'
    if (c.includes('blue') || c.includes('navy')) return '#2563eb'
    if (c.includes('black')) return '#18181b'
    if (c.includes('white')) return '#f8fafc'
    if (c.includes('grey') || c.includes('gray')) return '#64748b'
    if (c.includes('brown')) return '#78350f'
    if (c.includes('green') || c.includes('olive')) return '#15803d'
    return '#dc2626'
  }, [colorName])

  return (
    <group rotation={[0.08, -0.3, 0.04]} position={[0, -0.05, 0]}>
      {/* Midsole */}
      <mesh castShadow receiveShadow position={[0, -0.28, 0]}>
        <boxGeometry args={[1.75, 0.14, 0.65]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.1} />
      </mesh>
      
      {/* Outsole Grip */}
      <mesh castShadow position={[0, -0.37, 0]}>
        <boxGeometry args={[1.78, 0.06, 0.68]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>

      {/* Main Shoe Upper */}
      <mesh castShadow position={[-0.1, -0.08, 0]} rotation={[0, 0, -0.05]}>
        <capsuleGeometry args={[0.26, 1.05, 12, 24]} />
        <meshStandardMaterial color={mainColor} roughness={0.35} metalness={0.1} />
      </mesh>

      {/* Toe Cap Contour */}
      <mesh castShadow position={[0.42, -0.16, 0]} rotation={[0, 0, -0.2]}>
        <sphereGeometry args={[0.27, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <meshStandardMaterial color={mainColor} roughness={0.3} />
      </mesh>

      {/* Heel Counter */}
      <mesh castShadow position={[-0.55, 0.02, 0]} rotation={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.24, 0.28, 0.42, 24]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Ankle Collar */}
      <mesh castShadow position={[-0.25, 0.18, 0]} rotation={[0, 0, 0.1]}>
        <torusGeometry args={[0.19, 0.07, 16, 32]} />
        <meshStandardMaterial color="#020617" roughness={0.6} />
      </mesh>

      {/* Tongue */}
      <mesh castShadow position={[0.05, 0.16, 0]} rotation={[0, 0, -0.35]}>
        <boxGeometry args={[0.45, 0.06, 0.3]} />
        <meshStandardMaterial color="#020617" roughness={0.6} />
      </mesh>

      {/* Laces */}
      {[0.12, 0.24, 0.36].map((xOffset, i) => (
        <mesh key={i} position={[xOffset - 0.05, 0.02 + i * 0.04, 0]} rotation={[Math.PI / 2, 0, 0.2]}>
          <cylinderGeometry args={[0.015, 0.015, 0.36, 12]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.2} />
        </mesh>
      ))}

      {/* Formstrip / Side Stripe Accent */}
      <mesh position={[-0.05, -0.06, 0.28]} rotation={[0, 0.2, -0.15]}>
        <boxGeometry args={[0.75, 0.08, 0.02]} />
        <meshStandardMaterial color={GOLD} roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[-0.05, -0.06, -0.28]} rotation={[0, -0.2, -0.15]}>
        <boxGeometry args={[0.75, 0.08, 0.02]} />
        <meshStandardMaterial color={GOLD} roughness={0.2} metalness={0.8} />
      </mesh>
    </group>
  )
}

function ClothShape({ colorName }: { colorName?: string }) {
  const mesh = useRef<THREE.Mesh>(null)
  const geometry = useMemo(() => new THREE.PlaneGeometry(1.85, 1.5, 40, 34), [])
  const base = useMemo(() => Float32Array.from(geometry.attributes.position.array), [geometry])

  const mainColor = useMemo(() => {
    if (!colorName) return IVORY
    const c = colorName.toLowerCase()
    if (c.includes('red')) return '#dc2626'
    if (c.includes('blue') || c.includes('navy')) return '#1e3a8a'
    if (c.includes('black')) return '#18181b'
    if (c.includes('white')) return '#f8fafc'
    if (c.includes('grey') || c.includes('gray')) return '#64748b'
    if (c.includes('olive') || c.includes('green')) return '#365314'
    return IVORY
  }, [colorName])

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
          color={mainColor}
          roughness={0.7}
          metalness={0.05}
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
      <ambientLight intensity={0.5} color="#f5f1e8" />
      <directionalLight
        position={[3.2, 4.4, 3]}
        intensity={2.2}
        color="#fff8ea"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-3.6, 1.6, 2.4]} intensity={0.65} color={GOLD} />
      <directionalLight position={[0, 2.2, -4]} intensity={1.2} color="#cfd6e4" />
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
  color,
  interactive = true,
  materialize = true,
  className,
}: {
  category: string
  name?: string
  color?: string
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
      className={`relative min-h-[320px] w-full ${className ?? ''}`}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      aria-hidden="true"
    >
      {inView ? (
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
          camera={{ position: [0, 0.95, 3.8], fov: 35 }}
          frameloop="always"
          className="h-full w-full"
        >
          <Lighting />
          <Turntable spin={!hovering || !interactive} materialize={materialize}>
            {shape === 'footwear' ? (
              <Shoe3DShape colorName={color} />
            ) : shape === 'apparel' ? (
              <ClothShape colorName={color} />
            ) : (
              <ObjectShape />
            )}
          </Turntable>
          <ContactShadows
            position={[0, -0.66, 0]}
            opacity={0.6}
            scale={6}
            blur={2.5}
            far={3}
            color="#000000"
          />
          {interactive && (
            <OrbitControls
              enabled={true}
              enablePan={false}
              enableZoom={false}
              minPolarAngle={0.6}
              maxPolarAngle={1.55}
              rotateSpeed={0.8}
            />
          )}
        </Canvas>
      ) : (
        <div className="h-full w-full" />
      )}
    </div>
  )
}
