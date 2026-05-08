"use client";
import { useAccessibilityReader } from "@/hooks/useAccessibilityReader";
import { useState, useEffect } from "react";

export default function AccessibilityPanel() {
  const { isEnabled, toggleReader } = useAccessibilityReader();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-10 left-10 z-[999999] flex flex-col items-start gap-3 group">
      {/* Label for Screen Readers/Vision */}
      <div className={`px-4 py-2 rounded-xl bg-[#001f28]/95 backdrop-blur-3xl border border-[#00d1ff]/30 shadow-[0_0_30px_rgba(0,209,255,0.2)] transition-all duration-300 -translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 ${isEnabled ? 'border-[#00d1ff]/80' : ''}`}>
        <p className="text-[10px] font-black uppercase tracking-widest text-[#00d1ff]">
          {isEnabled ? 'Accessibility Active' : 'Enable Page Reader'}
        </p>
      </div>

      <button
        onClick={toggleReader}
        aria-label={isEnabled ? "Disable Page Reader" : "Enable Page Reader"}
        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 shadow-[0_0_40px_rgba(0,0,0,0.8)] border-2 relative ${
          isEnabled 
            ? 'bg-[#00d1ff] text-[#001f28] border-[#00d1ff] scale-110 shadow-[0_0_50px_rgba(0,209,255,0.5)]' 
            : 'bg-[#0e1417] text-[#00d1ff] border-[#00d1ff]/20 hover:border-[#00d1ff] hover:bg-[#00d1ff]/10'
        }`}
      >
        {/* Neon Halo */}
        <div className={`absolute inset-0 rounded-full border-2 border-[#00d1ff]/30 ${!isEnabled ? 'animate-pulse' : 'animate-ping opacity-20'}`} />
        
        <span className="material-symbols-outlined text-[28px]">
          {isEnabled ? 'volume_up' : 'hearing'}
        </span>

        {/* Dynamic Sound Waves */}
        {isEnabled && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-bounce flex items-center justify-center">
             <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
          </div>
        )}
      </button>

      {/* Demo Hint for visually impaired users */}
      {!isEnabled && (
        <div className="absolute -top-8 left-0 w-32 text-left pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
           <span className="text-[8px] font-bold text-[#00d1ff] uppercase tracking-tighter">Accessibility Layer</span>
        </div>
      )}
    </div>
  );
}
