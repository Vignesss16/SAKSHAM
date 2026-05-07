"use client";
import type { GazeStatus, ExamMode } from "@/hooks/useGazeDetection";
import { Shield, Brain, AlertTriangle } from 'lucide-react';

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>;
  suspicionScore: number;
  status: GazeStatus;
  mode?: ExamMode;
}

export default function GazeProctor({ videoRef, suspicionScore, status, mode = "standard" }: Props) {
  const isHighSuspicion = suspicionScore > 60;
  const isWarning = status === "warning" || isHighSuspicion;
  
  const color =
    status === "ok"          ? (isHighSuspicion ? "#f43f5e" : "#00d1ff") :
    status === "warning"     ? "#f59e0b" :
    status === "calibrating" ? "#03c6b2" : "#6b7280";

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col items-end gap-3 animate-in fade-in slide-in-from-right-4 duration-500">
      
      {/* Smart Webcam Frame */}
      <div className="relative group">
        <video
          ref={videoRef}
          autoPlay muted playsInline
          className={`w-32 h-24 rounded-2xl object-cover transition-all duration-500 border-2 shadow-2xl ${isWarning ? 'border-[#f43f5e] shadow-[#f43f5e]/20' : 'border-[#00d1ff]/30 shadow-[#00d1ff]/10'}`}
          style={{ transform: 'scaleX(-1)' }}
        />
        <div className={`absolute inset-0 rounded-2xl transition-opacity duration-500 ${isWarning ? 'bg-[#f43f5e]/10 opacity-100' : 'opacity-0'}`} />
        
        {/* Intelligence Overlay */}
        <div className="absolute top-2 left-2 flex gap-1">
          <div className={`w-1.5 h-1.5 rounded-full ${status === "ok" ? 'bg-[#03c6b2] shadow-[0_0_8px_#03c6b2]' : 'bg-[#f59e0b]'} animate-pulse`} />
        </div>
      </div>

      {/* Intelligence Dashboard Panel */}
      <div className="bg-[#121a1e]/90 backdrop-blur-md border border-white/10 p-3 rounded-2xl w-48 shadow-xl flex flex-col gap-3">
        
        {/* Mode Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
             <Brain className={`w-3 h-3 ${mode === "relaxed" ? 'text-[#03c6b2]' : 'text-[#00d1ff]'}`} />
             <span className="text-[9px] font-black uppercase tracking-widest text-[#859399]">AI Intel Mode</span>
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest ${mode === "relaxed" ? 'text-[#03c6b2]' : 'text-[#00d1ff]'}`}>
            {mode === "relaxed" ? 'Relaxed' : 'Strict'}
          </span>
        </div>

        {/* Suspicion Meter */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center px-0.5">
            <span className="text-[9px] font-bold text-[#859399] uppercase tracking-wider">Suspicion Score</span>
            <span className={`text-[9px] font-black ${isHighSuspicion ? 'text-[#f43f5e]' : 'text-[#bbc9cf]'}`}>
              {suspicionScore}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div 
              className={`h-full transition-all duration-1000 ${isHighSuspicion ? 'bg-gradient-to-r from-[#f43f5e] to-[#ef4444]' : 'bg-gradient-to-r from-[#00d1ff] to-[#03c6b2]'}`}
              style={{ width: `${suspicionScore}%` }}
            />
          </div>
        </div>

        {/* Action Status */}
        <div className={`flex items-center gap-2 px-2 py-1 rounded-lg ${isWarning ? 'bg-[#f43f5e]/10' : 'bg-white/5'} transition-colors`}>
          {isWarning ? (
            <AlertTriangle className="w-3 h-3 text-[#f43f5e]" />
          ) : (
            <Shield className="w-3 h-3 text-[#03c6b2]" />
          )}
          <span className={`text-[8px] font-black uppercase tracking-widest ${isWarning ? 'text-[#f43f5e]' : 'text-[#859399]'}`}>
            {status === "calibrating" ? "Calibrating..." : 
             isHighSuspicion ? "Critical Deviation" : 
             "Monitoring Active"}
          </span>
        </div>

      </div>

      {/* Floating Alert Tip */}
      {isHighSuspicion && (
        <div className="bg-[#f43f5e] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-lg animate-bounce uppercase tracking-tighter">
          Please focus on screen
        </div>
      )}
    </div>
  );
}
