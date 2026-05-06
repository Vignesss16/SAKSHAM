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
  // Use refs so the rAF loop always reads the latest value (never stale closures)
  const faceMeshRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const destroyedRef = useRef(false);
  const cameraRunningRef = useRef(false);

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
    const vRatio =
      lt && lb ? 1 - Math.abs((li.y - lt.y) / Math.max(lb.y - lt.y, 0.01) - 0.5) * 2 : 1;
    return (hRatio(li, lo, lc) + hRatio(ri, ro, rc) + vRatio) / 3;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Reset destroyed flag for this mount
    destroyedRef.current = false;

    function waitForVideo(): Promise<HTMLVideoElement> {
      return new Promise((resolve) => {
        const check = () => {
          if (videoRef.current) return resolve(videoRef.current);
          if (!destroyedRef.current) setTimeout(check, 100);
        };
        check();
      });
    }

    async function init() {
      const videoEl = await waitForVideo();
      if (destroyedRef.current) return;

      // ── 1. Get camera FIRST so user sees live feed immediately ───────────────
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
          audio: false,
        });
      } catch {
        if (!destroyedRef.current) setStatus("idle");
        return;
      }
      if (destroyedRef.current) { stream.getTracks().forEach((t) => t.stop()); return; }

      streamRef.current = stream;
      videoEl.srcObject = stream;
      videoEl.muted = true;
      videoEl.playsInline = true;
      await videoEl.play().catch(() => {});
      if (destroyedRef.current) return;

      setStatus("calibrating");

      // ── 2. Load FaceMesh WASM (with 45s timeout) ─────────────────────────────
      let FaceMeshClass: any;
      try {
        const mod = await Promise.race<any>([
          import("@mediapipe/face_mesh"),
          new Promise<never>((_, rej) =>
            setTimeout(() => rej(new Error("timeout")), 45000)
          ),
        ]);
        FaceMeshClass = mod.FaceMesh;
      } catch {
        if (!destroyedRef.current) setStatus("idle");
        return;
      }
      if (destroyedRef.current) return;

      const fm = new FaceMeshClass({
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
        // CRITICAL: check destroyedRef AND faceMeshRef before ANY access
        if (destroyedRef.current || !faceMeshRef.current || !cameraRunningRef.current) return;

        if (!results.multiFaceLandmarks?.length) {
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
            setTimeout(() => { if (!destroyedRef.current) setStatus("ok"); }, 4000);
          }
        }
      });

      // Warm up WASM before storing the ref
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 1; canvas.height = 1;
        await fm.send({ image: canvas });
      } catch { /* ignore warmup errors */ }

      if (destroyedRef.current) {
        // Already unmounted during warmup — close immediately and exit
        try { fm.close(); } catch { /* ignore */ }
        return;
      }

      // Store ref AFTER warmup succeeds and we know we're still mounted
      faceMeshRef.current = fm;
      cameraRunningRef.current = true;
      setStatus("ok");

      // ── 3. rAF loop — always checks destroyedRef & faceMeshRef ──────────────
      const sendFrame = async () => {
        // Hard stop: if destroyed or faceMesh nulled, exit immediately
        if (destroyedRef.current || !faceMeshRef.current || !cameraRunningRef.current) return;

        if (videoEl.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          try {
            // Check again inside try because async gap between checks
            if (faceMeshRef.current) {
              await faceMeshRef.current.send({ image: videoEl });
            }
          } catch { /* swallow send errors */ }
        }

        // Only reschedule if still alive
        if (!destroyedRef.current) {
          rafRef.current = requestAnimationFrame(sendFrame);
        }
      };
      rafRef.current = requestAnimationFrame(sendFrame);
    }

    init().catch(() => {
      if (!destroyedRef.current) setStatus("idle");
    });

    // ── Cleanup — order matters: stop rAF → null FaceMesh → close → stop camera ─
    return () => {
      destroyedRef.current = true;
      cameraRunningRef.current = false;

      // 1. Stop the rAF loop first (prevents any further fm.send calls)
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      // 2. Null out the faceMeshRef BEFORE calling close()
      //    so any in-flight onResults callback sees null and bails out
      const fmToClose = faceMeshRef.current;
      faceMeshRef.current = null;

      // 3. Close FaceMesh safely
      if (fmToClose) {
        try { fmToClose.close(); } catch { /* ignore */ }
      }

      // 4. Stop camera tracks
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;

      // 5. Detach stream from video element
      if (videoRef.current) videoRef.current.srcObject = null;

      setStatus("idle");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { videoRef, strikes, status };
}
