"use client";
import dynamic from 'next/dynamic';
import { Loader2 } from "lucide-react";

// This is the magic part: it tells Next.js to NEVER try to render this page on the server
const OfflineResumeClient = dynamic(
  () => import('./OfflineResumeClient'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[#0e1417] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#00d1ff] animate-spin" />
      </div>
    )
  }
);

export default function OfflineResumePage() {
  return <OfflineResumeClient />;
}
