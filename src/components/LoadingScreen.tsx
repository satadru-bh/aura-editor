import React, { useState, useEffect } from 'react';
import { AURA_LOGO } from '../utils/assets';

interface LoadingScreenProps {
  isReady: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isReady }) => {
  const [shouldRender, setShouldRender] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Handle smooth fadeout and unmount once ready
  useEffect(() => {
    if (isReady) {
      setIsFadingOut(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [isReady]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg-color)] select-none transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="relative flex flex-col items-center justify-center animate-scaleUp">
        {/* Logo Container */}
        <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl transition-transform duration-500 overflow-hidden">
          <img
            src={AURA_LOGO}
            alt="Aura Logo"
            className="w-full h-full object-contain rounded-2xl"
          />
        </div>

        {/* Brand Name & Minimal Progress */}
        <div className="mt-4 flex flex-col items-center gap-2">
          <h1 className="text-xs font-semibold tracking-widest uppercase text-[var(--text-color)] opacity-70">
            Aura
          </h1>
          {/* Subtle minimal loading indicator */}
          <div className="w-16 h-0.5 bg-[var(--border-color)]/40 rounded-full overflow-hidden relative">
            <div className="absolute inset-0 bg-[var(--text-color)]/30 w-1/2 rounded-full animate-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
};
