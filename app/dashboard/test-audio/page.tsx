"use client";

import { useState, useRef } from 'react';
import Link from 'next/link';

export default function TestAudioPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // 1. Speaker Test (Text to Speech)
  const playTestVoice = () => {
    try {
      setIsPlaying(true);
      const message = "Hello! This is a test of your laptop's audio system. If you can hear me, your speakers are working correctly.";
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Speaker test failed:", error);
      setIsPlaying(false);
    }
  };

  // 2. Mic + Speaker Test (Record and Playback)
  const startRecording = async () => {
    try {
      setAudioUrl(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setIsRecording(false);
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };

      setIsRecording(true);
      mediaRecorder.start();
      
      // Record for 3 seconds then stop automatically
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 3000);

    } catch (error) {
      console.error("Mic test failed:", error);
      alert("Microphone access denied or failed. Please check your browser settings.");
      setIsRecording(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto text-[#dde3e7] min-h-screen">
      <h1 className="text-4xl font-black mb-2 font-heading tracking-tight text-white">Hardware Diagnostic</h1>
      <p className="text-[#859399] mb-10 text-lg">Verify your audio input and output devices before starting the interview.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Speaker Test Card */}
        <div className="bg-[#1a2123] p-8 rounded-2xl border border-[#242424] flex flex-col gap-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00d1ff]/10 flex items-center justify-center text-[#00d1ff]">
              <span className="material-symbols-outlined">volume_up</span>
            </div>
            <h2 className="text-xl font-bold">Speaker Test</h2>
          </div>
          <p className="text-sm text-[#859399]">Plays an AI-generated sentence to verify your speakers/headphones are active.</p>
          
          <button
            onClick={playTestVoice}
            disabled={isPlaying}
            className={`mt-4 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              isPlaying 
                ? 'bg-[#44e2cd] text-[#0e1417] shadow-[0_0_20px_rgba(68,226,205,0.3)]' 
                : 'bg-[#00d1ff] text-[#0e1417] hover:scale-[1.02] active:scale-95'
            }`}
          >
            <span className="material-symbols-outlined">{isPlaying ? 'graphic_eq' : 'play_circle'}</span>
            {isPlaying ? "Speaking..." : "Test Speakers"}
          </button>
        </div>

        {/* Mic + Speaker Test Card */}
        <div className="bg-[#1a2123] p-8 rounded-2xl border border-[#242424] flex flex-col gap-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#44e2cd]/10 flex items-center justify-center text-[#44e2cd]">
              <span className="material-symbols-outlined">mic</span>
            </div>
            <h2 className="text-xl font-bold">Mic & Loopback</h2>
          </div>
          <p className="text-sm text-[#859399]">Records 3 seconds of your voice and plays it back. Tests both Mic and Speakers.</p>
          
          <button
            onClick={startRecording}
            disabled={isRecording}
            className={`mt-4 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              isRecording 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-[#44e2cd] text-[#0e1417] hover:scale-[1.02] active:scale-95'
            }`}
          >
            <span className="material-symbols-outlined">{isRecording ? 'fiber_manual_record' : 'mic_external_on'}</span>
            {isRecording ? "Recording... Speak Now" : "Test Mic (3s)"}
          </button>

          {audioUrl && (
            <div className="mt-4 p-4 bg-[#121212] rounded-lg border border-[#242424]">
              <p className="text-xs text-[#859399] mb-2 uppercase font-bold tracking-widest">Playback Result:</p>
              <audio src={audioUrl} controls className="w-full h-10" />
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 p-8 bg-[#161d1f] rounded-2xl border border-dashed border-[#242424]">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-3 text-white">
          <span className="material-symbols-outlined text-[#ffb4ab]">check_circle</span>
          What should happen?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-[#859399]">
          <div className="space-y-2">
            <p className="font-bold text-white">1. Speaker Test</p>
            <p>You should hear a clear voice speaking a test sentence.</p>
          </div>
          <div className="space-y-2">
            <p className="font-bold text-white">2. Mic Recording</p>
            <p>Click the button, say "Testing 1 2 3", and wait for it to stop.</p>
          </div>
          <div className="space-y-2">
            <p className="font-bold text-white">3. Verify Loopback</p>
            <p>An audio player will appear. Play it to hear your own recording.</p>
          </div>
        </div>
      </div>

      <div className="mt-10 flex justify-center">
        <Link href="/dashboard" className="btn-ghost flex items-center gap-2 text-[#859399] hover:text-[#00d1ff]">
          <span className="material-symbols-outlined">arrow_back</span>
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
