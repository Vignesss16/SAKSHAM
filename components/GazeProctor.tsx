"use client";
import type { GazeStatus } from "@/hooks/useGazeDetection";

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>;
  strikes: number;
  maxStrikes: number;
  status: GazeStatus;
}

export default function GazeProctor({ videoRef, strikes, maxStrikes, status }: Props) {
  const color =
    status === "ok"          ? "#10b981" :
    status === "warning"     ? "#f59e0b" :
    status === "calibrating" ? "#00d1ff" : "#6b7280";

  return (
    <div style={{ position: "absolute", top: 16, right: 80, zIndex: 50,
                  display: "flex", flexDirection: "column",
                  alignItems: "flex-end", gap: 8 }}>

      {/* Small webcam preview */}
      <video
        ref={videoRef}
        autoPlay muted playsInline
        style={{ width: 90, height: 68, borderRadius: 8, objectFit: "cover",
                 border: `2px solid ${color}`, opacity: 0.85 }}
      />

      {/* Status badge */}
      <div style={{ background: "#1a1a1a", border: `1px solid ${color}`,
                    borderRadius: 6, padding: "3px 8px", fontSize: 11,
                    color, fontWeight: 700, letterSpacing: "0.05em" }}>
        {status === "calibrating" ? "CALIBRATING..." :
         status === "ok"          ? `EYE TRACK: ${strikes}/${maxStrikes}` :
         status === "warning"     ? `GAZE WARNING ${strikes}/${maxStrikes}` :
         "PROCTORING OFF"}
      </div>
    </div>
  );
}
