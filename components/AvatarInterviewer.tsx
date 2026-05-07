"use client";
import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, PerspectiveCamera, Environment, ContactShadows, Float } from '@react-three/drei';
import * as THREE from 'three';

// Professional Interviewer Model (Generic Business Person)
const AVATAR_URL = "https://models.readyplayer.me/64f0aa2030f2f36128038753.glb";

function AvatarModel({ isSpeaking, ...props }: { isSpeaking: boolean }) {
  const group = useRef<THREE.Group>(null);
  
  // Wrap useGLTF in a way that doesn't crash the entire component if the URL fails
  let model: any = null;
  try {
    model = useGLTF(AVATAR_URL);
  } catch (e) {
    console.warn("Avatar model failed to load, using fallback UI");
    return null; 
  }

  const { scene, animations } = model;
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    if (actions['Idle']) {
      actions['Idle'].play();
    }
    return () => {
      actions['Idle']?.stop();
    };
  }, [actions]);

  useFrame((state) => {
    if (isSpeaking && group.current) {
      const head = group.current.getObjectByName('Head');
      if (head) {
        head.rotation.x = Math.sin(state.clock.elapsedTime * 10) * 0.02;
      }
    }
  });

  return <primitive ref={group} object={scene} scale={2} position={[0, -3, 0]} />;
}

// Error Boundary for the Canvas
class AvatarErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#121a1e] to-[#0a0f12]">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-2 border-[#00d1ff]/20 animate-ping absolute inset-0" />
          <div className="w-24 h-24 rounded-full bg-[#00d1ff]/10 flex items-center justify-center backdrop-blur-sm border border-[#00d1ff]/30">
            <span className="material-symbols-outlined text-[#00d1ff] text-4xl animate-pulse">psychology</span>
          </div>
        </div>
      </div>
    );
    return this.props.children;
  }
}

export default function AvatarInterviewer({ isSpeaking }: { isSpeaking: boolean }) {
  return (
    <div className="w-full h-full bg-[#121a1e] rounded-3xl overflow-hidden relative border border-[#00d1ff]/10 shadow-2xl">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-[#03c6b2] animate-pulse' : 'bg-[#859399]'}`} />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#bbc9cf]">AI Avatar Active</span>
      </div>

      <AvatarErrorBoundary>
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
      </AvatarErrorBoundary>

      {/* Futuristic Overlay */}
      <div className="absolute inset-0 pointer-events-none border-[1px] border-[#00d1ff]/5 rounded-3xl">
        <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-[#00d1ff]/20 rounded-tl-3xl"></div>
        <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-[#00d1ff]/20 rounded-br-3xl"></div>
      </div>
    </div>
  );
}

// Don't preload if the link is known to be unstable for now
// useGLTF.preload(AVATAR_URL);
