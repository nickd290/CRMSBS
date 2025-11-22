import React, { useEffect, useState } from 'react';

interface WelcomeScreenProps {
  onDismiss: () => void;
}

export default function WelcomeScreen({ onDismiss }: WelcomeScreenProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Fade in immediately on mount
    setTimeout(() => setIsVisible(true), 50);

    // Start fade out after 2.5 seconds
    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2500);

    // Complete dismissal after fade out animation
    const dismissTimer = setTimeout(() => {
      onDismiss();
    }, 3000);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(dismissTimer);
    };
  }, [onDismiss]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-green-900 transition-opacity duration-500 ${
        isVisible && !isFadingOut ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className={`flex flex-col items-center space-y-6 md:space-y-8 px-4 transition-all duration-700 ${
          isVisible && !isFadingOut
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-95'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-center">
          <img
            src="/logo.png"
            alt="Starterbox Studios"
            className="h-24 md:h-32 w-auto animate-pulse"
            style={{ animationDuration: '2s' }}
          />
        </div>

        {/* Welcome Text */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent px-4">
            Welcome back Rebecca
          </h1>
          <div className="mt-4 flex justify-center">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
