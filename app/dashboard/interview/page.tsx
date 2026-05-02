"use client";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

// The Agora setup relies heavily on browser APIs (WebRTC, Canvas, etc)
// so we MUST disable SSR for the client component.
const InterviewRoomClient = dynamic(() => import("./InterviewRoomClient"), {
  ssr: false,
});

export default function InterviewRoomPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <InterviewRoomClient />
    </Suspense>
  );
}
