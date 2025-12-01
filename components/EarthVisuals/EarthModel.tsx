// @ts-nocheck
import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { Mesh, DoubleSide, AdditiveBlending, ShaderMaterial, Vector3, BackSide } from 'three';

const TEXTURE_URLS = {
  map: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
  normal: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
  specular: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
  clouds: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png',
  lights: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_lights_2048.png',
};

export default function EarthModel() {
  const earthRef = useRef(null);
  const cloudsRef = useRef(null);
  const lightsRef = useRef(null);
  const atmosphereRef = useRef(null);
  const lightsMaterialRef = useRef(null);
  const atmosphereMaterialRef = useRef(null);
  
  const { camera } = useThree();

  // Optimized texture loading
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

    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = elapsedTime * 0.015;
    }

    const time = elapsedTime * 0.15;
    const radius = 9;
    const sunPos = new Vector3(
      Math.sin(time) * radius,
      Math.sin(time * 0.5) * 2,
      Math.cos(time) * radius
    );

    if (lightsMaterialRef.current) {
      lightsMaterialRef.current.uniforms.sunPosition.value.copy(sunPos);
    }

    if (atmosphereMaterialRef.current) {
      atmosphereMaterialRef.current.uniforms.sunPosition.value.copy(sunPos);
      atmosphereMaterialRef.current.uniforms.viewVector.value.copy(camera.position);
    }
  });

  return (
    <group rotation={[0, 0, 23.5 * (Math.PI / 180)]}>
      <mesh ref={earthRef} castShadow receiveShadow>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial
          map={textures.map}
          normalMap={textures.normal}
          normalScale={[0.5, 0.5]}
          specularMap={textures.specular}
          specular={0x333333}
          shininess={15}
        />
      </mesh>

      <mesh ref={lightsRef} scale={[1.002, 1.002, 1.002]}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          ref={lightsMaterialRef}
          transparent={true}
          blending={AdditiveBlending}
          uniforms={lightsUniforms}
          vertexShader={`
            varying vec2 vUv; varying vec3 vNormal;
            void main() { vUv = uv; vNormal = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
          `}
          fragmentShader={`
            uniform sampler2D lightsTexture; uniform vec3 sunPosition; varying vec2 vUv; varying vec3 vNormal;
            void main() {
              vec3 lightDir = normalize(sunPosition);
              float dotProd = dot(vNormal, lightDir);
              float visibility = 1.0 - smoothstep(-0.2, 0.1, dotProd);
              vec4 lightsColor = texture2D(lightsTexture, vUv);
              vec3 warmColor = lightsColor.rgb * vec3(1.0, 0.8, 0.6);
              gl_FragColor = vec4(warmColor, visibility * lightsColor.r); 
            }
          `}
        />
      </mesh>

      <mesh ref={cloudsRef} castShadow receiveShadow>
        <sphereGeometry args={[1.01, 64, 64]} />
        <meshStandardMaterial
          map={textures.clouds}
          transparent={true} opacity={0.9} side={DoubleSide} alphaTest={0.1}
        />
      </mesh>

      <mesh ref={atmosphereRef} scale={[1.15, 1.15, 1.15]}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          ref={atmosphereMaterialRef}
          transparent={true} side={BackSide} blending={AdditiveBlending} depthWrite={false} uniforms={atmosphereUniforms}
          vertexShader={`
            varying vec3 vNormal; varying vec3 vPositionWorld;
            void main() { vNormal = normalize(mat3(modelMatrix) * normal); vec4 worldPosition = modelMatrix * vec4(position, 1.0); vPositionWorld = worldPosition.xyz; gl_Position = projectionMatrix * viewMatrix * worldPosition; }
          `}
          fragmentShader={`
            uniform vec3 sunPosition; uniform vec3 viewVector; varying vec3 vNormal; varying vec3 vPositionWorld;
            void main() {
              vec3 viewDirection = normalize(viewVector - vPositionWorld);
              vec3 normal = normalize(vNormal);
              vec3 lightDirection = normalize(sunPosition);
              float viewDot = dot(normal, viewDirection);
              float intensity = pow(0.6 + dot(normal, viewDirection), 4.0);
              float sunOrientation = dot(normal, lightDirection);
              float dayMask = smoothstep(-0.6, 0.6, sunOrientation); 
              float terminator = 1.0 - abs(sunOrientation);
              vec3 atmosphereColor = vec3(0.3, 0.6, 1.0);
              vec3 sunsetColor = vec3(1.0, 0.4, 0.1);
              float sunsetInfluence = smoothstep(0.4, 1.0, terminator) * 0.5;
              vec3 finalColor = mix(atmosphereColor, sunsetColor, sunsetInfluence);
              gl_FragColor = vec4(finalColor, intensity * (dayMask * 0.6 + 0.4));
            }
          `}
        />
      </mesh>
    </group>
  );
}