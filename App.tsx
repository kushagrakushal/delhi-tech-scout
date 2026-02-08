import React, { useState, useEffect } from 'react';
import { EventFeed } from './components/EventFeed';
import { LiveBackground } from './components/LiveBackground';
import { ThemeSelector } from './components/ThemeSelector';
import { themes, defaultTheme } from './data/themes';
import { ThemeConfig } from './types';

const App: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(defaultTheme);

  // Apply CSS variables for the theme
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', currentTheme.colors.primary);
    root.style.setProperty('--secondary-color', currentTheme.colors.secondary);
    root.style.setProperty('--text-color', currentTheme.colors.text);
  }, [currentTheme]);

  return (
    <div className="min-h-screen font-sans text-slate-100 overflow-x-hidden relative transition-colors duration-700">
      
      {/* Live Wallpaper managed by state */}
      <LiveBackground theme={currentTheme} />
      
      {/* Content Wrapper */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* Aesthetic Header */}
        <header className="sticky top-0 z-50 bg-opacity-70 backdrop-blur-md border-b border-white/5 transition-colors duration-500" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors duration-500"
                  style={{ background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})` }}
                >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">
                  Delhi Tech Scout
                </h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 relative pb-20 md:pb-0">
          {/* We pass a key to force re-render if needed, though mostly handled by CSS vars now */}
          <EventFeed />
        </main>
      </div>

      {/* Floating Theme Selector */}
      <ThemeSelector currentTheme={currentTheme} onThemeSelect={setCurrentTheme} />
    
      {/* Dynamic Global Styles for Buttons/Accents */}
      <style>{`
        ::selection {
          background: ${currentTheme.colors.primary};
          color: white;
        }
        button.bg-indigo-600 {
          background-color: ${currentTheme.colors.primary} !important;
          color: ${currentTheme.colors.primary === '#ffffff' ? '#000' : '#fff'} !important;
        }
        button.bg-indigo-600:hover {
          filter: brightness(1.1);
          box-shadow: 0 10px 15px -3px ${currentTheme.colors.primary}40 !important;
        }
        .text-indigo-400 {
           color: ${currentTheme.colors.secondary} !important;
        }
        .text-indigo-600 {
           color: ${currentTheme.colors.primary} !important;
        }
        /* Custom scrollbar thumb color */
        ::-webkit-scrollbar-thumb {
          background: ${currentTheme.colors.secondary};
        }
      `}</style>
    </div>
  );
};

export default App;