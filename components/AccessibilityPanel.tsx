"use client";
import { useAccessibilityReader } from "@/hooks/useAccessibilityReader";
import { Headphones, Volume2, VolumeX, Ear } from "lucide-react";
import { useState, useEffect } from "react";

export default function AccessibilityPanel() {
  const { isEnabled, toggleReader } = useAccessibilityReader();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-32 right-6 z-[9999] flex flex-col items-end gap-3 group">
      {/* Label for Screen Readers/Vision */}
      <div className={`px-4 py-2 rounded-xl bg-black/90 backdrop-blur-2xl border border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.8)] transition-all duration-300 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 ${isEnabled ? 'border-[#00d1ff]/50' : ''}`}>
        <p className="text-[10px] font-black uppercase tracking-widest text-[#00d1ff]">
          {isEnabled ? 'Reader Active' : 'Enable Page Reader'}
        </p>
      </div>

      <button
        onClick={toggleReader}
        aria-label={isEnabled ? "Disable Page Reader" : "Enable Page Reader"}
        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 shadow-[0_0_20px_rgba(0,0,0,0.5)] border ${
          isEnabled 
            ? 'bg-[#00d1ff] text-[#001f28] border-white/20 scale-110 shadow-[0_0_30px_rgba(0,209,255,0.4)]' 
            : 'bg-[#121a1e] text-[#859399] border-white/5 hover:border-[#00d1ff]/50 hover:text-white'
        }`}
      >
        {isEnabled ? (
          <Volume2 className="w-6 h-6 animate-pulse" />
        ) : (
          <Ear className="w-6 h-6" />
        )}

        {/* Dynamic Wave Ring when active */}
        {isEnabled && (
          <div className="absolute inset-0 rounded-full border-2 border-[#00d1ff] animate-ping opacity-20" />
        )}
      </button>

      {/* Instructional Hint */}
      {!isEnabled && (
        <div className="absolute -top-12 right-0 w-32 text-center pointer-events-none animate-bounce">
           <span className="text-[8px] font-bold text-[#00d1ff]/50 uppercase tracking-tighter">Accessibility Help</span>
        </div>
      )}
    </div>
  );
}
