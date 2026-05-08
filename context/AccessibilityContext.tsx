"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityState {
  fontSize: number;
  highContrast: boolean;
  darkMode: boolean;
  dyslexiaFont: boolean;
  voiceAssistantActive: boolean;
  readerSpeed: number;
}

interface AccessibilityContextType extends AccessibilityState {
  setFontSize: (size: number) => void;
  toggleHighContrast: () => void;
  toggleDarkMode: () => void;
  toggleDyslexiaFont: () => void;
  toggleVoiceAssistant: () => void;
  setReaderSpeed: (speed: number) => void;
  resetSettings: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AccessibilityState>({
    fontSize: 100,
    highContrast: false,
    darkMode: true,
    dyslexiaFont: false,
    voiceAssistantActive: false,
    readerSpeed: 1,
  });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('saksham-accessibility');
    if (saved) {
      setState(JSON.parse(saved));
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('saksham-accessibility', JSON.stringify(state));
    
    // Apply visual changes to BODY for better browser compatibility
    const root = document.documentElement;
    const body = document.body;
    
    root.style.fontSize = `${state.fontSize}%`;
    
    if (state.highContrast) {
      body.classList.add('high-contrast');
    } else {
      body.classList.remove('high-contrast');
    }

    if (state.dyslexiaFont) {
      body.classList.add('dyslexia-font');
    } else {
      body.classList.remove('dyslexia-font');
    }
  }, [state]);

  const setFontSize = (size: number) => setState(prev => ({ ...prev, fontSize: Math.max(80, Math.min(150, size)) }));
  const toggleHighContrast = () => setState(prev => ({ ...prev, highContrast: !prev.highContrast }));
  const toggleDarkMode = () => setState(prev => ({ ...prev, darkMode: !prev.darkMode }));
  const toggleDyslexiaFont = () => setState(prev => ({ ...prev, dyslexiaFont: !prev.dyslexiaFont }));
  const toggleVoiceAssistant = () => setState(prev => ({ ...prev, voiceAssistantActive: !prev.voiceAssistantActive }));
  const setReaderSpeed = (speed: number) => setState(prev => ({ ...prev, readerSpeed: speed }));
  const resetSettings = () => setState({
    fontSize: 100,
    highContrast: false,
    darkMode: true,
    dyslexiaFont: false,
    voiceAssistantActive: false,
    readerSpeed: 1,
  });

  return (
    <AccessibilityContext.Provider value={{
      ...state,
      setFontSize,
      toggleHighContrast,
      toggleDarkMode,
      toggleDyslexiaFont,
      toggleVoiceAssistant,
      setReaderSpeed,
      resetSettings
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return context;
};
