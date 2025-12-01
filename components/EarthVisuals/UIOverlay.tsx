// @ts-nocheck
import React from 'react';

interface UIOverlayProps {
  starSettings: {
    count: number;
    factor: number;
  };
  onStarSettingsChange: (settings: { count: number; factor: number }) => void;
  visible: boolean;
}

export default function UIOverlay({ starSettings, onStarSettingsChange, visible }: UIOverlayProps) {
  if (!visible) return null;

  return (
    <div className="w-full h-full flex flex-col justify-between p-8 animate-fade-in pointer-events-none">
      
      {/* Header */}
      <header className="flex justify-end items-start pointer-events-auto">
      </header>
      
      {/* Footer */}
      <footer className="flex justify-between items-end pointer-events-auto">
        <div className="flex flex-col gap-2">
           <div className="flex items-center gap-2 text-white/50 text-xs font-mono animate-pulse">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              SYSTEM ONLINE
           </div>
        </div>
      </footer>
    </div>
  );
}