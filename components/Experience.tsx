import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { TreeMorphState } from '../types';
import LuxuryTree from './LuxuryTree';
import * as THREE from 'three';

interface ExperienceProps {
  mode: TreeMorphState;
}

const Experience: React.FC<ExperienceProps> = ({ mode }) => {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ 
        antialias: false, 
        toneMapping: THREE.ACESFilmicToneMapping, 
        toneMappingExposure: 1.2,
        alpha: false
      }}
    >
      <color attach="background" args={['#000904']} /> {/* Very Dark Emerald/Black */}
      
      {/* Cinematic Camera */}
      <PerspectiveCamera makeDefault position={[0, 1, 14]} fov={45} />
      <OrbitControls 
        enablePan={false} 
        enableZoom={true} 
        minDistance={8} 
        maxDistance={25}
        autoRotate={mode === TreeMorphState.TREE_SHAPE}
        autoRotateSpeed={0.8}
        maxPolarAngle={Math.PI / 1.7}
      />

      {/* Lighting - Arix Signature (Gold & Emerald) */}
      <ambientLight intensity={0.3} color="#003311" /> {/* Deep Emerald Ambient */}
      
      {/* Main Key Light - Warm Gold */}
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.25} 
        penumbra={1} 
        intensity={3} 
        color="#FFE5B4" // Peach/Gold
        castShadow 
      />
      
      {/* Fill Light - Cool Emerald */}
      <pointLight position={[-10, 5, -10]} intensity={1.5} color="#2E8B57" />

      {/* Rim Light - Sharp Gold */}
      <pointLight position={[0, -5, 10]} intensity={1.0} color="#FFD700" />

      {/* The Arix Signature Tree */}
      <LuxuryTree mode={mode} />

      {/* Environment - Star Field */}
      <Stars radius={100} depth={60} count={6000} factor={4} saturation={1} fade speed={0.5} />

      {/* Post Processing - High Luxury Glow */}
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.4} // Only bloom very bright things (Gold highlights)
          mipmapBlur 
          intensity={2.0} 
          radius={0.5}
          levels={9}
        />
        <Noise opacity={0.03} />
        <Vignette eskil={false} offset={0.1} darkness={1.2} />
      </EffectComposer>
    </Canvas>
  );
};

export default Experience;
