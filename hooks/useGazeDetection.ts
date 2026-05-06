"use client";
import { useEffect, useRef, useState, useCallback } from "react";

export type GazeStatus = "idle" | "calibrating" | "ok" | "warning" | "terminated";

interface UseGazeDetectionOptions {
  enabled: boolean;              // only run when challenge is active
  maxStrikes?: number;           // default 3
  gazeOffFrames?: number;        // frames before counting as "away" (default 45 = 1.5s)
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
  const cameraRef = useRef<any>(null);

  const computeGazeScore = useCallback((landmarks: any[]) => {
    const li = landmarks[468]; const lo = landmarks[33];  const lc = landmarks[133];
    const ri = landmarks[473]; const ro = landmarks[362]; const rc = landmarks[263];
    const lt = landmarks[159]; const lb = landmarks[145];
    if (!li || !ri || !lo || !lc || !ro || !rc) return 1;

    function hRatio(iris: any, outer: any, inner: any) {
      const w = Math.abs(inner.x - outer.x);
      if (w < 0.01) return 1;
      const off = Math.abs(iris.x - (outer.x + inner.x) / 2);
      return 1 - off / (w * 0.5);
    }

    const vRatio = lt && lb
      ? 1 - Math.abs((li.y - lt.y) / Math.max(lb.y - lt.y, 0.01) - 0.5) * 2
      : 1;

    return (hRatio(li,lo,lc) + hRatio(ri,ro,rc) + vRatio) / 3;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let destroyed = false;

    async function init() {
      const [{ FaceMesh }, { Camera }] = await Promise.all([
        import("@mediapipe/face_mesh"),
        import("@mediapipe/camera_utils"),
      ]);
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
        if (destroyed) return;
        if (!results.multiFaceLandmarks?.length) {
          gazeOffRef.current += 2; // no face = penalise faster
        } else {
          const score = computeGazeScore(results.multiFaceLandmarks[0]);
          if (score < 0.40) gazeOffRef.current++;
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
      setStatus("calibrating");

      const cam = new Camera(videoRef.current!, {
        onFrame: async () => { await fm.send({ image: videoRef.current! }); },
        width: 320, height: 240,
      });
      cameraRef.current = cam;
      await cam.start();
      if (!destroyed) setStatus("ok");
    }

    init().catch(console.error);
    return () => {
      destroyed = true;
      cameraRef.current?.stop();
      faceMeshRef.current?.close();
      setStatus("idle");
    };
  }, [enabled, computeGazeScore, gazeOffFrames, maxStrikes, onStrike, onTerminate]);

  return { videoRef, strikes, status };
}
