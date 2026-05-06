"use client";

import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function SessionChatDrawer({ bookingId, onClose, otherPartyName }: { bookingId: string, onClose: () => void, otherPartyName: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    let channel: any;

    async function setupChat() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUser(user.id);

      // 1. Fetch initial messages
      const { data } = await supabase
        .from("session_messages")
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });
      
      if (data) setMessages(data);

      // 2. Setup Realtime
      console.log(`Subscribing to chat for booking: ${bookingId}`);
      channel = supabase
        .channel(`drawer_chat:${bookingId}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'session_messages',
          filter: `booking_id=eq.${bookingId}`
        }, (payload) => {
          console.log("New message received via realtime:", payload.new);
          setMessages(prev => {
            // Prevent duplicates
            if (prev.find(m => m.id === payload.new.id)) return prev;
            
            // Deduplicate optimistic messages
            const existingMatch = prev.find(m => 
              m.content === payload.new.content && 
              m.user_id === payload.new.user_id && 
              m.id.toString().startsWith('temp-')
            );

            if (existingMatch) {
              return prev.map(m => m.id === existingMatch.id ? payload.new : m);
            }

            return [...prev, payload.new];
          });
        })
        .subscribe((status) => {
          console.log(`Realtime status for booking ${bookingId}:`, status);
        });
    }

    setupChat();

    return () => {
      if (channel) {
        console.log(`Unsubscribing from chat for booking: ${bookingId}`);
        supabase.removeChannel(channel);
      }
    };
  }, [bookingId, supabase]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const messageText = newMessage.trim();
    setNewMessage("");

    // Optimistic Update
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      booking_id: bookingId,
      user_id: currentUser,
      content: messageText,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);

    const { error } = await supabase.from("session_messages").insert({
      booking_id: bookingId,
      user_id: currentUser,
      content: messageText
    });

    if (error) {
      console.error("Error sending message:", error);
      // Revert optimistic update on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-[#121212] h-full shadow-2xl flex flex-col border-l border-[var(--c-border)] animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-[var(--c-border)] flex items-center justify-between bg-[#1a1a1a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--c-primary)]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[var(--c-primary)]">chat</span>
            </div>
            <div>
              <h3 className="text-white font-bold m-0 text-sm">Chat with {otherPartyName}</h3>
              <div className="text-[10px] text-[var(--c-muted)] uppercase font-bold tracking-widest">Active Session Chat</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 text-[var(--c-muted)]">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <span className="material-symbols-outlined text-4xl text-[var(--c-muted)] mb-3 opacity-20">forum</span>
              <p className="text-[var(--c-muted)] text-sm">No messages yet. Say hello to {otherPartyName} to coordinate your session!</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.user_id === currentUser ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${msg.user_id === currentUser ? 'bg-[var(--c-primary)] text-black rounded-tr-none font-medium' : 'bg-[#1a1a1a] text-[var(--c-text)] rounded-tl-none border border-[var(--c-border)]'}`}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-[var(--c-muted)] mt-1.5 px-1 opacity-60">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>

        <form onSubmit={sendMessage} className="p-6 bg-[#1a1a1a] border-t border-[var(--c-border)]">
          <div className="relative">
            <input 
              type="text"
              placeholder="Type your message here..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[var(--c-border)] rounded-xl py-3.5 pl-5 pr-14 text-sm focus:border-[var(--c-primary)] outline-none text-white"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-[var(--c-primary)] text-black flex items-center justify-center hover:scale-105 transition-transform active:scale-95">
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </div>
          <p className="text-[10px] text-[var(--c-muted)] mt-3 text-center italic">Coordination chat is monitored for quality assurance</p>
        </form>
      </div>
    </div>
  );
}
