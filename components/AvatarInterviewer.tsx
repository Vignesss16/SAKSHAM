"use client";
import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, PerspectiveCamera, Environment, ContactShadows, Float } from '@react-three/drei';
import * as THREE from 'three';

// Professional Interviewer Model (Generic Business Person)
const AVATAR_URL = "https://models.readyplayer.me/64f0aa2030f2f36128038753.glb";

function AvatarModel({ isSpeaking }: { isSpeaking: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(AVATAR_URL);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    if (actions['Idle']) actions['Idle'].play();
    return () => { actions['Idle']?.stop(); };
  }, [actions]);

  useFrame((state) => {
    if (isSpeaking && group.current) {
      const head = group.current.getObjectByName('Head');
      if (head) head.rotation.x = Math.sin(state.clock.elapsedTime * 10) * 0.02;
    }
  });

  return <primitive ref={group} object={scene} scale={2} position={[0, -3, 0]} />;
}

class AvatarErrorBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

export default function AvatarInterviewer({ isSpeaking }: { isSpeaking: boolean }) {
  const fallbackUI = (
    <div className="w-full h-full bg-[#121a1e] rounded-3xl overflow-hidden relative border border-[#00d1ff]/10 flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className={`w-20 h-20 rounded-full border-2 border-[#00d1ff]/20 flex items-center justify-center ${isSpeaking ? 'animate-pulse scale-110 shadow-[0_0_30px_rgba(0,209,255,0.3)]' : ''} transition-all duration-500`}>
           <span className="material-symbols-outlined text-4xl text-[#00d1ff]">smart_toy</span>
        </div>
        {isSpeaking && <div className="absolute inset-0 rounded-full border-2 border-[#00d1ff] animate-ping opacity-20" />}
      </div>
      <div className="text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00d1ff] mb-1">AI Voice Active</p>
        <p className="text-[8px] text-[#4a5559] uppercase tracking-widest">Visual Model Offline</p>
      </div>
    </div>
  );

  return (
    <AvatarErrorBoundary fallback={fallbackUI}>
      <div className="w-full h-full bg-[#121a1e] rounded-3xl overflow-hidden relative border border-[#00d1ff]/10 shadow-2xl">
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-[#03c6b2] animate-pulse' : 'bg-[#859399]'}`} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#bbc9cf]">AI Avatar Active</span>
        </div>

        <Canvas shadows dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={40} />
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <pointLight position={[-10, -10, -10]} />
          
          <Suspense fallback={null}>
            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
              <AvatarModel isSpeaking={isSpeaking} />
            </Float>
            <Environment preset="city" />
            <ContactShadows opacity={0.4} scale={10} blur={2} far={10} resolution={256} color="#000000" />
          </Suspense>
        </Canvas>

        <div className="absolute inset-0 pointer-events-none border-[1px] border-[#00d1ff]/5 rounded-3xl">
          <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-[#00d1ff]/20 rounded-tl-3xl"></div>
          <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-[#00d1ff]/20 rounded-br-3xl"></div>
        </div>
      </div>
    </AvatarErrorBoundary>
  );
}

try {
  useGLTF.preload(AVATAR_URL);
} catch (e) {}
