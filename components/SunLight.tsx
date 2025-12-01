// @ts-nocheck
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DirectionalLight, Color } from 'three';

export const SunLight: React.FC = () => {
  const lightRef = useRef<DirectionalLight>(null);

  useFrame(({ clock }) => {
    if (lightRef.current) {
      // Create a day/night cycle by rotating the sun around the scene
      const time = clock.getElapsedTime() * 0.15; // Cycle speed
      const radius = 9; // Orbital distance

      // Orbit in X-Z plane with slight Y inclination
      const x = Math.sin(time) * radius;
      const z = Math.cos(time) * radius;
      const y = Math.sin(time * 0.5) * 2;
      
      lightRef.current.position.set(x, y, z);

      // Dynamic intensity simulation
      // Intensity peaks slightly when the light is high to simulate day brightness variation
      lightRef.current.intensity = 2.5 + Math.sin(time) * 0.3;

      // Dynamic Color Temperature
      // Interpolate between a warm sunset color and a bright noon color based on height (Y)
      // Y ranges roughly from -2 to 2 in this orbit.
      // Normalize Y to 0-1 range for mixing
      const height = Math.max(0, Math.min(1, (y + 2) / 4));
      
      const sunsetColor = new Color("#ffaa77"); // Warm orange/reddish
      const noonColor = new Color("#fffbf0");   // Clear bright white
      
      // Use a power curve to keep it "daylight" longer, dipping to sunset colors only when low
      const mixRatio = Math.pow(height, 0.5); 
      
      lightRef.current.color.lerpColors(sunsetColor, noonColor, mixRatio);
    }
  });

  return (
    <directionalLight
      ref={lightRef}
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-bias={-0.0001}
      shadow-normalBias={0.02} // Helps reduce shadow acne on the curved earth surface
      shadow-radius={4} // Softens the shadow edges (works with PCFSoftShadowMap)
      // Tight shadow camera frustum focused on the Earth (radius 1) for higher resolution
      shadow-camera-left={-2}
      shadow-camera-right={2}
      shadow-camera-top={2}
      shadow-camera-bottom={-2}
      shadow-camera-near={1}
      shadow-camera-far={20}
    />
  );
};