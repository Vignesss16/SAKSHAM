"use client";
import React, { useState } from 'react';
import { useAccessibility } from '@/context/AccessibilityContext';
import { 
  Type, 
  Contrast, 
  Moon, 
  Sun, 
  BookOpen, 
  Mic, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft,
  Settings
} from 'lucide-react';

export default function AccessibilityToolbar() {
  const { 
    fontSize, setFontSize, 
    highContrast, toggleHighContrast,
    darkMode, toggleDarkMode,
    dyslexiaFont, toggleDyslexiaFont,
    voiceAssistantActive, toggleVoiceAssistant,
    resetSettings 
  } = useAccessibility();

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`fixed top-1/4 left-0 z-[1000000] transition-all duration-500 ${isOpen ? 'translate-x-0' : '-translate-x-[calc(100%-48px)]'}`}>
      <div className="flex items-stretch shadow-2xl">
        {/* Settings Panel */}
        <div className="bg-[#0e1417]/95 backdrop-blur-2xl border-y border-r border-white/10 rounded-r-3xl p-6 flex flex-col gap-6 min-w-[280px]">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#00d1ff] flex items-center gap-2">
            <Settings size={16} />
            Visual Comfort
          </h3>

          <div className="space-y-6">
            {/* Font Size */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold text-[#859399]">
                <span>Font Size</span>
                <span>{fontSize}%</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setFontSize(fontSize - 10)} className="flex-1 p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-colors text-white text-xs">-</button>
                <button onClick={() => setFontSize(fontSize + 10)} className="flex-1 p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-colors text-white text-xs">+</button>
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={toggleHighContrast}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${highContrast ? 'bg-[#00d1ff] text-[#001f28] border-[#00d1ff]' : 'bg-white/5 text-[#859399] border-white/5 hover:border-white/20'}`}
              >
                <Contrast size={20} />
                <span className="text-[10px] font-black uppercase">Contrast</span>
              </button>
              <button 
                onClick={toggleDyslexiaFont}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${dyslexiaFont ? 'bg-[#00d1ff] text-[#001f28] border-[#00d1ff]' : 'bg-white/5 text-[#859399] border-white/5 hover:border-white/20'}`}
              >
                <BookOpen size={20} />
                <span className="text-[10px] font-black uppercase">Dyslexia</span>
              </button>
              <button 
                onClick={toggleDarkMode}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${!darkMode ? 'bg-[#00d1ff] text-[#001f28] border-[#00d1ff]' : 'bg-white/5 text-[#859399] border-white/5 hover:border-white/20'}`}
              >
                {darkMode ? <Moon size={20} /> : <Sun size={20} />}
                <span className="text-[10px] font-black uppercase">{darkMode ? 'Dark' : 'Light'}</span>
              </button>
              <button 
                onClick={toggleVoiceAssistant}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${voiceAssistantActive ? 'bg-[#00d1ff] text-[#001f28] border-[#00d1ff]' : 'bg-white/5 text-[#859399] border-white/5 hover:border-white/20'}`}
              >
                <Mic size={20} />
                <span className="text-[10px] font-black uppercase">Voice</span>
              </button>
            </div>

            <button 
              onClick={resetSettings}
              className="w-full p-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <RotateCcw size={14} />
              Reset All
            </button>
          </div>
        </div>

        {/* Toggle Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-12 bg-[#00d1ff] text-[#001f28] flex items-center justify-center rounded-r-3xl hover:w-14 transition-all"
          aria-label="Toggle Accessibility Toolbar"
        >
          {isOpen ? <ChevronLeft size={24} /> : <Settings size={24} className="animate-spin-slow" />}
        </button>
      </div>
    </div>
  );
}
