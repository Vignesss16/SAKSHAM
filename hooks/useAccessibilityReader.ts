"use client";
import { useEffect, useState, useCallback } from 'react';

export function useAccessibilityReader() {
  const [isEnabled, setIsEnabled] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('accessibility_reader_enabled');
    if (saved === 'true') setIsEnabled(true);
  }, []);

  const speak = useCallback((text: string) => {
    if (!isEnabled || !window.speechSynthesis) return;
    
    // Cancel any ongoing speech to avoid overlap
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }, [isEnabled]);

  // Global event listener for hover and focus
  useEffect(() => {
    if (!isEnabled) return;

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      const text = target.ariaLabel || target.innerText || target.title || (target as HTMLInputElement).placeholder;
      if (text) {
        speak(`Focus on ${text}`);
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Only read if it's an interactive element
      if (['BUTTON', 'A', 'INPUT', 'SELECT'].includes(target.tagName)) {
        const text = target.ariaLabel || target.innerText || target.title || (target as HTMLInputElement).placeholder;
        if (text) {
          speak(text);
        }
      }
    };

    window.addEventListener('focusin', handleFocus);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('focusin', handleFocus);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [isEnabled, speak]);

  const toggleReader = () => {
    const next = !isEnabled;
    setIsEnabled(next);
    localStorage.setItem('accessibility_reader_enabled', String(next));
    
    if (next) {
      setTimeout(() => speak("Accessibility Page Reader Enabled. I will now read elements as you navigate."), 100);
    } else {
      window.speechSynthesis.cancel();
    }
  };

  return { isEnabled, toggleReader, speak };
}
