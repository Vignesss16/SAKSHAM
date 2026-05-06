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
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'info' | 'success' | 'alert' } | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const { localMicrophoneTrack } = useLocalMicrophoneTrack();
  const { localCameraTrack } = useLocalCameraTrack();
  useJoin({ appid: appId, channel: channelName, token: token, uid: parseInt(uid, 10) });
  usePublish([localMicrophoneTrack, localCameraTrack]);

  const remoteUsers = useRemoteUsers();
  
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    async function setupChatAndPresence() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user.id);

      // Fetch user profile for presence
      const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();

      // Fetch existing messages
      const { data: msgs } = await supabase
        .from("session_messages")
        .select("*")
        .eq("booking_id", channelName)
        .order("created_at", { ascending: true });
      
      if (msgs) setMessages(msgs);

      // Channel for Postgres Changes (Chat)
      const chatChannel = supabase
        .channel(`session_chat:${channelName}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'session_messages',
          filter: `booking_id=eq.${channelName}`
        }, (payload) => {
          console.log("In-call message received:", payload.new);
          setMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev;
            // Also filter out optimistic messages if we implement them
            if (prev.find(m => m.content === payload.new.content && m.user_id === payload.new.user_id && Date.now() - new Date(m.created_at).getTime() < 5000)) {
               // Replace the optimistic message with the real one from DB
               return prev.map(m => m.content === payload.new.content && m.user_id === payload.new.user_id ? payload.new : m);
            }
            return [...prev, payload.new];
          });
        })
        .subscribe();

      // Channel for Presence
      const presenceChannel = supabase.channel(`call_presence:${channelName}`, {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const newState = presenceChannel.presenceState();
          console.log("Presence sync:", newState);
          const users = Object.values(newState).flat();
          setParticipants(users);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          const joinedUser = newPresences[0] as any;
          if (key !== user.id) {
            setToast({ 
              message: `${joinedUser.full_name || 'Someone'} joined the room`, 
              type: 'success' 
            });
            
            // Special alert for student if mentor joins
            if (profile?.role === 'student' && joinedUser.role === 'mentor') {
              setToast({ 
                message: "🚀 Mentor has joined! Please enable your camera and mic.", 
                type: 'alert' 
              });
            }
          }
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          const leftUser = leftPresences[0] as any;
          if (key !== user.id) {
            setToast({ 
              message: `${leftUser.full_name || 'Someone'} left the room`, 
              type: 'info' 
            });
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            console.log("Presence subscribed in call room");
            await presenceChannel.track({
              id: user.id,
              full_name: profile?.full_name || user.email,
              role: profile?.role || 'student'
            });
          }
        });

      return () => {
        supabase.removeChannel(chatChannel);
        supabase.removeChannel(presenceChannel);
      };
    }
    setupChatAndPresence();
  }, [channelName, supabase]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;
    
    const messageText = newMessage.trim();
    setNewMessage("");

    // Optimistically update UI
    const optimisticMessage = {
      id: `temp-${Date.now()}`, // Temporary ID
      booking_id: channelName,
      user_id: currentUser,
      content: messageText,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, optimisticMessage]);

    const { error } = await supabase.from("session_messages").insert({
      booking_id: channelName,
      user_id: currentUser,
      content: messageText
    });

    if (error) {
      console.error(error);
      // Optional: remove optimistic message if failed
    }
  };

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
    router.push(`/dashboard/review/${channelName}`);
  };

  return (
    <div className="flex flex-col h-[85vh] bg-[#0a0a0a] rounded-2xl overflow-hidden border border-[var(--c-border)] shadow-2xl relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`absolute top-20 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top duration-300`}>
          <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${
            toast.type === 'alert' ? 'bg-amber-500/90 text-black border-amber-400' : 
            toast.type === 'success' ? 'bg-[var(--c-primary)]/90 text-black border-[var(--c-primary)]' : 
            'bg-[#1a1a1a]/90 text-white border-[var(--c-border)]'
          }`}>
            <span className="material-symbols-outlined text-[20px]">
              {toast.type === 'alert' ? 'campaign' : toast.type === 'success' ? 'person_add' : 'info'}
            </span>
            <span className="text-sm font-bold tracking-tight">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#121212] p-4 flex items-center justify-between border-b border-[var(--c-border)] z-30">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#64dc64] animate-pulse"></div>
          <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-white m-0">Live Mentorship</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-[var(--c-muted)] font-medium bg-[#1a1a1a] px-3 py-1 rounded-full border border-[var(--c-border)]">
            {participants.length} {participants.length === 1 ? 'Person' : 'People'} in Room
          </div>
          <button 
            onClick={() => setShowChat(!showChat)}
            className={`p-2 rounded-lg transition-colors ${showChat ? 'bg-[var(--c-primary)] text-black' : 'bg-[#1a1a1a] text-white hover:bg-[#252525]'}`}
          >
            <span className="material-symbols-outlined text-[20px]">chat</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Video Area */}
        <div className="flex-1 relative bg-black overflow-hidden flex items-center justify-center">
          {/* Remote Video (Main) */}
          {remoteUsers.map((user) => (
            <div key={user.uid} className="absolute inset-0 w-full h-full flex items-center justify-center bg-black">
              <RemoteUser user={user} playVideo={true} playAudio={true} className="w-full h-full object-contain" />
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-[10px] uppercase font-bold tracking-widest border border-white/10 z-10">
                Partner
              </div>
            </div>
          ))}
          
          {remoteUsers.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[var(--c-primary)]/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl text-[var(--c-primary)] animate-pulse">videocam</span>
              </div>
              <span className="text-[var(--c-muted)] font-medium tracking-tight">Waiting for participant...</span>
            </div>
          )}

          {/* Local Video (PIP) */}
          <div className={`absolute bottom-6 ${showChat ? 'right-6' : 'right-6'} w-40 md:w-56 aspect-video rounded-xl overflow-hidden border-2 border-[var(--c-primary)] shadow-2xl z-20 transition-all duration-500 ease-out ${!cameraOn ? 'bg-[#1a1a1a]' : 'bg-black'}`}>
            {localCameraTrack && cameraOn ? (
              <LocalVideoTrack track={localCameraTrack} play={true} className="w-full h-full object-contain bg-black" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[var(--c-muted)] bg-[#1a1a1a]">
                <span className="material-symbols-outlined text-2xl mb-1 opacity-20">person</span>
                <span className="text-[8px] uppercase font-black tracking-widest opacity-40">Privacy Mode</span>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-white text-[10px] font-bold flex items-center gap-1.5 z-10">
              You {!micOn && <span className="material-symbols-outlined text-[12px] text-[#ffb4ab]">mic_off</span>}
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className={`transition-all duration-300 ease-in-out border-l border-[var(--c-border)] bg-[#121212] flex flex-col ${showChat ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
          <div className="p-4 border-b border-[var(--c-border)]">
            <span className="font-bold text-sm text-white">In-Call Messages</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.user_id === currentUser ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.user_id === currentUser ? 'bg-[var(--c-primary)] text-black rounded-tr-none' : 'bg-[#1a1a1a] text-[var(--c-text)] rounded-tl-none border border-[var(--c-border)]'}`}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-[var(--c-muted)] mt-1 px-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={sendMessage} className="p-4 bg-[#1a1a1a]">
            <div className="relative">
              <input 
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[var(--c-border)] rounded-xl py-2.5 pl-4 pr-10 text-xs focus:border-[var(--c-primary)] outline-none"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--c-primary)] hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-[#121212] p-6 flex justify-center items-center gap-6 border-t border-[var(--c-border)] z-30">
        <button 
          onClick={toggleMic}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${micOn ? 'bg-[#1a1a1a] hover:bg-[#252525] text-white' : 'bg-[#ffb4ab] text-[#001f28] shadow-lg shadow-[#ffb4ab]/20 scale-110'}`}
        >
          <span className="material-symbols-outlined text-[22px]">{micOn ? 'mic' : 'mic_off'}</span>
        </button>
        
        <button 
          onClick={toggleCamera}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${cameraOn ? 'bg-[#1a1a1a] hover:bg-[#252525] text-white' : 'bg-[#ffb4ab] text-[#001f28] shadow-lg shadow-[#ffb4ab]/20 scale-110'}`}
        >
          <span className="material-symbols-outlined text-[22px]">{cameraOn ? 'videocam' : 'videocam_off'}</span>
        </button>

        <div className="w-[1px] h-8 bg-[var(--c-border)] mx-2"></div>

        <button 
          onClick={endCall}
          className="px-8 h-12 rounded-2xl flex items-center justify-center bg-red-500 hover:bg-red-600 text-white font-bold transition-all shadow-lg shadow-red-500/20 gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">call_end</span>
          <span className="text-sm">End Session</span>
        </button>
      </div>
    </div>
  );
}
