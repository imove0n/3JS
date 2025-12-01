// @ts-nocheck
import React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { EarthModel } from './EarthModel';
import { SunLight } from './SunLight';
import { Color } from 'three';
import { Suspense } from 'react';

// Component to dynamically adjust background based on the cycle
const AtmosphericBackground = () => {
  const { scene } = useThree();
  
  useFrame(({ clock }) => {
    // Sync time with SunLight (0.15 speed)
    const time = clock.getElapsedTime() * 0.15;
    
    // Create a subtle breathing effect for the deep space background
    // Base colors for deep space
    const rBase = 0.005;
    const gBase = 0.01;
    const bBase = 0.03;

    // Pulse factor aligned with the sun's position (using sin(time) like the sun's X pos)
    const pulse = (Math.sin(time) + 1) * 0.5; // Normalized 0-1
    
    // Interpolate towards a slightly lighter/bluer tone when "day" is active relative to camera
    const intensity = 0.02;
    scene.background = new Color(
      rBase + pulse * intensity * 0.5,
      gBase + pulse * intensity,
      bBase + pulse * intensity * 1.5
    );
  });
  
  return null;
};

interface EarthSceneProps {
  starSettings: {
    count: number;
    factor: number;
  };
}

export const EarthScene: React.FC<EarthSceneProps> = ({ starSettings }) => {
  return (
    <Canvas
      shadows="soft"
      dpr={[1, 2]} // Handle high DPI screens
      gl={{ antialias: true, toneMappingExposure: 1.0 }}
    >
      <PerspectiveCamera makeDefault position={[0, 0, 3.5]} fov={45} />
      
      {/* Dynamic Background */}
      <AtmosphericBackground />

      {/* Star Field */}
      <Stars 
        radius={300} 
        depth={50} 
        count={starSettings.count} 
        factor={starSettings.factor} 
        saturation={0} 
        fade 
        speed={1} 
      />

      {/* Lighting */}
      <ambientLight intensity={0.04} color="#202040" />
      <SunLight />

      {/* Earth Model with Suspense for texture loading */}
      <Suspense fallback={null}>
        <EarthModel />
      </Suspense>

      {/* Controls */}
      <OrbitControls 
        enablePan={false} 
        enableZoom={true} 
        minDistance={2.5} 
        maxDistance={12}
        zoomSpeed={0.6}
        rotateSpeed={0.5}
        autoRotate={true}
        autoRotateSpeed={0.2} // Slower rotation to allow observing the day/night terminator
      />
    </Canvas>
  );
};