import React, { useState } from 'react';
import { EarthScene } from './components/EarthScene';
import { UIOverlay } from './components/UIOverlay';
import { IntroOverlay } from './components/IntroOverlay';

export default function App() {
  const [starSettings, setStarSettings] = useState({
    count: 10000,
    factor: 10
  });

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      {/* 3D Scene Container (Background) */}
      <div className="absolute inset-0 z-0">
        <EarthScene starSettings={starSettings} />
      </div>

      {/* Main UI Overlay (Environment Controls) - Always Visible */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* We pass visible={true} so the controls appear immediately */}
        <UIOverlay 
          starSettings={starSettings} 
          onStarSettingsChange={setStarSettings} 
          visible={true}
        />
      </div>

      {/* Intro Overlay (Loading Animation) - Sit on top but allow clicks through to Earth */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <IntroOverlay onComplete={() => window.location.href = '/portfolio'} />
      </div>
    </div>
  );
}