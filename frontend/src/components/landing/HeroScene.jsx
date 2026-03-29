import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, MeshWobbleMaterial } from '@react-three/drei'
import { Suspense, useRef, useMemo } from 'react'
import * as THREE from 'three'

function GlowTorus() {
  const ref = useRef()
  useFrame((state) => {
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.3
    ref.current.rotation.y += 0.004
  })
  return (
    <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={ref}>
        <torusGeometry args={[1.2, 0.35, 32, 64]} />
        <MeshDistortMaterial
          color="#d97706"
          emissive="#92400e"
          emissiveIntensity={0.4}
          roughness={0.2}
          metalness={0.8}
          distort={0.15}
          speed={2}
          transparent
          opacity={0.85}
        />
      </mesh>
    </Float>
  )
}

function FloatingOrbs() {
  const orbs = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        position: [
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 3,
        ],
        scale: 0.15 + Math.random() * 0.2,
        speed: 0.5 + Math.random() * 1.5,
        color: i % 2 === 0 ? '#f59e0b' : '#fbbf24',
      })),
    [],
  )

  return orbs.map((orb, i) => (
    <Float key={i} speed={orb.speed} floatIntensity={0.8} rotationIntensity={0.2}>
      <mesh position={orb.position} scale={orb.scale}>
        <sphereGeometry args={[1, 16, 16]} />
        <MeshWobbleMaterial
          color={orb.color}
          emissive={orb.color}
          emissiveIntensity={0.6}
          transparent
          opacity={0.5}
          factor={0.4}
          speed={orb.speed}
        />
      </mesh>
    </Float>
  ))
}

function Particles() {
  const count = 40
  const ref = useRef()
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4
    }
    return pos
  }, [])

  useFrame((state) => {
    ref.current.rotation.y = state.clock.elapsedTime * 0.02
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.1
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#f59e0b" transparent opacity={0.6} sizeAttenuation />
    </points>
  )
}

export function HeroScene() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 1.5]}
        style={{ pointerEvents: 'none' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} color="#fbbf24" />
        <pointLight position={[-3, -2, 2]} intensity={0.5} color="#f59e0b" />
        <Suspense fallback={null}>
          <GlowTorus />
          <FloatingOrbs />
          <Particles />
        </Suspense>
      </Canvas>
    </div>
  )
}
