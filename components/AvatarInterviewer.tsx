"use client";
import React, { useRef, useState, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, PerspectiveCamera, Environment, ContactShadows, Float, Html } from '@react-three/drei';
import * as THREE from 'three';

// Professional Interviewer Model (Ready Player Me)
const AVATAR_URL = "https://models.readyplayer.me/6638a1699997108990d0961b.glb";

export type AvatarState = 'talking' | 'thinking' | 'nodding' | 'idle';

interface AvatarProps {
  state: AvatarState;
  audioVolume?: number; // 0 to 1
}

function AvatarModel({ state, audioVolume = 0 }: AvatarProps) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(AVATAR_URL);
  const { actions } = useAnimations(animations, group);

  // Behavior & Morph State
  useFrame((clockState) => {
    if (!group.current) return;

    const t = clockState.clock.elapsedTime;
    const head = group.current.getObjectByName('Head') || group.current.getObjectByName('Neck');
    const mouth = group.current.getObjectByName('Wolf3D_Teeth') || group.current.getObjectByName('Wolf3D_Avatar');

    // 1. Subtle Breathing (Bio-Mimicry)
    if (group.current) {
       group.current.position.y = -3 + Math.sin(t * 1.5) * 0.02;
    }

    // 2. Real-Time Lip Sync (Vocal Driver)
    if (state === 'talking' && audioVolume > 0.01) {
      // Add vocal jitter for more natural movement
      const jitter = (Math.random() - 0.5) * 0.15;
      const activeVolume = Math.max(0, audioVolume + jitter);

      const jaw = group.current.getObjectByName('Jaw');
      if (jaw) {
        jaw.rotation.x = 0.1 + activeVolume * 0.5;
      }
      
      // Simulate "Speaking" head tilt
      if (head) {
        head.rotation.x = Math.sin(t * 10) * 0.02;
      }
    }

    // 3. Emotional States
    if (state === 'thinking') {
      if (head) head.rotation.y = Math.sin(t * 2) * 0.1; // Slow looking around
    } else if (state === 'nodding') {
      if (head) head.rotation.x = Math.abs(Math.sin(t * 8)) * 0.15; // Fast nod
    }
    
    // 4. Subtle Blinking
    const eyes = group.current.getObjectByName('EyeLeft');
    if (eyes && Math.sin(t * 0.5) > 0.98) {
       // Quick blink
    }
  });

  return <primitive ref={group} object={scene} scale={2.8} position={[0, -3, 0]} />;
}

function AvatarLoader() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-[#00d1ff]/20 border-t-[#00d1ff] rounded-full animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-widest text-[#00d1ff]">Neural Init...</span>
      </div>
    </Html>
  );
}

function AvatarFallback({ isSpeaking }: { isSpeaking: boolean }) {
  return (
    <div className="w-full h-full bg-[#121a1e] rounded-3xl overflow-hidden relative border border-[#00d1ff]/10 flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className={`w-24 h-24 rounded-full border-2 border-[#00d1ff]/20 flex items-center justify-center ${isSpeaking ? 'animate-pulse scale-110 shadow-[0_0_40px_rgba(0,209,255,0.4)]' : ''} transition-all duration-700`}>
           <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00d1ff] to-[#03c6b2] flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-3xl text-[#001f28]">psychology</span>
           </div>
        </div>
        {isSpeaking && <div className="absolute inset-0 rounded-full border-2 border-[#00d1ff] animate-ping opacity-20" />}
      </div>
      <div className="text-center px-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00d1ff] mb-1">Neural Core Active</p>
        <p className="text-[9px] text-[#859399] uppercase tracking-widest leading-relaxed">The 3D Interface is initializing... <br/> Voice systems are 100% operational.</p>
      </div>
    </div>
  );
}

class AvatarErrorBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any) { console.error("Avatar Visual System Error:", error); }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

export default function AvatarInterviewer({ state, audioVolume = 0 }: AvatarProps) {
  const isSpeaking = state === 'talking' || audioVolume > 0.05;

  return (
    <AvatarErrorBoundary fallback={<AvatarFallback isSpeaking={isSpeaking} />}>
      <div className="w-full h-full bg-gradient-to-b from-[#0e1417] to-[#121a1e] rounded-3xl overflow-hidden relative border border-white/5 shadow-2xl group">
        
        {/* UI Hud Overlay */}
        <div className="absolute inset-0 pointer-events-none z-20">
           <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/5">
              <div className={`w-1.5 h-1.5 rounded-full ${state === 'talking' ? 'bg-[#03c6b2] animate-pulse' : 'bg-[#859399]'}`} />
              <span className="text-[9px] font-black uppercase tracking-widest text-[#bbc9cf]">
                AI Interface: {state.toUpperCase()}
              </span>
           </div>
           
           {/* Audio Visualizer Bar */}
           {state === 'talking' && (
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-end gap-1 h-8">
               {[...Array(8)].map((_, i) => (
                 <div 
                   key={i} 
                   className="w-1 bg-[#00d1ff]/60 rounded-full transition-all duration-100"
                   style={{ height: `${Math.random() * audioVolume * 100 + 20}%` }}
                 />
               ))}
             </div>
           )}
        </div>

        <Canvas shadows dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={35} />
          <ambientLight intensity={0.6} />
          <spotLight position={[5, 5, 5]} angle={0.15} penumbra={1} intensity={1} castShadow />
          <pointLight position={[-5, -5, -5]} intensity={0.5} />
          
          <Suspense fallback={<AvatarLoader />}>
            <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
              <AvatarModel state={state} audioVolume={audioVolume} />
            </Float>
            <Environment preset="studio" />
            <ContactShadows opacity={0.5} scale={10} blur={2.4} far={10} resolution={256} color="#000000" />
          </Suspense>
        </Canvas>

        {/* Futuristic Scan Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20" />
      </div>
    </AvatarErrorBoundary>
  );
}

try {
  useGLTF.preload(AVATAR_URL);
} catch (e) {}
