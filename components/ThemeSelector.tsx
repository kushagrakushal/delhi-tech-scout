import React, { useState } from 'react';
import { ThemeConfig } from '../types';
import { themes } from '../data/themes';

interface ThemeSelectorProps {
  currentTheme: ThemeConfig;
  onThemeSelect: (theme: ThemeConfig) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onThemeSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <div className={`absolute bottom-16 right-0 bg-slate-900/90 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-2xl w-80 max-h-[60vh] overflow-y-auto transition-all duration-300 origin-bottom-right custom-scrollbar ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}>
        <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            Select Theme
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => {
                  onThemeSelect(theme);
              }}
              className={`relative p-3 rounded-xl border transition-all text-left flex flex-col gap-2 overflow-hidden group ${
                currentTheme.id === theme.id 
                  ? 'border-indigo-500 bg-indigo-500/10' 
                  : 'border-white/5 bg-slate-800/50 hover:bg-slate-800 hover:border-white/20'
              }`}
            >
              <div 
                className="absolute inset-0 opacity-20"
                style={{ background: theme.colors.primary }}
              ></div>
              <div className="relative z-10 flex items-center justify-between w-full">
                <span className={`text-xs font-semibold ${currentTheme.id === theme.id ? 'text-white' : 'text-slate-300'}`}>
                    {theme.name}
                </span>
                {currentTheme.id === theme.id && (
                    <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]"></div>
                )}
              </div>
              <div className="relative z-10 flex gap-1 mt-1">
                 <div className="w-4 h-4 rounded-full shadow-sm" style={{ background: theme.colors.primary }}></div>
                 <div className="w-4 h-4 rounded-full shadow-sm" style={{ background: theme.colors.secondary }}></div>
                 <div className="w-4 h-4 rounded-full shadow-sm border border-white/20" style={{ background: theme.colors.text }}></div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-2xl shadow-indigo-900/50 flex items-center justify-center transition-all hover:scale-110 active:scale-95 border border-white/10"
        title="Change Theme"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-7 w-7 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      </button>
    </div>
  );
};