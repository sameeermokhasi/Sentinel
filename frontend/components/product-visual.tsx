'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, OrbitControls, useTexture } from '@react-three/drei'
import { Suspense, useMemo, useRef } from 'react'
import * as THREE from 'three'

const GOLD = '#c9a15a'
const GRAPHITE = '#121214'

type Shape = 'footwear' | 'apparel' | 'object'

export function shapeFor(category: string, name = ''): Shape {
  const hay = `${category} ${name}`.toLowerCase()
  if (/(shoe|sneaker|runner|trainer|boot|footwear|sandal|loafer|heel|puma|nike|adidas|reebok)/.test(hay)) return 'footwear'
  if (/(shirt|tee|apparel|jacket|dress|top|hoodie|knit|coat|trouser|pant|linen|jean)/.test(hay))
    return 'apparel'
  return 'object'
}

/* ------------------------------ 3D Geometries ------------------------------ */

function Turntable({
  children,
  spin,
}: {
  children: React.ReactNode
  spin: boolean
}) {
  const group = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (group.current && spin) group.current.rotation.y += delta * 0.5
  })

  return (
    <group ref={group}>
      {children}
      {/* Polished Turntable Stage */}
      <mesh position={[0, -0.65, 0]} receiveShadow>
        <cylinderGeometry args={[1.4, 1.48, 0.08, 64]} />
        <meshStandardMaterial color={GRAPHITE} roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[0, -0.605, 0]}>
        <torusGeometry args={[1.39, 0.008, 12, 96]} />
        <meshStandardMaterial color={GOLD} roughness={0.25} metalness={0.85} />
      </mesh>
    </group>
  )
}

function Shoe3DShowcase({ colorName }: { colorName?: string }) {
  const texture = useTexture('/products/puma-speed-runner.jpg')

  return (
    <group position={[0, 0.05, 0]}>
      {/* Front 3D Textured Product Panel */}
      <mesh position={[0, 0.05, 0.02]} castShadow receiveShadow>
        <boxGeometry args={[1.9, 1.15, 0.04]} />
        <meshStandardMaterial map={texture} roughness={0.25} metalness={0.05} />
      </mesh>

      {/* Back 3D Textured Product Panel */}
      <mesh position={[0, 0.05, -0.02]} rotation={[0, Math.PI, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.9, 1.15, 0.04]} />
        <meshStandardMaterial map={texture} roughness={0.25} metalness={0.05} />
      </mesh>

      {/* 3D Metallic Gold Frame Bevel */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[1.96, 1.21, 0.06]} />
        <meshStandardMaterial color={GOLD} roughness={0.2} metalness={0.88} />
      </mesh>
    </group>
  )
}

function Apparel3DShowcase({ colorName }: { colorName?: string }) {
  const texture = useTexture('/products/oxford-shirt.png')

  return (
    <group position={[0, 0.05, 0]}>
      <mesh position={[0, 0.05, 0.02]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 1.25, 0.04]} />
        <meshStandardMaterial map={texture} roughness={0.3} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.05, -0.02]} rotation={[0, Math.PI, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 1.25, 0.04]} />
        <meshStandardMaterial map={texture} roughness={0.3} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[1.76, 1.31, 0.06]} />
        <meshStandardMaterial color={GOLD} roughness={0.2} metalness={0.88} />
      </mesh>
    </group>
  )
}

function Object3DShape() {
  return (
    <group rotation={[0.2, 0.4, 0]}>
      <mesh castShadow receiveShadow>
        <dodecahedronGeometry args={[0.65, 0]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh rotation={[Math.PI / 2.4, 0.3, 0]}>
        <torusGeometry args={[1.05, 0.015, 12, 96]} />
        <meshStandardMaterial color={GOLD} roughness={0.2} metalness={0.9} />
      </mesh>
    </group>
  )
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.7} color="#ffffff" />
      <directionalLight
        position={[4, 5, 4]}
        intensity={2.2}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-4, 2, 2]} intensity={0.8} color={GOLD} />
      <directionalLight position={[0, 2, -4]} intensity={1.2} color="#cbd5e1" />
    </>
  )
}

/* ------------------------------ public surface ---------------------------- */

export function ProductVisual({
  category,
  name,
  color,
  interactive = true,
  className,
}: {
  category: string
  name?: string
  color?: string
  interactive?: boolean
  materialize?: boolean
  className?: string
}) {
  const shape = shapeFor(category, name)

  return (
    <div className={`relative min-h-[340px] w-full bg-[#0d0d0f] ${className ?? ''}`} aria-hidden="true">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0.85, 3.4], fov: 36 }}
        frameloop="always"
        className="h-full w-full"
      >
        <Lighting />
        <Turntable spin={interactive}>
          <Suspense fallback={<Object3DShape />}>
            {shape === 'footwear' ? (
              <Shoe3DShowcase colorName={color} />
            ) : shape === 'apparel' ? (
              <Apparel3DShowcase colorName={color} />
            ) : (
              <Object3DShape />
            )}
          </Suspense>
        </Turntable>
        <ContactShadows
          position={[0, -0.66, 0]}
          opacity={0.65}
          scale={5.5}
          blur={2.4}
          far={3}
          color="#000000"
        />
        {interactive && (
          <OrbitControls
            enabled={true}
            enablePan={false}
            enableZoom={false}
            minPolarAngle={0.5}
            maxPolarAngle={1.5}
            rotateSpeed={0.8}
          />
        )}
      </Canvas>
    </div>
  )
}
