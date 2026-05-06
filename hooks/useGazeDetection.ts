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
  // Flag: only penalise AFTER camera has confirmed it's running
  const cameraRunningRef = useRef(false);

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

    // Poll until the video element is actually mounted in the DOM
    function waitForVideoRef(): Promise<HTMLVideoElement> {
      return new Promise((resolve) => {
        const check = () => {
          if (videoRef.current) return resolve(videoRef.current);
          if (!destroyed) setTimeout(check, 100);
        };
        check();
      });
    }

    async function init() {
      // Wait for the <video> element to be in the DOM before touching it
      const videoEl = await waitForVideoRef();
      if (destroyed) return;

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
        // Don't penalise until the camera is confirmed running
        if (destroyed || !cameraRunningRef.current) return;

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

      try {
        const cam = new Camera(videoEl, {
          onFrame: async () => {
            if (videoRef.current) await fm.send({ image: videoRef.current });
          },
          width: 320, height: 240,
        });
        cameraRef.current = cam;
        await cam.start();
        if (!destroyed) {
          cameraRunningRef.current = true;
          setStatus("ok");
        }
      } catch (err) {
        // Camera permission denied or unavailable — silently disable proctoring.
        // Do NOT penalise the student for a missing camera.
        console.warn("[GazeDetection] Camera unavailable, proctoring disabled:", err);
        if (!destroyed) setStatus("idle");
      }
    }

    init().catch((err) => {
      console.warn("[GazeDetection] Init failed, proctoring disabled:", err);
      setStatus("idle");
    });

    return () => {
      destroyed = true;
      cameraRunningRef.current = false;
      cameraRef.current?.stop();
      faceMeshRef.current?.close();
      setStatus("idle");
    };
  }, [enabled, computeGazeScore, gazeOffFrames, maxStrikes, onStrike, onTerminate]);

  return { videoRef, strikes, status };
}
