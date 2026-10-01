import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 32, className = '', showText = false }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 88"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-105"
      >
        <defs>
          {/* Gradient for left segment (Silver to Pure White) */}
          <linearGradient id="gdriveSupplyGradLeft" x1="10" y1="80" x2="45" y2="10" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#71717a" />
            <stop offset="50%" stopColor="#d4d4d8" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          {/* Gradient for bottom segment (Slate to Charcoal) */}
          <linearGradient id="gdriveSupplyGradBottom" x1="15" y1="85" x2="85" y2="85" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#52525b" />
            <stop offset="50%" stopColor="#3f3f46" />
            <stop offset="100%" stopColor="#27272a" />
          </linearGradient>

          {/* Gradient for right segment (Deep Charcoal to Obsidian Black) */}
          <linearGradient id="gdriveSupplyGradRight" x1="85" y1="80" x2="50" y2="10" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#27272a" />
            <stop offset="60%" stopColor="#18181b" />
            <stop offset="100%" stopColor="#09090b" />
          </linearGradient>

          {/* Soft ambient drop shadow filter */}
          <filter id="subtleGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* 3 Interlocking Trapezoid Segments of Google Drive in Monochrome */}
        <g filter="url(#subtleGlow)">
          {/* Segment 1: Bottom Horizontal Ribbon */}
          <path
            d="M21.5 86.5L37.5 59.5H97.5L81.5 86.5H21.5Z"
            fill="url(#gdriveSupplyGradBottom)"
          />

          {/* Segment 2: Right Slanted Ribbon */}
          <path
            d="M66.5 9.5L97.5 61.5L81.5 87.5L50.5 35.5L66.5 9.5Z"
            fill="url(#gdriveSupplyGradRight)"
          />

          {/* Segment 3: Left Slanted Ribbon (Bright Metallic Front Face) */}
          <path
            d="M34.5 9.5H66.5L35.5 61.5L19.5 35.5L34.5 9.5Z"
            fill="url(#gdriveSupplyGradLeft)"
          />
        </g>
      </svg>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              GDrive
            </span>
            <span className="text-lg font-black tracking-wider text-slate-500 dark:text-slate-400">
              SUPPLY
            </span>
          </div>
          <span className="text-[10px] font-medium tracking-wide uppercase text-slate-400 dark:text-slate-500 -mt-1">
            Local Drive Hub
          </span>
        </div>
      )}
    </div>
  );
};
