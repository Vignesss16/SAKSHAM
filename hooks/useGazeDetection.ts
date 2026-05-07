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
  const cameraRunningRef = useRef(false);

  // Behavior Weights based on Mode - Memoized to prevent camera re-init loops
  const weights = useMemo(() => ({
    gaze: mode === "relaxed" ? 0.4 : mode === "strict" ? 1.5 : 0.8,
    faceMissing: mode === "strict" ? 2.5 : 1.5,
    decay: 0.5, // How fast the score drops when behavior is normal
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
    // Cooldown logic: don't update if in grace window (first 3s of a look-away)
    if (delta > 0 && now - lastGraceWindowRef.current < 3000 && lastGraceWindowRef.current !== 0) {
      return;
    }

    scoreRef.current = Math.min(100, Math.max(0, scoreRef.current + delta));
    setSuspicionScore(Math.floor(scoreRef.current));

    if (scoreRef.current >= 85) {
      setStatus("terminated");
      onTerminate?.();
    } else if (scoreRef.current >= 40) {
      // Only warn every 10 seconds to prevent alert fatigue
      if (now - lastViolationTimeRef.current > 10000) {
        setStatus("warning");
        onViolation?.(scoreRef.current, "Suspicious behavior pattern detected. Please stay focused.");
        lastViolationTimeRef.current = now;
        setTimeout(() => { if (!destroyedRef.current) setStatus("ok"); }, 5000);
      }
    }
  }, [onViolation, onTerminate]);

  useEffect(() => {
    if (!enabled) return;
    destroyedRef.current = false;

    async function init() {
      const videoEl = videoRef.current;
      if (!videoEl) return;

      // 1. Init Camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
          audio: false,
        });
        streamRef.current = stream;
        videoEl.srcObject = stream;
        await videoEl.play();
      } catch (e) {
        setStatus("idle");
        return;
      }

      setStatus("calibrating");

      // 2. Load MediaPipe
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

        if (!results.multiFaceLandmarks?.length) {
          faceMissingFramesRef.current++;
          if (faceMissingFramesRef.current > 30) { // ~1s
            handleScoreUpdate(weights.faceMissing);
          }
        } else {
          faceMissingFramesRef.current = 0;
          const score = computeGazeScore(results.multiFaceLandmarks[0]);
          const isLookingAway = score < 0.45;

          if (isLookingAway) {
            if (lastGraceWindowRef.current === 0) lastGraceWindowRef.current = Date.now();
            gazeOffFramesRef.current++;
            
            // Continuous deviation logic
            if (gazeOffFramesRef.current > 60) { // ~2s
               handleScoreUpdate(weights.gaze);
            }
          } else {
            // Behavioral decay: score drops when user is focused
            lastGraceWindowRef.current = 0;
            gazeOffFramesRef.current = 0;
            handleScoreUpdate(-weights.decay);
          }
        }
      });

      faceMeshRef.current = fm;
      cameraRunningRef.current = true;
      setStatus("ok");

      const sendFrame = async () => {
        if (destroyedRef.current || !faceMeshRef.current) return;
        if (videoEl.readyState >= 2) {
          await faceMeshRef.current.send({ image: videoEl });
        }
        rafRef.current = requestAnimationFrame(sendFrame);
      };
      rafRef.current = requestAnimationFrame(sendFrame);
    }

    init();

    return () => {
      destroyedRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (faceMeshRef.current) faceMeshRef.current.close();
      streamRef.current?.getTracks().forEach(t => t.stop());
      setStatus("idle");
    };
  }, [enabled, weights.gaze, weights.faceMissing, weights.decay, handleScoreUpdate, computeGazeScore]);

  return { videoRef, suspicionScore, status };
}
