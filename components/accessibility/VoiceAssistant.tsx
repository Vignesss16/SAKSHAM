"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useAccessibility } from '@/context/AccessibilityContext';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { summarizePage, extractMeaningfulText } from '@/utils/pageSummarizer';
import { Mic, MicOff, Volume2, X, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function VoiceAssistant() {
  const { voiceAssistantActive, toggleVoiceAssistant, setFontSize, fontSize, toggleDarkMode } = useAccessibility();
  const { isListening, transcript, startListening, stopListening } = useSpeechRecognition();
  const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech();
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);

  // Command Processor
  useEffect(() => {
    if (transcript) {
      processCommand(transcript.toLowerCase());
    }
  }, [transcript]);

  const processCommand = (cmd: string) => {
    setFeedback(`Command detected: "${cmd}"`);

    if (cmd.includes("read this page") || cmd.includes("read page")) {
      const text = extractMeaningfulText();
      speak("Reading page content now.");
      setTimeout(() => speak(text), 1500);
    } else if (cmd.includes("summarize") || cmd.includes("what is on this page")) {
      const summary = summarizePage();
      speak(summary);
    } else if (cmd.includes("stop reading") || cmd.includes("stop")) {
      stopSpeaking();
      speak("Stopped.");
    } else if (cmd.includes("go to dashboard") || cmd.includes("open dashboard")) {
      speak("Navigating to dashboard.");
      router.push("/dashboard");
    } else if (cmd.includes("scroll down")) {
      window.scrollBy({ top: 500, behavior: 'smooth' });
      speak("Scrolling down.");
    } else if (cmd.includes("scroll up")) {
      window.scrollBy({ top: -500, behavior: 'smooth' });
      speak("Scrolling up.");
    } else if (cmd.includes("increase font size")) {
      setFontSize(fontSize + 10);
      speak("Increasing font size.");
    } else if (cmd.includes("enable dark mode") || cmd.includes("enable light mode")) {
      toggleDarkMode();
      speak("Toggling theme.");
    } else {
      speak("I heard your command but I am not sure how to help. You can ask me to read the page or go to the dashboard.");
    }
  };

  if (!voiceAssistantActive) return null;

  return (
    <div className={`fixed bottom-10 right-10 z-[2000000] transition-all duration-500 ${isMinimized ? 'scale-75' : 'scale-100'}`}>
      <div className="bg-[#0e1417]/95 backdrop-blur-3xl border border-[#00d1ff]/30 rounded-[32px] p-6 shadow-[0_0_50px_rgba(0,209,255,0.2)] w-80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-[#00d1ff]'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#00d1ff]">Voice Assistant</span>
          </div>
          <button onClick={toggleVoiceAssistant} className="text-[#859399] hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="bg-white/5 rounded-2xl p-4 min-h-[100px] flex flex-col items-center justify-center text-center gap-3">
          {isListening ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-1 bg-[#00d1ff] animate-bounce" style={{ height: `${Math.random() * 20 + 10}px`, animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              <p className="text-xs text-[#00d1ff] font-bold">Listening...</p>
            </div>
          ) : isSpeaking ? (
            <div className="flex flex-col items-center gap-2">
              <Volume2 className="text-[#00d1ff] animate-pulse" size={32} />
              <p className="text-xs text-[#00d1ff] font-bold">Speaking...</p>
            </div>
          ) : (
            <p className="text-xs text-[#859399] italic">"Try: Read this page"</p>
          )}
          {transcript && <p className="text-sm font-medium text-white italic mt-2">"{transcript}"</p>}
        </div>

        <div className="flex gap-3 mt-6">
          <button 
            onClick={isListening ? stopListening : startListening}
            className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              isListening ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-[#00d1ff] text-[#001f28] shadow-[0_0_20px_rgba(0,209,255,0.4)] hover:scale-105'
            }`}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            {isListening ? 'Stop' : 'Listen'}
          </button>
          
          {isSpeaking && (
            <button 
              onClick={stopSpeaking}
              className="px-6 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-all"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
