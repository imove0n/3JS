// @ts-nocheck
import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera, useTexture } from '@react-three/drei';
import { TextureLoader, Mesh, DoubleSide, AdditiveBlending, ShaderMaterial, Vector3, BackSide, DirectionalLight, Color } from 'three';

// --- 1. SUN LIGHT COMPONENT ---
const SunLight = () => {
  const lightRef = useRef(null);
  useFrame(({ clock }) => {
    if (lightRef.current) {
      const time = clock.getElapsedTime() * 0.15;
      const radius = 9;
      const x = Math.sin(time) * radius;
      const z = Math.cos(time) * radius;
      const y = Math.sin(time * 0.5) * 2;
      lightRef.current.position.set(x, y, z);
      lightRef.current.intensity = 2.5 + Math.sin(time) * 0.3;
      const height = Math.max(0, Math.min(1, (y + 2) / 4));
      const sunsetColor = new Color("#ffaa77");
      const noonColor = new Color("#fffbf0");
      const mixRatio = Math.pow(height, 0.5);
      lightRef.current.color.lerpColors(sunsetColor, noonColor, mixRatio);
    }
  });
  return (
    <directionalLight
      ref={lightRef}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-bias={-0.0001}
      shadow-normalBias={0.02}
      shadow-radius={4}
    />
  );
};

// --- 2. EARTH MODEL COMPONENT ---
const TEXTURE_URLS = {
  map: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
  normal: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
  specular: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
  clouds: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png',
  lights: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_lights_2048.png',
};

const EarthModel = () => {
  const earthRef = useRef(null);
  const cloudsRef = useRef(null);
  const lightsRef = useRef(null);
  const atmosphereRef = useRef(null);
  const lightsMaterialRef = useRef(null);
  const atmosphereMaterialRef = useRef(null);
  
  const { camera } = useThree();
  const textures = useTexture(TEXTURE_URLS);

  const lightsUniforms = useMemo(() => ({
    lightsTexture: { value: textures.lights },
    sunPosition: { value: new Vector3(0, 0, 0) },
  }), [textures.lights]);

  const atmosphereUniforms = useMemo(() => ({
    sunPosition: { value: new Vector3(0, 0, 0) },
    viewVector: { value: new Vector3(0, 0, 0) }
  }), []);

  useFrame(({ clock }) => {
    const elapsedTime = clock.getElapsedTime();
    if (cloudsRef.current) cloudsRef.current.rotation.y = elapsedTime * 0.015;
    const time = elapsedTime * 0.15;
    const radius = 9;
    const sunPos = new Vector3(Math.sin(time) * radius, Math.sin(time * 0.5) * 2, Math.cos(time) * radius);

    if (lightsMaterialRef.current) lightsMaterialRef.current.uniforms.sunPosition.value.copy(sunPos);
    if (atmosphereMaterialRef.current) {
      atmosphereMaterialRef.current.uniforms.sunPosition.value.copy(sunPos);
      atmosphereMaterialRef.current.uniforms.viewVector.value.copy(camera.position);
    }
  });

  return (
    <group rotation={[0, 0, 23.5 * (Math.PI / 180)]}>
      <mesh ref={earthRef} castShadow receiveShadow>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial map={textures.map} normalMap={textures.normal} normalScale={[0.5, 0.5]} specularMap={textures.specular} specular={0x333333} shininess={15} />
      </mesh>
      <mesh ref={lightsRef} scale={[1.002, 1.002, 1.002]}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          ref={lightsMaterialRef} transparent blending={AdditiveBlending} uniforms={lightsUniforms}
          vertexShader={`varying vec2 vUv; varying vec3 vNormal; void main() { vUv = uv; vNormal = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
          fragmentShader={`uniform sampler2D lightsTexture; uniform vec3 sunPosition; varying vec2 vUv; varying vec3 vNormal; void main() { vec3 lightDir = normalize(sunPosition); float dotProd = dot(vNormal, lightDir); float visibility = 1.0 - smoothstep(-0.2, 0.1, dotProd); vec4 lightsColor = texture2D(lightsTexture, vUv); vec3 warmColor = lightsColor.rgb * vec3(1.0, 0.8, 0.6); gl_FragColor = vec4(warmColor, visibility * lightsColor.r); }`}
        />
      </mesh>
      <mesh ref={cloudsRef} castShadow receiveShadow>
        <sphereGeometry args={[1.01, 64, 64]} />
        <meshStandardMaterial map={textures.clouds} transparent opacity={0.9} side={DoubleSide} alphaTest={0.1} />
      </mesh>
      <mesh ref={atmosphereRef} scale={[1.15, 1.15, 1.15]}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          ref={atmosphereMaterialRef} transparent side={BackSide} blending={AdditiveBlending} depthWrite={false} uniforms={atmosphereUniforms}
          vertexShader={`varying vec3 vNormal; varying vec3 vPositionWorld; void main() { vNormal = normalize(mat3(modelMatrix) * normal); vec4 worldPosition = modelMatrix * vec4(position, 1.0); vPositionWorld = worldPosition.xyz; gl_Position = projectionMatrix * viewMatrix * worldPosition; }`}
          fragmentShader={`uniform vec3 sunPosition; uniform vec3 viewVector; varying vec3 vNormal; varying vec3 vPositionWorld; void main() { vec3 viewDirection = normalize(viewVector - vPositionWorld); vec3 normal = normalize(vNormal); vec3 lightDirection = normalize(sunPosition); float intensity = pow(0.6 + dot(normal, viewDirection), 4.0); float sunOrientation = dot(normal, lightDirection); float dayMask = smoothstep(-0.6, 0.6, sunOrientation); float terminator = 1.0 - abs(sunOrientation); vec3 atmosphereColor = vec3(0.3, 0.6, 1.0); vec3 sunsetColor = vec3(1.0, 0.4, 0.1); float sunsetInfluence = smoothstep(0.4, 1.0, terminator) * 0.5; vec3 finalColor = mix(atmosphereColor, sunsetColor, sunsetInfluence); gl_FragColor = vec4(finalColor, intensity * (dayMask * 0.6 + 0.4)); }`}
        />
      </mesh>
    </group>
  );
};

// --- 3. BACKGROUND COMPONENT ---
const AtmosphericBackground = () => {
  const { scene } = useThree();
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime() * 0.15;
    const pulse = (Math.sin(time) + 1) * 0.5;
    const intensity = 0.02;
    scene.background = new Color(0.005 + pulse * intensity * 0.5, 0.01 + pulse * intensity, 0.03 + pulse * intensity * 1.5);
  });
  return null;
};

// --- 4. MAIN SCENE ---
export default function EarthScene({ starSettings }) {
  return (
    <Canvas shadows="soft" dpr={[1, 2]} gl={{ antialias: true, toneMappingExposure: 1.0 }} style={{ width: '100%', height: '100%', background: 'black' }}>
      <PerspectiveCamera makeDefault position={[0, 0, 3.5]} fov={45} />
      <AtmosphericBackground />
      <Stars radius={300} depth={50} count={starSettings.count} factor={starSettings.factor} saturation={0} fade speed={1} />
      <ambientLight intensity={0.04} color="#202040" />
      <SunLight />
      
      {/* Fallback to show something immediately */}
      <Suspense fallback={
        <mesh>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color="#0ea5e9" wireframe transparent opacity={0.2} />
        </mesh>
      }>
        <EarthModel />
      </Suspense>

      <OrbitControls enablePan={false} enableZoom={true} minDistance={2.5} maxDistance={12} zoomSpeed={0.6} rotateSpeed={0.5} autoRotate={true} autoRotateSpeed={0.2} />
    </Canvas>
  );
}