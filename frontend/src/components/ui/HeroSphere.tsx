'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

function IntelligenceSphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.08;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.12;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}>
      {/* Main sphere — orange/gold with metallic sheen */}
      <Sphere ref={meshRef} args={[2.2, 64, 64]}>
        <MeshDistortMaterial
          color="#F7931A"
          attach="material"
          distort={0.35}
          speed={1.8}
          roughness={0.15}
          metalness={0.9}
        />
      </Sphere>
      {/* Wireframe outer shell */}
      <Sphere args={[2.7, 32, 32]}>
        <meshBasicMaterial
          color="#EA580C"
          transparent
          opacity={0.08}
          wireframe
        />
      </Sphere>
      {/* Second orbital wireframe */}
      <Sphere args={[3.0, 24, 24]}>
        <meshBasicMaterial
          color="#FFD600"
          transparent
          opacity={0.04}
          wireframe
        />
      </Sphere>
    </Float>
  );
}

function NetworkNodes() {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 60; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 3.5 + Math.random() * 0.6;
      pts.push(new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      ));
    }
    return pts;
  }, []);

  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.04;
    }
  });

  const colors = ['#F7931A', '#EA580C', '#FFD600', '#f59e0b', '#fb923c'];

  return (
    <group ref={groupRef}>
      {points.map((point, i) => (
        <mesh key={i} position={point}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshBasicMaterial color={colors[i % colors.length]} />
        </mesh>
      ))}
    </group>
  );
}

export function HeroSphere() {
  return (
    <div className="sphere-container">
      <Canvas camera={{ position: [0, 0, 7], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.2} color="#F7931A" />
        <pointLight position={[-10, -10, -10]} intensity={0.6} color="#FFD600" />
        <pointLight position={[0, 10, -5]} intensity={0.3} color="#EA580C" />
        <Stars radius={100} depth={50} count={800} factor={3} saturation={0} fade speed={0.8} />
        <IntelligenceSphere />
        <NetworkNodes />
      </Canvas>
    </div>
  );
}

// Fallback CSS-based sphere — orange theme
export function HeroSphereFallback() {
  return (
    <div className="sphere-container" style={{ position: 'relative' }}>
      <div className="css-sphere-wrapper">
        <div className="css-sphere">
          <div className="sphere-glow" />
          <div className="sphere-core" />
          <div className="sphere-ring ring-1" />
          <div className="sphere-ring ring-2" />
          <div className="sphere-ring ring-3" />
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="network-dot"
              style={{
                '--angle': `${(i * 15)}deg`,
                '--delay': `${i * 0.08}s`,
                '--distance': `${130 + Math.random() * 40}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      </div>
      <style jsx>{`
        .css-sphere-wrapper {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          perspective: 1000px;
        }
        .css-sphere {
          position: relative;
          width: 320px;
          height: 320px;
          transform-style: preserve-3d;
          animation: sphereRotate 20s linear infinite;
        }
        @keyframes sphereRotate {
          from { transform: rotateY(0deg) rotateX(10deg); }
          to { transform: rotateY(360deg) rotateX(10deg); }
        }
        .sphere-glow {
          position: absolute;
          inset: -50px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(247, 147, 26, 0.3) 0%, transparent 70%);
          filter: blur(25px);
          animation: glowPulse 3s ease-in-out infinite;
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.15); }
        }
        .sphere-core {
          position: absolute;
          inset: 40px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #F7931A 0%, #EA580C 50%, #0F1115 100%);
          box-shadow:
            0 0 80px rgba(247, 147, 26, 0.5),
            inset 0 0 60px rgba(234, 88, 12, 0.3);
        }
        .sphere-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid rgba(247, 147, 26, 0.2);
          transform-style: preserve-3d;
        }
        .ring-1 { transform: rotateX(70deg); }
        .ring-2 { transform: rotateX(70deg) rotateY(60deg); }
        .ring-3 { transform: rotateX(70deg) rotateY(120deg); }
        .network-dot {
          position: absolute;
          width: 5px;
          height: 5px;
          background: #F7931A;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          box-shadow: 0 0 10px rgba(247, 147, 26, 0.7);
          transform:
            rotate(var(--angle))
            translateX(var(--distance))
            translateZ(calc(var(--distance) * 0.3));
          animation: dotPulse 2.5s ease-in-out infinite;
          animation-delay: var(--delay);
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.3; transform: rotate(var(--angle)) translateX(var(--distance)) translateZ(calc(var(--distance) * 0.3)) scale(1); }
          50% { opacity: 1; transform: rotate(var(--angle)) translateX(var(--distance)) translateZ(calc(var(--distance) * 0.3)) scale(1.8); }
        }
      `}</style>
    </div>
  );
}

export default HeroSphere;
