// @ts-nocheck
import React, { useRef, useMemo } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { TextureLoader, Mesh, DoubleSide, AdditiveBlending, ShaderMaterial, Vector3, BackSide } from 'three';

// Define texture URLs
const TEXTURE_URLS = {
  map: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
  normal: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
  specular: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
  clouds: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png',
  lights: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_lights_2048.png',
};

export default function EarthModel() {
  const earthRef = useRef<Mesh>(null);
  const cloudsRef = useRef<Mesh>(null);
  const lightsRef = useRef<Mesh>(null);
  const atmosphereRef = useRef<Mesh>(null);
  const lightsMaterialRef = useRef<ShaderMaterial>(null);
  const atmosphereMaterialRef = useRef<ShaderMaterial>(null);
  
  const { camera } = useThree();

  // Load textures
  const [colorMap, normalMap, specularMap, cloudsMap, lightsMap] = useLoader(TextureLoader, [
    TEXTURE_URLS.map,
    TEXTURE_URLS.normal,
    TEXTURE_URLS.specular,
    TEXTURE_URLS.clouds,
    TEXTURE_URLS.lights,
  ]);

  // Define uniforms for the city lights shader
  const lightsUniforms = useMemo(() => ({
    lightsTexture: { value: lightsMap },
    sunPosition: { value: new Vector3(0, 0, 0) },
  }), [lightsMap]);

  // Define uniforms for the atmosphere shader
  const atmosphereUniforms = useMemo(() => ({
    sunPosition: { value: new Vector3(0, 0, 0) },
    viewVector: { value: new Vector3(0, 0, 0) }
  }), []);

  useFrame(({ clock }) => {
    const elapsedTime = clock.getElapsedTime();

    // Subtle independent rotation for clouds
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = elapsedTime * 0.015;
    }

    // Calculate Sun Position (matches SunLight.tsx logic)
    const time = elapsedTime * 0.15; // Same speed as SunLight
    const radius = 9; // Same radius as SunLight
    const sunPos = new Vector3(
      Math.sin(time) * radius,
      Math.sin(time * 0.5) * 2,
      Math.cos(time) * radius
    );

    // Update City Lights Shader
    if (lightsMaterialRef.current) {
      lightsMaterialRef.current.uniforms.sunPosition.value.copy(sunPos);
    }

    // Update Atmosphere Shader
    if (atmosphereMaterialRef.current) {
      atmosphereMaterialRef.current.uniforms.sunPosition.value.copy(sunPos);
      atmosphereMaterialRef.current.uniforms.viewVector.value.copy(camera.position);
    }
  });

  return (
    <group rotation={[0, 0, 23.5 * (Math.PI / 180)]}> {/* Axial tilt of Earth */}
      
      {/* Main Earth Sphere */}
      <mesh ref={earthRef} castShadow receiveShadow>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial
          map={colorMap}
          normalMap={normalMap}
          normalScale={[0.5, 0.5] as any}
          specularMap={specularMap}
          specular={0x333333} // Controls shininess intensity
          shininess={15}
        />
      </mesh>

      {/* City Lights Layer */}
      <mesh ref={lightsRef} scale={[1.002, 1.002, 1.002]}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          ref={lightsMaterialRef}
          transparent={true}
          blending={AdditiveBlending}
          uniforms={lightsUniforms}
          vertexShader={`
            varying vec2 vUv;
            varying vec3 vNormal;
            void main() {
              vUv = uv;
              // Calculate world normal to compare with world sun position
              vNormal = normalize(mat3(modelMatrix) * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform sampler2D lightsTexture;
            uniform vec3 sunPosition;
            varying vec2 vUv;
            varying vec3 vNormal;

            void main() {
              vec3 lightDir = normalize(sunPosition);
              
              // Dot product determines if face is looking at sun (>0) or away (<0)
              float dotProd = dot(vNormal, lightDir);
              
              // Mask the lights: visible on night side (dot < 0), fade out at terminator
              // smoothstep creates a soft transition band between day and night
              float visibility = 1.0 - smoothstep(-0.2, 0.1, dotProd);
              
              vec4 lightsColor = texture2D(lightsTexture, vUv);
              
              // Apply orange/gold tint to lights for realism and multiply by visibility
              vec3 warmColor = lightsColor.rgb * vec3(1.0, 0.8, 0.6);
              
              gl_FragColor = vec4(warmColor, visibility * lightsColor.r); 
            }
          `}
        />
      </mesh>

      {/* Cloud Layer */}
      <mesh ref={cloudsRef} castShadow receiveShadow>
        <sphereGeometry args={[1.01, 64, 64]} />
        <meshStandardMaterial
          map={cloudsMap}
          transparent={true}
          opacity={0.9}
          side={DoubleSide}
          // Enable alphaTest to ensure only the opaque parts (clouds) cast shadows, not the transparent background
          alphaTest={0.1}
        />
      </mesh>

      {/* Atmospheric Scattering Glow */}
      <mesh ref={atmosphereRef} scale={[1.15, 1.15, 1.15]}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          ref={atmosphereMaterialRef}
          transparent={true}
          side={BackSide} 
          blending={AdditiveBlending}
          depthWrite={false}
          uniforms={atmosphereUniforms}
          vertexShader={`
            varying vec3 vNormal;
            varying vec3 vPositionWorld;
            void main() {
              // World space normal
              vNormal = normalize(mat3(modelMatrix) * normal);
              // World space position
              vec4 worldPosition = modelMatrix * vec4(position, 1.0);
              vPositionWorld = worldPosition.xyz;
              
              gl_Position = projectionMatrix * viewMatrix * worldPosition;
            }
          `}
          fragmentShader={`
            uniform vec3 sunPosition;
            uniform vec3 viewVector;
            varying vec3 vNormal;
            varying vec3 vPositionWorld;

            void main() {
              vec3 viewDirection = normalize(viewVector - vPositionWorld);
              vec3 normal = normalize(vNormal);
              vec3 lightDirection = normalize(sunPosition);

              // Calculate view alignment (Fresnel effect)
              // For BackSide, normal points IN. ViewDir points to camera (OUT).
              // So dot(normal, viewDirection) is roughly -1 at center, 0 at edge.
              // We want glow at edge (dot approx 0).
              float viewDot = dot(normal, viewDirection);
              float intensity = pow(0.6 + dot(normal, viewDirection), 4.0);
              
              // Sun influence (Day vs Night)
              // Normal points IN. Light points to Sun.
              // If normal is opposed to light (dot < 0), it's the "lit" side of the sphere (inner surface).
              // Actually, simpler to think in terms of alignment.
              // We want the atmosphere to be brighter where the sun hits it.
              float sunOrientation = dot(normal, lightDirection);
              
              // Scattering intensity
              // The glow should be strongest on the day side
              float dayMask = smoothstep(-0.6, 0.6, sunOrientation); 
              
              // Sunset/Terminator color shift
              // When sunOrientation is near 0 (terminator), add reddish tint
              float terminator = 1.0 - abs(sunOrientation);
              vec3 atmosphereColor = vec3(0.3, 0.6, 1.0); // Blue
              vec3 sunsetColor = vec3(1.0, 0.4, 0.1); // Orange/Red
              
              // Mix colors based on position relative to sun
              // Shift towards sunset color at terminator
              float sunsetInfluence = smoothstep(0.4, 1.0, terminator) * 0.5;
              vec3 finalColor = mix(atmosphereColor, sunsetColor, sunsetInfluence);

              // Combine
              gl_FragColor = vec4(finalColor, intensity * (dayMask * 0.6 + 0.4));
            }
          `}
        />
      </mesh>
    </group>
  );
}