"use client";
import React, { useState } from 'react';
import { useAccessibility } from '@/context/AccessibilityContext';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
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
  const { speak } = useTextToSpeech();

  const handleToggle = (fn: () => void, label: string) => {
    fn();
    // Only speak if it's NOT the voice assistant, as the assistant has its own greeting
    if (label !== "Voice Assistant") {
      speak(`${label} toggled`);
    }
  };

  return (
    <div className={`fixed top-1/4 right-0 z-[1000000] transition-all duration-500 ${isOpen ? 'translate-x-0' : 'translate-x-[calc(100%-40px)]'}`}>
      <div className="flex items-stretch shadow-2xl">
        {/* Toggle Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 bg-[#00d1ff] text-[#001f28] flex items-center justify-center rounded-l-2xl hover:w-12 transition-all"
          aria-label="Toggle Accessibility Toolbar"
        >
          {isOpen ? <ChevronRight size={20} /> : <Settings size={20} className="animate-spin-slow" />}
        </button>

        {/* Settings Panel */}
        <div className="bg-[#0e1417]/95 backdrop-blur-2xl border-y border-l border-white/10 rounded-l-2xl p-4 flex flex-col gap-4 min-w-[220px]">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00d1ff] flex items-center gap-2">
            <Settings size={14} />
            Comfort
          </h3>

          <div className="space-y-4">
            {/* Font Size */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-[#859399]">
                <span>Text Size</span>
                <span>{fontSize}%</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setFontSize(fontSize - 10); speak("Smaller"); }} className="flex-1 p-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 text-white text-[10px]">-</button>
                <button onClick={() => { setFontSize(fontSize + 10); speak("Larger"); }} className="flex-1 p-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 text-white text-[10px]">+</button>
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => handleToggle(toggleHighContrast, "Contrast")}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${highContrast ? 'bg-[#00d1ff] text-[#001f28] border-[#00d1ff]' : 'bg-white/5 text-[#859399] border-white/5 hover:border-white/20'}`}
              >
                <Contrast size={16} />
                <span className="text-[9px] font-black uppercase">Contrast</span>
              </button>
              <button 
                onClick={() => handleToggle(toggleDyslexiaFont, "Dyslexia")}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${dyslexiaFont ? 'bg-[#00d1ff] text-[#001f28] border-[#00d1ff]' : 'bg-white/5 text-[#859399] border-white/5 hover:border-white/20'}`}
              >
                <BookOpen size={16} />
                <span className="text-[9px] font-black uppercase">Reading</span>
              </button>
              <button 
                onClick={() => handleToggle(toggleDarkMode, "Theme")}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${!darkMode ? 'bg-[#00d1ff] text-[#001f28] border-[#00d1ff]' : 'bg-white/5 text-[#859399] border-white/5 hover:border-white/20'}`}
              >
                {darkMode ? <Moon size={16} /> : <Sun size={16} />}
                <span className="text-[9px] font-black uppercase">Mode</span>
              </button>
              <button 
                onClick={() => handleToggle(toggleVoiceAssistant, "Voice")}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${voiceAssistantActive ? 'bg-[#00d1ff] text-[#001f28] border-[#00d1ff]' : 'bg-white/5 text-[#859399] border-white/5 hover:border-white/20'}`}
              >
                <Mic size={16} />
                <span className="text-[9px] font-black uppercase">Voice</span>
              </button>
            </div>

            <button 
              onClick={resetSettings}
              className="w-full p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-all text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
