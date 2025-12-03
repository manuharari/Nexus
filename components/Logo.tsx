
import React, { useState, useEffect } from 'react';
import { configService } from '../services/configService';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Logo: React.FC<LogoProps> = ({ className = '', showText = true, size = 'md' }) => {
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
      // Load initial branding
      const config = configService.getClientConfig();
      setLogoUrl(config.branding?.logoUrl);

      // Subscribe to changes (e.g. when switching tenants or updating branding)
      const unsubscribe = configService.subscribe(() => {
          const updatedConfig = configService.getClientConfig();
          setLogoUrl(updatedConfig.branding?.logoUrl);
      });
      return () => unsubscribe();
  }, []);

  // Dimension mapping
  const dim = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }[size];

  // Text size mapping
  const titleSize = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-5xl'
  }[size];

  const subSize = {
    sm: 'text-[0.5rem]',
    md: 'text-[0.6rem]',
    lg: 'text-xs',
    xl: 'text-sm'
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      
      {/* Graphic Symbol: Custom Image OR Default SVG */}
      <div className={`relative ${dim} shrink-0 group flex items-center justify-center`}>
        {logoUrl ? (
            <img 
                src={logoUrl} 
                alt="Client Logo" 
                className="w-full h-full object-contain filter drop-shadow-lg transition-transform hover:scale-105"
            />
        ) : (
            <>
                {/* Glow Effect behind logo */}
                <div className="absolute inset-0 bg-primary-500/30 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl relative z-10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="nexusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3B82F6" /> {/* Blue 500 */}
                            <stop offset="100%" stopColor="#06B6D4" /> {/* Cyan 500 */}
                        </linearGradient>
                    </defs>
                    
                    {/* Neural Cube Design */}
                    {/* Base Isometric Box */}
                    <path 
                        d="M50 15 L85 35 V75 L50 95 L15 75 V35 Z" 
                        stroke="url(#nexusGradient)" 
                        strokeWidth="4"
                        fill="rgba(59, 130, 246, 0.1)"
                        className="transition-all duration-500 group-hover:fill-blue-500/20"
                    />
                    
                    {/* Inner Connectivity Nodes */}
                    <circle cx="50" cy="55" r="6" fill="white" className="animate-pulse" />
                    <circle cx="50" cy="15" r="3" fill="#06B6D4" />
                    <circle cx="85" cy="35" r="3" fill="#3B82F6" />
                    <circle cx="15" cy="35" r="3" fill="#3B82F6" />
                    <circle cx="50" cy="95" r="3" fill="#06B6D4" />

                    {/* Data Paths */}
                    <path d="M50 15 L50 55" stroke="white" strokeWidth="2" strokeOpacity="0.5" />
                    <path d="M85 35 L50 55" stroke="white" strokeWidth="2" strokeOpacity="0.5" />
                    <path d="M15 35 L50 55" stroke="white" strokeWidth="2" strokeOpacity="0.5" />
                    <path d="M50 95 L50 55" stroke="white" strokeWidth="2" strokeOpacity="0.5" />
                    
                    {/* Orbiting Ring */}
                    <ellipse 
                        cx="50" cy="55" rx="35" ry="20" 
                        stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="4 4" 
                        className="opacity-50 group-hover:opacity-100 transition-opacity" 
                        transform="rotate(-15 50 55)"
                    />
                </svg>
            </>
        )}
      </div>
      
      {/* Typography */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-bold tracking-tight text-white ${titleSize} font-sans`}>
            NEXUS
          </span>
          <span className={`font-medium tracking-[0.25em] text-accent-cyan uppercase ${subSize}`}>
            Manufacturing AI
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
