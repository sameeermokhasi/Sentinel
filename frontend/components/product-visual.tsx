'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
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
    if (group.current && spin) group.current.rotation.y += delta * 0.5
    if (!inner.current) return
    t.current = Math.min(1, t.current + delta * 1.6)
    const e = t.current >= 1 ? 1 : 1 - Math.pow(2, -9 * t.current)
    inner.current.scale.setScalar(0.7 + e * 0.3)
    inner.current.position.y = (1 - e) * 0.4
  })

  return (
    <group ref={group}>
      <group ref={inner}>{children}</group>
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

function PumaSpeedcat3DShape({ colorName }: { colorName?: string }) {
  const mainRed = useMemo(() => {
    if (!colorName) return '#d91b24'
    const c = colorName.toLowerCase()
    if (c.includes('blue') || c.includes('navy')) return '#1e3a8a'
    if (c.includes('black')) return '#18181b'
    if (c.includes('white')) return '#f8fafc'
    if (c.includes('grey') || c.includes('gray')) return '#64748b'
    if (c.includes('brown')) return '#78350f'
    if (c.includes('green') || c.includes('olive')) return '#15803d'
    return '#d91b24'
  }, [colorName])

  const formstripCream = '#f4eedb'
  const outsoleBlack = '#0f172a'

  // Low-Profile Puma Speedcat Extruded Profile
  const upperGeo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.8, -0.22)
    s.lineTo(0.72, -0.22)
    s.quadraticCurveTo(0.88, -0.18, 0.82, -0.06) // Toe Box Low Curve
    s.lineTo(0.32, 0.04)
    s.lineTo(-0.12, 0.22) // Low Instep Slant
    s.quadraticCurveTo(-0.38, 0.26, -0.54, 0.18) // Low Collar
    s.quadraticCurveTo(-0.86, 0.05, -0.8, -0.22)

    const extrudeSettings = {
      depth: 0.5,
      bevelEnabled: true,
      bevelSegments: 8,
      steps: 2,
      bevelSize: 0.06,
      bevelThickness: 0.06,
    }
    const geo = new THREE.ExtrudeGeometry(s, extrudeSettings)
    geo.center()
    return geo
  }, [])

  return (
    <group rotation={[0.06, -0.5, 0]} position={[0, -0.05, 0]}>
      {/* Low-profile Black Driver Outsole Wrapped around Heel */}
      <mesh position={[0, -0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.72, 0.06, 0.58]} />
        <meshStandardMaterial color={outsoleBlack} roughness={0.8} />
      </mesh>
      
      {/* Curved Wrapped Heel Outsole Cap */}
      <mesh position={[-0.78, -0.1, 0]} rotation={[0, 0, 0.3]}>
        <sphereGeometry args={[0.26, 24, 24, 0, Math.PI, 0, Math.PI]} />
        <meshStandardMaterial color={outsoleBlack} roughness={0.8} />
      </mesh>

      {/* Main Red Suede Upper */}
      <mesh geometry={upperGeo} position={[0, -0.05, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={mainRed} roughness={0.7} metalness={0.02} />
      </mesh>

      {/* Off-White Curved Side Formstrip Ribbon */}
      <mesh position={[-0.05, -0.08, 0.28]} rotation={[0, 0.1, -0.12]}>
        <boxGeometry args={[0.92, 0.09, 0.02]} />
        <meshStandardMaterial color={formstripCream} roughness={0.4} />
      </mesh>
      <mesh position={[-0.05, -0.08, -0.28]} rotation={[0, -0.1, -0.12]}>
        <boxGeometry args={[0.92, 0.09, 0.02]} />
        <meshStandardMaterial color={formstripCream} roughness={0.4} />
      </mesh>

      {/* White Puma Cat Logo on Toe Box */}
      <mesh position={[0.62, -0.12, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.06, 0.06, 0.02, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>

      {/* Gold Foil Metallic Puma Logo near Eyelets */}
      <mesh position={[0.08, 0.06, 0.28]} rotation={[0, 0.1, 0]}>
        <boxGeometry args={[0.18, 0.08, 0.02]} />
        <meshStandardMaterial color={GOLD} roughness={0.2} metalness={0.9} />
      </mesh>
      <mesh position={[0.08, 0.06, -0.28]} rotation={[0, -0.1, 0]}>
        <boxGeometry args={[0.18, 0.08, 0.02]} />
        <meshStandardMaterial color={GOLD} roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Laces */}
      {[-0.08, 0.04, 0.16].map((xPos, i) => (
        <mesh key={i} position={[xPos, 0.04 + i * 0.04, 0]} rotation={[Math.PI / 2, 0, 0.2]}>
          <cylinderGeometry args={[0.014, 0.014, 0.38, 12]} />
          <meshStandardMaterial color={mainRed} roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

function Apparel3DShape({ colorName }: { colorName?: string }) {
  const mainColor = useMemo(() => {
    if (!colorName) return '#f8fafc'
    const c = colorName.toLowerCase()
    if (c.includes('red')) return '#dc2626'
    if (c.includes('blue') || c.includes('navy')) return '#1d4ed8'
    if (c.includes('black')) return '#18181b'
    if (c.includes('white')) return '#f8fafc'
    if (c.includes('grey') || c.includes('gray')) return '#64748b'
    if (c.includes('olive') || c.includes('green')) return '#365314'
    return '#f8fafc'
  }, [colorName])

  const shirtGeo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.3, 0.65)
    s.lineTo(0.3, 0.65)
    s.lineTo(0.75, 0.45)
    s.lineTo(0.55, 0.22)
    s.lineTo(0.42, 0.28)
    s.lineTo(0.42, -0.65)
    s.lineTo(-0.42, -0.65)
    s.lineTo(-0.42, 0.28)
    s.lineTo(-0.55, 0.22)
    s.lineTo(-0.75, 0.45)

    const extrudeSettings = {
      depth: 0.16,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.04,
    }
    const geo = new THREE.ExtrudeGeometry(s, extrudeSettings)
    geo.center()
    return geo
  }, [])

  return (
    <group rotation={[0.08, 0, 0]} position={[0, 0.05, 0]}>
      <mesh geometry={shirtGeo} castShadow receiveShadow>
        <meshStandardMaterial color={mainColor} roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.72, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.7, 16]} />
        <meshStandardMaterial color={GOLD} roughness={0.25} metalness={0.85} />
      </mesh>
      <mesh position={[0, 0.82, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.08, 0.012, 8, 24, Math.PI * 1.2]} />
        <meshStandardMaterial color={GOLD} roughness={0.25} metalness={0.85} />
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
      <ambientLight intensity={0.65} color="#ffffff" />
      <directionalLight
        position={[4, 5, 4]}
        intensity={2.2}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-4, 2, 2]} intensity={0.7} color={GOLD} />
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
        <Turntable spin={interactive} materialize={materialize}>
          {shape === 'footwear' ? (
            <PumaSpeedcat3DShape colorName={color} />
          ) : shape === 'apparel' ? (
            <Apparel3DShape colorName={color} />
          ) : (
            <Object3DShape />
          )}
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
