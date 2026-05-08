"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";

export type GazeStatus = "idle" | "calibrating" | "ok" | "warning" | "terminated";
export type ExamMode = "strict" | "relaxed" | "standard";

interface UseGazeDetectionOptions {
  enabled: boolean;
  mode?: ExamMode;
  onViolation?: (score: number, message: string) => void;
  onTerminate?: () => void;
}

export function useGazeDetection({
  enabled,
  mode = "standard",
  onViolation,
  onTerminate,
}: UseGazeDetectionOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Intelligence State
  const [suspicionScore, setSuspicionScore] = useState(0);
  const [status, setStatus] = useState<GazeStatus>("idle");
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  // Internal Tracking Refs
  const scoreRef = useRef(0);
  const gazeOffFramesRef = useRef(0);
  const faceMissingFramesRef = useRef(0);
  const lastViolationTimeRef = useRef(0);
  const lastGraceWindowRef = useRef(0);
  
  // MediaPipe Refs
  const faceMeshRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const destroyedRef = useRef(false);

  const weights = useMemo(() => ({
    gaze: mode === "relaxed" ? 0.5 : mode === "strict" ? 1.8 : 1.0,
    faceMissing: mode === "strict" ? 2.5 : 1.5,
    decay: 0.01, // Even slower decay
  }), [mode]);

  const computeGazeScore = useCallback((landmarks: any[]) => {
    const li = landmarks[468]; const lo = landmarks[33]; const lc = landmarks[133];
    const ri = landmarks[473]; const ro = landmarks[362]; const rc = landmarks[263];
    const lt = landmarks[159]; const lb = landmarks[145];
    if (!li || !ri || !lo || !lc || !ro || !rc) return 1;
    function hRatio(iris: any, outer: any, inner: any) {
      const w = Math.abs(inner.x - outer.x);
      if (w < 0.01) return 1;
      return 1 - Math.abs(iris.x - (outer.x + inner.x) / 2) / (w * 0.5);
    }
    const vRatio = lt && lb ? 1 - Math.abs((li.y - lt.y) / Math.max(lb.y - lt.y, 0.01) - 0.5) * 2 : 1;
    return (hRatio(li, lo, lc) + hRatio(ri, ro, rc) + vRatio) / 3;
  }, []);

  const handleScoreUpdate = useCallback((delta: number) => {
    const now = Date.now();
    const graceLimit = mode === "relaxed" ? 12000 : mode === "standard" ? 5000 : 2500;

    if (delta > 0 && now - lastGraceWindowRef.current < graceLimit && lastGraceWindowRef.current !== 0) {
      return;
    }
    
    // Escalation Factor: The longer the deviation, the faster it grows
    let multiplier = 1;
    if (delta > 0 && lastGraceWindowRef.current !== 0) {
      const deviationDuration = (now - lastGraceWindowRef.current) / 1000;
      if (deviationDuration > 15) multiplier = 3.0;
      else if (deviationDuration > 8) multiplier = 2.0;
    }

    scoreRef.current = Math.min(100, Math.max(0, scoreRef.current + (delta * multiplier)));
    setSuspicionScore(Math.floor(scoreRef.current));

    if (scoreRef.current >= 95) { // Terminal threshold
      setStatus("terminated");
      onTerminate?.();
    } else if (scoreRef.current >= 40) {
      if (now - lastViolationTimeRef.current > 15000) {
        setStatus("warning");
        onViolation?.(scoreRef.current, "Suspicious behavior pattern. Please stay focused.");
        lastViolationTimeRef.current = now;
        setTimeout(() => { if (!destroyedRef.current) setStatus("ok"); }, 5000);
      }
    }
  }, [mode, onViolation, onTerminate]);

  // PHASE 1: Robust Camera Init
  useEffect(() => {
    destroyedRef.current = false;
    let stream: MediaStream | null = null;
    let retryCount = 0;
    
    async function startCamera() {
      if (destroyedRef.current) return;

      const videoEl = videoRef.current;
      // If video element isn't ready yet, retry up to 20 times (2 seconds)
      if (!videoEl) {
        if (retryCount < 20) {
          retryCount++;
          setTimeout(startCamera, 100);
        }
        return;
      }

      try {
        console.log("Hardware: Requesting Camera...");
        stream = await navigator.mediaDevices.getUserMedia({
          video: true, // Most basic request for maximum compatibility
          audio: false,
        });
        
        console.log("Camera Stream Acquired:", stream.id);
        streamRef.current = stream;
        videoEl.srcObject = stream;
        videoEl.muted = true;
        videoEl.setAttribute("playsinline", "true");
        
        // Force hardware light and playback
        await videoEl.play();
        console.log("Video Playback Started Successfully");

        setIsCameraReady(true);
        setStatus("ok");
      } catch (e) {
        console.error("CRITICAL CAMERA ERROR:", e);
        setStatus("idle");
      }
    }

    startCamera();

    return () => {
      destroyedRef.current = true;
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, []);

  // PHASE 2: AI Analysis
  useEffect(() => {
    if (!enabled || !isCameraReady) return;

    async function startAnalysis() {
      const videoEl = videoRef.current;
      if (!videoEl) return;

      setStatus("calibrating");
      
      try {
        const mod = await import("@mediapipe/face_mesh");
        const fm = new mod.FaceMesh({
          locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${f}`,
        });
        
        fm.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        fm.onResults((results: any) => {
          if (destroyedRef.current || !faceMeshRef.current) return;
          const now = Date.now();

          if (!results.multiFaceLandmarks?.length) {
            if (lastGraceWindowRef.current === 0) lastGraceWindowRef.current = now;
            handleScoreUpdate(weights.faceMissing);
            // We DON'T update lastViolationTimeRef here because they are BAD
          } else {
            const score = computeGazeScore(results.multiFaceLandmarks[0]);
            if (score < 0.42) {
              if (lastGraceWindowRef.current === 0) lastGraceWindowRef.current = now;
              handleScoreUpdate(weights.gaze);
            } else {
              // ONLY reset grace window and update "Good Behavior" timer if they are focused
              if (now - lastViolationTimeRef.current > 3000) {
                lastGraceWindowRef.current = 0;
              }
              // Update last GOOD behavior timestamp
              if (score >= 0.42) {
                // We use this as a reference for how long they've been good
              }
              handleScoreUpdate(-weights.decay);
            }
          }
        });

        faceMeshRef.current = fm;
        setStatus("ok");

        const sendFrame = async () => {
          if (destroyedRef.current || !faceMeshRef.current || !enabled) return;
          if (videoEl.readyState >= 2) {
            await faceMeshRef.current.send({ image: videoEl });
          }
          rafRef.current = requestAnimationFrame(sendFrame);
        };
        rafRef.current = requestAnimationFrame(sendFrame);
      } catch (e) {
        console.error("AI Analysis Loop Error", e);
      }
    }

    startAnalysis();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
        faceMeshRef.current = null;
      }
    };
  }, [enabled, isCameraReady, weights, handleScoreUpdate, computeGazeScore]);

  return { videoRef, suspicionScore, status };
}
