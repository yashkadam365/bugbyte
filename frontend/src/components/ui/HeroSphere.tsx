'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

function IntelligenceSphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.1;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <Sphere ref={meshRef} args={[1.8, 64, 64]}>
        <MeshDistortMaterial
          color="#3b82f6"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
      <Sphere args={[2.2, 32, 32]}>
        <meshBasicMaterial
          color="#8b5cf6"
          transparent
          opacity={0.1}
          wireframe
        />
      </Sphere>
    </Float>
  );
}

function NetworkNodes() {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 50; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 3 + Math.random() * 0.5;
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
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {points.map((point, i) => (
        <mesh key={i} position={point}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color={i % 3 === 0 ? '#3b82f6' : i % 3 === 1 ? '#8b5cf6' : '#06b6d4'} />
        </mesh>
      ))}
    </group>
  );
}

export function HeroSphere() {
  return (
    <div className="sphere-container">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#3b82f6" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
        <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
        <IntelligenceSphere />
        <NetworkNodes />
      </Canvas>
    </div>
  );
}

// Fallback CSS-based sphere for when Three.js isn't available
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
          {/* Network dots */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="network-dot"
              style={{
                '--angle': `${(i * 18)}deg`,
                '--delay': `${i * 0.1}s`,
                '--distance': `${120 + Math.random() * 40}px`,
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
          width: 280px;
          height: 280px;
          transform-style: preserve-3d;
          animation: sphereRotate 20s linear infinite;
        }
        @keyframes sphereRotate {
          from { transform: rotateY(0deg) rotateX(10deg); }
          to { transform: rotateY(360deg) rotateX(10deg); }
        }
        .sphere-glow {
          position: absolute;
          inset: -40px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%);
          filter: blur(20px);
          animation: glowPulse 3s ease-in-out infinite;
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        .sphere-core {
          position: absolute;
          inset: 40px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #3b82f6 0%, #1e40af 50%, #0c1029 100%);
          box-shadow:
            0 0 60px rgba(59, 130, 246, 0.5),
            inset 0 0 60px rgba(139, 92, 246, 0.3);
        }
        .sphere-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid rgba(139, 92, 246, 0.3);
          transform-style: preserve-3d;
        }
        .ring-1 { transform: rotateX(70deg); }
        .ring-2 { transform: rotateX(70deg) rotateY(60deg); }
        .ring-3 { transform: rotateX(70deg) rotateY(120deg); }
        .network-dot {
          position: absolute;
          width: 6px;
          height: 6px;
          background: #3b82f6;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
          transform:
            rotate(var(--angle))
            translateX(var(--distance))
            translateZ(calc(var(--distance) * 0.3));
          animation: dotPulse 2s ease-in-out infinite;
          animation-delay: var(--delay);
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.3; transform: rotate(var(--angle)) translateX(var(--distance)) translateZ(calc(var(--distance) * 0.3)) scale(1); }
          50% { opacity: 1; transform: rotate(var(--angle)) translateX(var(--distance)) translateZ(calc(var(--distance) * 0.3)) scale(1.5); }
        }
      `}</style>
    </div>
  );
}

export default HeroSphere;
