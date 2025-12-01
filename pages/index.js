import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import IntroOverlay from '../components/EarthVisuals/IntroOverlay';
import UIOverlay from '../components/EarthVisuals/UIOverlay';

// CRITICAL: We use 'dynamic' to load the 3D scene.
// We removed the 'loading' text component so it doesn't block the view.
// The Scene itself has a wireframe fallback now.
const EarthScene = dynamic(
  () => import('../components/EarthVisuals/EarthScene'),
  { ssr: false }
);

export default function LandingPage() {
  const router = useRouter();
  const [starSettings, setStarSettings] = useState({ count: 10000, factor: 10 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const handleEnterPortfolio = () => {
    router.push('/portfolio');
  };

  if (!isMounted) return null;

  return (
    <div 
      className="relative w-full h-screen bg-black overflow-hidden font-sans"
      style={{ backgroundColor: 'black', width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}
    >
      {/* LAYER 1: 3D Earth */}
      <div className="absolute inset-0 z-0" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <EarthScene starSettings={starSettings} />
      </div>

      {/* LAYER 2: UI Controls */}
      <div className="absolute inset-0 z-10 pointer-events-none" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none' }}>
        <UIOverlay starSettings={starSettings} onStarSettingsChange={setStarSettings} visible={true} />
      </div>

      {/* LAYER 3: Intro */}
      <div className="absolute inset-0 z-20 pointer-events-none" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 20, pointerEvents: 'none' }}>
        <IntroOverlay onComplete={handleEnterPortfolio} />
      </div>
    </div>
  );
}