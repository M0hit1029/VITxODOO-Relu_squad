import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial } from '@react-three/drei'
import { Suspense, useRef, useMemo } from 'react'
import * as THREE from 'three'

function MiniOrb({ position, color, speed, scale }) {
  const ref = useRef()
  useFrame((state) => {
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * speed) * 0.5
    ref.current.rotation.y += 0.005 * speed
  })
  return (
    <Float speed={speed} floatIntensity={0.5} rotationIntensity={0.3}>
      <mesh ref={ref} position={position} scale={scale}>
        <icosahedronGeometry args={[1, 1]} />
        <MeshDistortMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          roughness={0.3}
          metalness={0.7}
          distort={0.2}
          speed={1.5}
          transparent
          opacity={0.7}
        />
      </mesh>
    </Float>
  )
}

export function FeatureMiniScene() {
  return (
    <div className="absolute right-0 top-0 h-full w-1/3 pointer-events-none opacity-50" style={{ zIndex: 0 }}>
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }} dpr={[1, 1.5]} gl={{ alpha: true }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[2, 2, 3]} intensity={0.6} color="#f59e0b" />
        <Suspense fallback={null}>
          <MiniOrb position={[0.5, 0.8, 0]} color="#f59e0b" speed={1.2} scale={0.35} />
          <MiniOrb position={[-0.8, -0.5, 0.5]} color="#fbbf24" speed={0.8} scale={0.25} />
          <MiniOrb position={[1, -0.8, -0.3]} color="#d97706" speed={1.5} scale={0.2} />
        </Suspense>
      </Canvas>
    </div>
  )
}

export function TestimonialMiniScene() {
  const Dots = () => {
    const count = 20
    const ref = useRef()
    const positions = useMemo(() => {
      const pos = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 6
        pos[i * 3 + 1] = (Math.random() - 0.5) * 4
        pos[i * 3 + 2] = (Math.random() - 0.5) * 2
      }
      return pos
    }, [])

    useFrame((state) => {
      ref.current.rotation.y = state.clock.elapsedTime * 0.03
    })

    return (
      <points ref={ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.06} color="#fbbf24" transparent opacity={0.4} sizeAttenuation />
      </points>
    )
  }

  return (
    <div className="absolute inset-0 pointer-events-none opacity-40" style={{ zIndex: 0 }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} dpr={[1, 1.5]} gl={{ alpha: true }}>
        <Suspense fallback={null}>
          <Dots />
        </Suspense>
      </Canvas>
    </div>
  )
}
