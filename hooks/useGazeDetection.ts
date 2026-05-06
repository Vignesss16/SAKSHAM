"use client";
import { useEffect, useRef, useState, useCallback } from "react";

export type GazeStatus = "idle" | "calibrating" | "ok" | "warning" | "terminated";

interface UseGazeDetectionOptions {
  enabled: boolean;
  maxStrikes?: number;
  gazeOffFrames?: number;
  onStrike?: (count: number) => void;
  onTerminate?: () => void;
}

export function useGazeDetection({
  enabled,
  maxStrikes = 3,
  gazeOffFrames = 45,
  onStrike,
  onTerminate,
}: UseGazeDetectionOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [strikes, setStrikes] = useState(0);
  const [status, setStatus] = useState<GazeStatus>("idle");
  const strikesRef = useRef(0);
  const gazeOffRef = useRef(0);
  const faceMeshRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const cameraRunningRef = useRef(false);

  const computeGazeScore = useCallback((landmarks: any[]) => {
    const li = landmarks[468]; const lo = landmarks[33]; const lc = landmarks[133];
    const ri = landmarks[473]; const ro = landmarks[362]; const rc = landmarks[263];
    const lt = landmarks[159]; const lb = landmarks[145];
    if (!li || !ri || !lo || !lc || !ro || !rc) return 1;

    function hRatio(iris: any, outer: any, inner: any) {
      const w = Math.abs(inner.x - outer.x);
      if (w < 0.01) return 1;
      const off = Math.abs(iris.x - (outer.x + inner.x) / 2);
      return 1 - off / (w * 0.5);
    }
    const vRatio =
      lt && lb
        ? 1 - Math.abs((li.y - lt.y) / Math.max(lb.y - lt.y, 0.01) - 0.5) * 2
        : 1;
    return (hRatio(li, lo, lc) + hRatio(ri, ro, rc) + vRatio) / 3;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let destroyed = false;

    function waitForVideo(): Promise<HTMLVideoElement> {
      return new Promise((resolve) => {
        const check = () => {
          if (videoRef.current) return resolve(videoRef.current);
          if (!destroyed) setTimeout(check, 100);
        };
        check();
      });
    }

    async function init() {
      const videoEl = await waitForVideo();
      if (destroyed) return;

      // ── STEP 1: Camera FIRST (instant visual feedback) ──────────────────────
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
          audio: false,
        });
      } catch (err) {
        console.warn("[GazeDetection] Camera unavailable, proctoring disabled:", err);
        if (!destroyed) setStatus("idle");
        return;
      }

      if (destroyed) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      // Attach stream — user sees their face immediately
      streamRef.current = stream;
      videoEl.srcObject = stream;
      videoEl.muted = true;
      videoEl.playsInline = true;
      await videoEl.play().catch(() => {});
      if (destroyed) return;

      // Show "calibrating" now (camera is live, FaceMesh loading)
      setStatus("calibrating");

      // ── STEP 2: Load FaceMesh WASM in background (with 45s timeout) ─────────
      let FaceMesh: any;
      try {
        const result = await Promise.race<any>([
          import("@mediapipe/face_mesh"),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("FaceMesh load timeout")), 45000)
          ),
        ]);
        FaceMesh = result.FaceMesh;
      } catch (err) {
        console.warn("[GazeDetection] FaceMesh failed to load, proctoring disabled:", err);
        if (!destroyed) setStatus("idle");
        return;
      }
      if (destroyed) return;

      const fm = new FaceMesh({
        locateFile: (f: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${f}`,
      });
      fm.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      fm.onResults((results: any) => {
        if (destroyed || !cameraRunningRef.current) return;

        if (!results.multiFaceLandmarks?.length) {
          // No face detected — penalise (but gently: only if camera is confirmed live)
          gazeOffRef.current += 2;
        } else {
          const score = computeGazeScore(results.multiFaceLandmarks[0]);
          if (score < 0.4) gazeOffRef.current++;
          else gazeOffRef.current = Math.max(0, gazeOffRef.current - 1);
        }

        if (gazeOffRef.current >= gazeOffFrames) {
          gazeOffRef.current = 0;
          strikesRef.current += 1;
          setStrikes(strikesRef.current);
          onStrike?.(strikesRef.current);
          if (strikesRef.current >= maxStrikes) {
            setStatus("terminated");
            onTerminate?.();
          } else {
            setStatus("warning");
            setTimeout(() => setStatus("ok"), 4000);
          }
        }
      });

      faceMeshRef.current = fm;

      // ── STEP 3: Warm up FaceMesh with one blank frame so WASM initialises ───
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 1; canvas.height = 1;
        await fm.send({ image: canvas });
      } catch (_) {}

      if (destroyed) return;

      cameraRunningRef.current = true;
      setStatus("ok");

      // ── STEP 4: Drive FaceMesh via requestAnimationFrame ─────────────────────
      const sendFrame = async () => {
        if (destroyed || !cameraRunningRef.current) return;
        if (videoEl.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          try {
            await fm.send({ image: videoEl });
          } catch (_) {}
        }
        rafRef.current = requestAnimationFrame(sendFrame);
      };
      rafRef.current = requestAnimationFrame(sendFrame);
    }

    init().catch((err) => {
      console.warn("[GazeDetection] Unexpected error, proctoring disabled:", err);
      setStatus("idle");
    });

    return () => {
      destroyed = true;
      cameraRunningRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      faceMeshRef.current?.close();
      if (videoRef.current) videoRef.current.srcObject = null;
      setStatus("idle");
    };
  }, [enabled, computeGazeScore, gazeOffFrames, maxStrikes, onStrike, onTerminate]);

  return { videoRef, strikes, status };
}
