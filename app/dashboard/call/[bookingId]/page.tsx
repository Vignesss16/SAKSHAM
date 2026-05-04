"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import AgoraRTC, {
  AgoraRTCProvider,
  LocalVideoTrack,
  RemoteUser,
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteUsers,
} from "agora-rtc-react";

// Client instance
const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

export default function CallPage() {
  const params = useParams();
  const router = useRouter();
  const [tokenData, setTokenData] = useState<{ token: string, uid: string } | null>(null);
  const [error, setError] = useState("");
  const bookingId = params.bookingId as string;

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function initCall() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not logged in");

        // Verify booking
        const { data: booking, error: bookingErr } = await supabase
          .from("mentor_bookings")
          .select("*")
          .eq("id", bookingId)
          .single();

        if (bookingErr || !booking) throw new Error("Invalid booking");
        
        // Random UID for Agora
        const randomUid = Math.floor(Math.random() * 1000000).toString();

        const res = await fetch(`/api/generate-agora-mentor-token?channelName=${bookingId}&uid=${randomUid}`);
        const data = await res.json();
        
        if (data.error) throw new Error(data.error);

        setTokenData({ token: data.token, uid: data.uid });

      } catch (err: any) {
        setError(err.message);
      }
    }
    initCall();
  }, [bookingId, supabase]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] flex-col text-center">
        <span className="material-symbols-outlined text-4xl text-[#ffb4ab] mb-4">error</span>
        <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-white">Call Error</h2>
        <p className="text-[var(--c-muted)]">{error}</p>
        <button onClick={() => router.push('/dashboard')} className="btn-secondary mt-6">Go Back</button>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[var(--c-primary)] border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 font-semibold text-[var(--c-muted)]">Connecting to secure room...</span>
      </div>
    );
  }

  return (
    <AgoraRTCProvider client={client}>
      <CallRoom 
        appId={process.env.NEXT_PUBLIC_AGORA_MENTOR_APP_ID!}
        channelName={bookingId}
        token={tokenData.token}
        uid={tokenData.uid}
      />
    </AgoraRTCProvider>
  );
}

function CallRoom({ appId, channelName, token, uid }: { appId: string, channelName: string, token: string, uid: string }) {
  const router = useRouter();
  
  const { localMicrophoneTrack } = useLocalMicrophoneTrack();
  const { localCameraTrack } = useLocalCameraTrack();
  useJoin({ appid: appId, channel: channelName, token: token, uid: parseInt(uid, 10) });
  usePublish([localMicrophoneTrack, localCameraTrack]);

  const remoteUsers = useRemoteUsers();
  
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  const toggleMic = () => {
    if (localMicrophoneTrack) {
      localMicrophoneTrack.setMuted(micOn);
      setMicOn(!micOn);
    }
  };

  const toggleCamera = () => {
    if (localCameraTrack) {
      localCameraTrack.setMuted(cameraOn);
      setCameraOn(!cameraOn);
    }
  };

  const endCall = async () => {
    // In a real app we would update the booking status to "completed" here
    // using a server action or API route.
    router.push(`/dashboard/review/${channelName}`);
  };

  return (
    <div className="flex flex-col h-[80vh] bg-[#121212] rounded-2xl overflow-hidden border border-[var(--c-border)] shadow-2xl">
      <div className="bg-[#1a1a1a] p-4 flex items-center justify-between border-b border-[var(--c-border)]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#64dc64] animate-pulse"></div>
          <span className="font-['Plus_Jakarta_Sans'] font-bold text-white">Live Session</span>
        </div>
        <div className="text-sm text-[var(--c-muted)]">
          {remoteUsers.length} Participant(s) joined
        </div>
      </div>

      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Local Video */}
        <div className="relative rounded-xl overflow-hidden bg-black flex items-center justify-center">
          {localCameraTrack && cameraOn ? (
            <LocalVideoTrack track={localCameraTrack} play={true} className="w-full h-full object-cover" />
          ) : (
            <div className="text-[var(--c-muted)] flex flex-col items-center">
              <span className="material-symbols-outlined text-4xl mb-2">videocam_off</span>
              Camera Off
            </div>
          )}
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-sm font-bold flex items-center gap-2">
            You {!micOn && <span className="material-symbols-outlined text-[16px] text-[#ffb4ab]">mic_off</span>}
          </div>
        </div>

        {/* Remote Video */}
        {remoteUsers.map((user) => (
          <div key={user.uid} className="relative rounded-xl overflow-hidden bg-black flex items-center justify-center">
            <RemoteUser user={user} playVideo={true} playAudio={true} className="w-full h-full object-cover" />
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-sm font-bold">
              Participant
            </div>
          </div>
        ))}
        
        {remoteUsers.length === 0 && (
          <div className="relative rounded-xl overflow-hidden bg-[#1a1a1a] flex flex-col items-center justify-center border border-[var(--c-border)] border-dashed">
            <span className="material-symbols-outlined text-4xl text-[var(--c-muted)] mb-3 animate-pulse">hourglass_empty</span>
            <span className="text-[var(--c-muted)] font-medium">Waiting for other participant to join...</span>
          </div>
        )}
      </div>

      <div className="bg-[#1a1a1a] p-4 flex justify-center items-center gap-4 border-t border-[var(--c-border)]">
        <button 
          onClick={toggleMic}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${micOn ? 'bg-[var(--c-bg3)] hover:bg-[var(--c-muted)] text-white' : 'bg-[#ffb4ab] text-[#001f28]'}`}
        >
          <span className="material-symbols-outlined text-2xl">{micOn ? 'mic' : 'mic_off'}</span>
        </button>
        
        <button 
          onClick={toggleCamera}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${cameraOn ? 'bg-[var(--c-bg3)] hover:bg-[var(--c-muted)] text-white' : 'bg-[#ffb4ab] text-[#001f28]'}`}
        >
          <span className="material-symbols-outlined text-2xl">{cameraOn ? 'videocam' : 'videocam_off'}</span>
        </button>

        <button 
          onClick={endCall}
          className="w-14 h-14 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white transition-colors"
          title="End Call"
        >
          <span className="material-symbols-outlined text-2xl">call_end</span>
        </button>
      </div>
    </div>
  );
}
