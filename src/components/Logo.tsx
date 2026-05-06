import React from 'react';
import { cn } from '../types';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'brand';
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className, variant = 'brand', showText = false }) => {
  const colors = {
    light: '#FFFFFF',
    dark: '#1a1a1a',
    brand: '#2F5D50',
    accent: '#A8D5BA'
  };

  const mainColor = colors[variant as keyof typeof colors] || colors.brand;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img 
        src="/kamaralakeview-logo.png" 
        alt="Kamara Lakeview Logo" 
        className="h-full w-auto object-contain"
        onError={(e) => {
          // Fallback if image fails to load
          e.currentTarget.style.display = 'none';
        }}
      />
      {showText && (
        <div className="flex flex-col">
          <span 
            className="font-display font-bold text-2xl tracking-tighter leading-none"
            style={{ color: mainColor }}
          >
            KAMARA
          </span>
          <span 
            className="text-[8px] tracking-[0.4em] font-black uppercase opacity-60"
            style={{ color: mainColor }}
          >
            Lakeview Hotel
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
