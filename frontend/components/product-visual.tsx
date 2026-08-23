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

function Shoe3DShape({ colorName }: { colorName?: string }) {
  const mainColor = useMemo(() => {
    if (!colorName) return '#dc2626'
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

  // Realistic Shoe Side Profile Extrusion
  const shoeUpperGeo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.75, -0.15)
    s.lineTo(0.65, -0.15)
    s.quadraticCurveTo(0.82, -0.1, 0.78, 0.02)
    s.lineTo(0.28, 0.08)
    s.lineTo(-0.08, 0.32)
    s.quadraticCurveTo(-0.35, 0.38, -0.52, 0.28)
    s.quadraticCurveTo(-0.82, 0.12, -0.75, -0.15)

    const extrudeSettings = {
      depth: 0.52,
      bevelEnabled: true,
      bevelSegments: 8,
      steps: 2,
      bevelSize: 0.07,
      bevelThickness: 0.07,
    }
    const geo = new THREE.ExtrudeGeometry(s, extrudeSettings)
    geo.center()
    return geo
  }, [])

  // Sleek Molded Sole Extrusion
  const shoeSoleGeo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.85, -0.32)
    s.lineTo(0.75, -0.32)
    s.quadraticCurveTo(0.88, -0.28, 0.85, -0.15)
    s.lineTo(-0.82, -0.15)
    s.quadraticCurveTo(-0.88, -0.25, -0.85, -0.32)

    const extrudeSettings = {
      depth: 0.58,
      bevelEnabled: true,
      bevelSegments: 6,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.04,
    }
    const geo = new THREE.ExtrudeGeometry(s, extrudeSettings)
    geo.center()
    return geo
  }, [])

  return (
    <group rotation={[0.05, -0.55, 0]} position={[0, -0.05, 0]}>
      {/* Molded Athletic Midsole / Outsole */}
      <mesh geometry={shoeSoleGeo} position={[0, -0.28, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.08} />
      </mesh>

      {/* Rubber Outsole Tread Base */}
      <mesh position={[0, -0.42, 0]} receiveShadow>
        <boxGeometry args={[1.72, 0.04, 0.62]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>

      {/* Main Extruded Shoe Upper */}
      <mesh geometry={shoeUpperGeo} position={[0, -0.02, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={mainColor} roughness={0.35} metalness={0.1} />
      </mesh>

      {/* Ankle Collar Loop */}
      <mesh position={[-0.32, 0.24, 0]} rotation={[Math.PI / 2, 0.2, 0]} castShadow>
        <torusGeometry args={[0.21, 0.06, 16, 32]} />
        <meshStandardMaterial color="#020617" roughness={0.5} />
      </mesh>

      {/* Tongue Padding */}
      <mesh position={[0.04, 0.24, 0]} rotation={[0, 0, -0.5]} castShadow>
        <boxGeometry args={[0.42, 0.05, 0.34]} />
        <meshStandardMaterial color="#020617" roughness={0.6} />
      </mesh>

      {/* Laces across instep */}
      {[-0.04, 0.08, 0.2].map((xPos, i) => (
        <mesh key={i} position={[xPos, 0.09 + i * 0.045, 0]} rotation={[Math.PI / 2, 0, 0.25]} castShadow>
          <cylinderGeometry args={[0.016, 0.016, 0.42, 12]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.2} />
        </mesh>
      ))}

      {/* Side Formstrip / Wave Stripe Accent */}
      <mesh position={[-0.02, -0.04, 0.31]} rotation={[0, 0.1, -0.22]}>
        <boxGeometry args={[0.82, 0.07, 0.02]} />
        <meshStandardMaterial color={GOLD} roughness={0.2} metalness={0.85} />
      </mesh>
      <mesh position={[-0.02, -0.04, -0.31]} rotation={[0, -0.1, -0.22]}>
        <boxGeometry args={[0.82, 0.07, 0.02]} />
        <meshStandardMaterial color={GOLD} roughness={0.2} metalness={0.85} />
      </mesh>

      {/* Heel Tab */}
      <mesh position={[-0.72, 0.12, 0]} rotation={[0, 0, 0.2]} castShadow>
        <boxGeometry args={[0.08, 0.22, 0.24]} />
        <meshStandardMaterial color={GOLD} roughness={0.3} metalness={0.7} />
      </mesh>
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

  // 3D T-Shirt / Jacket Extrusion
  const shirtGeo = useMemo(() => {
    const s = new THREE.Shape()
    // Collar & shoulders
    s.moveTo(-0.3, 0.65)
    s.lineTo(0.3, 0.65)
    s.lineTo(0.75, 0.45) // right sleeve
    s.lineTo(0.55, 0.22)
    s.lineTo(0.42, 0.28)
    s.lineTo(0.42, -0.65) // right hem
    s.lineTo(-0.42, -0.65) // left hem
    s.lineTo(-0.42, 0.28)
    s.lineTo(-0.55, 0.22)
    s.lineTo(-0.75, 0.45) // left sleeve

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
      {/* 3D Garment Mesh */}
      <mesh geometry={shirtGeo} castShadow receiveShadow>
        <meshStandardMaterial color={mainColor} roughness={0.6} metalness={0.05} />
      </mesh>
      {/* Gold Hanger Bar */}
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
            <Shoe3DShape colorName={color} />
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
