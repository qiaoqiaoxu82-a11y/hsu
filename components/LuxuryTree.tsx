import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMorphState } from '../types';

// Shader for Arix Signature Tree
const ArixTreeShader = {
  uniforms: {
    uTime: { value: 0 },
    uMorphFactor: { value: 0 }, // 0 = Tree, 1 = Scattered
  },
  vertexShader: `
    uniform float uTime;
    uniform float uMorphFactor;
    
    attribute vec3 aTreePos;
    attribute vec3 aScatterPos;
    attribute vec3 aColor;
    attribute float aSize;
    attribute vec3 aRandom;
    
    varying vec3 vColor;
    varying float vSparkle;

    // Simplex Noise (Ashima Arts)
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 = v - i + dot(i, C.xxx) ;
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute( permute( permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
      float n_ = 0.142857142857;
      vec3  ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                    dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
      vColor = aColor;
      
      // Dual Position System Logic
      // Morph between Tree Position and Scatter Position
      vec3 currentPos = mix(aTreePos, aScatterPos, uMorphFactor);
      
      // Add "Breathing" / Floating effect when in Scattered state
      // We scale the noise amplitude by uMorphFactor so the tree is stable when assembled
      float floatAmp = uMorphFactor * 1.5;
      vec3 noiseOffset;
      noiseOffset.x = snoise(vec3(uTime * 0.1, aRandom.y, 0.0));
      noiseOffset.y = snoise(vec3(aRandom.x, uTime * 0.15, 0.0)) * 1.5; // More vertical drift
      noiseOffset.z = snoise(vec3(0.0, aRandom.z, uTime * 0.1));
      
      currentPos += noiseOffset * floatAmp;

      // Vortex / Spin effect during transition
      // Only apply spin when morphing (between 0.1 and 0.9)
      float spinIntensity = sin(uMorphFactor * 3.14159); // Bell curve peaking at 0.5
      if (spinIntensity > 0.01) {
         float angle = spinIntensity * 4.0 * (1.0 - length(aTreePos.xz) * 0.1);
         float s = sin(angle);
         float c = cos(angle);
         mat2 rot = mat2(c, -s, s, c);
         currentPos.xz = rot * currentPos.xz;
      }

      vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // Size calculation
      // Particles pulse slightly in scattered mode
      float pulse = 1.0 + sin(uTime * 2.0 + aRandom.x * 10.0) * 0.2 * uMorphFactor;
      gl_PointSize = (aSize * 400.0 * pulse) / -mvPosition.z;
      
      // Generate sparkle value for fragment
      vSparkle = snoise(currentPos * 0.5 + uTime * 2.0);
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying float vSparkle;

    void main() {
      // Create a sharp diamond-like shape
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      
      // Sharp core
      float core = 1.0 - smoothstep(0.0, 0.15, dist);
      // Soft glow
      float glow = 1.0 - smoothstep(0.0, 0.5, dist);
      
      float alpha = core + glow * 0.4;
      if (alpha < 0.01) discard;

      // Sparkle / Glint animation
      // Make the gold particles twinkle more aggressively
      float twinkle = 0.7 + 0.3 * sin(vSparkle * 10.0);
      
      vec3 finalColor = vColor * twinkle;
      
      // Boost exposure for Bloom
      finalColor *= 3.0;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

interface LuxuryTreeProps {
  mode: TreeMorphState;
}

const LuxuryTree: React.FC<LuxuryTreeProps> = ({ mode }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Particle Count
  const count = 5000;

  const { treePositions, scatterPositions, sizes, colors, randoms } = useMemo(() => {
    const treePos = new Float32Array(count * 3);
    const scatterPos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const col = new Float32Array(count * 3);
    const rnd = new Float32Array(count * 3);

    // Color Palette
    const emeraldDeep = new THREE.Color('#004225'); // British Racing / Emerald
    const emeraldBright = new THREE.Color('#50C878'); // Emerald Green
    const goldDeep = new THREE.Color('#B8860B'); // Dark Goldenrod
    const goldBright = new THREE.Color('#FFD700'); // Gold

    for (let i = 0; i < count; i++) {
      const t = i / count;
      
      // --- 1. Tree Position (Cone Spiral) ---
      const angle = t * Math.PI * 75; 
      const radius = t * 4.5; 
      const y = (1 - t) * 11.0 - 5.5; 
      
      // Add organic noise to tree shape
      const r = radius + (Math.random() - 0.5) * 0.6;
      treePos[i * 3] = r * Math.cos(angle);
      treePos[i * 3 + 1] = y;
      treePos[i * 3 + 2] = r * Math.sin(angle);

      // --- 2. Scatter Position (Random Sphere) ---
      // Distribute in a large sphere around the center
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const spreadR = 12.0 + Math.random() * 8.0; // Radius 12-20
      
      scatterPos[i * 3] = spreadR * Math.sin(phi) * Math.cos(theta);
      scatterPos[i * 3 + 1] = spreadR * Math.sin(phi) * Math.sin(theta);
      scatterPos[i * 3 + 2] = spreadR * Math.cos(phi);

      // --- 3. Colors & Type ---
      // 80% Emerald Needles, 20% Gold Ornaments
      const isOrnament = Math.random() > 0.85;
      
      let c;
      if (isOrnament) {
        c = goldDeep.clone().lerp(goldBright, Math.random());
        sz[i] = Math.random() * 0.8 + 0.6; // Bigger ornaments
      } else {
        // Gradient from deep bottom to bright top
        c = emeraldDeep.clone().lerp(emeraldBright, Math.pow(1.0 - t, 0.5));
        // Add random variation
        c.lerp(new THREE.Color('#002211'), Math.random() * 0.3);
        sz[i] = Math.random() * 0.4 + 0.1; // Smaller needles
      }

      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;

      // --- 4. Randoms ---
      rnd[i * 3] = Math.random();
      rnd[i * 3 + 1] = Math.random();
      rnd[i * 3 + 2] = Math.random();
    }

    return { 
      treePositions: treePos, 
      scatterPositions: scatterPos, 
      sizes: sz, 
      colors: col, 
      randoms: rnd 
    };
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      const time = state.clock.getElapsedTime();
      materialRef.current.uniforms.uTime.value = time;

      // Morph Transition Logic
      const target = mode === TreeMorphState.SCATTERED ? 1.0 : 0.0;
      const current = materialRef.current.uniforms.uMorphFactor.value;
      
      // Speed settings
      const speed = mode === TreeMorphState.SCATTERED ? 0.025 : 0.02; // Slow luxury feel
      
      // Smooth interpolation
      materialRef.current.uniforms.uMorphFactor.value += (target - current) * speed * 60 * state.clock.getDelta();
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} position={[0, -1, 0]}>
      {/* Octahedron for gem-like quality */}
      <octahedronGeometry args={[0.08, 0]}>
        <instancedBufferAttribute attach="attributes-position" args={[treePositions, 3]} />
      </octahedronGeometry>
      <shaderMaterial
        ref={materialRef}
        attach="material"
        args={[ArixTreeShader]}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
      
      {/* Dual Position Attributes */}
      <instancedBufferAttribute attach="geometry-attributes-aTreePos" args={[treePositions, 3]} />
      <instancedBufferAttribute attach="geometry-attributes-aScatterPos" args={[scatterPositions, 3]} />
      
      {/* Other Attributes */}
      <instancedBufferAttribute attach="geometry-attributes-aColor" args={[colors, 3]} />
      <instancedBufferAttribute attach="geometry-attributes-aSize" args={[sizes, 1]} />
      <instancedBufferAttribute attach="geometry-attributes-aRandom" args={[randoms, 3]} />
    </instancedMesh>
  );
};

export default LuxuryTree;
