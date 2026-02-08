import React from 'react';
import { ThemeConfig } from '../types';

interface LiveBackgroundProps {
  theme: ThemeConfig;
}

export const LiveBackground: React.FC<LiveBackgroundProps> = ({ theme }) => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-slate-900">
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out transform scale-105"
        style={{ 
            backgroundImage: `url(${theme.backgroundImage})`,
        }}
      />
      
      {/* Dark Overlay Layer for Readability - Removed blur */}
      <div className="absolute inset-0 bg-slate-950/60 transition-opacity duration-700" />
      
      {/* Gradient Overlay for style */}
      <div 
        className="absolute inset-0 opacity-40 mix-blend-overlay transition-colors duration-1000"
        style={{
            background: `linear-gradient(to bottom right, ${theme.colors.primary}, transparent)`
        }}
      />
    </div>
  );
};