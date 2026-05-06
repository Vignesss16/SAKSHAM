"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [activeToast, setActiveToast] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => setActiveToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  useEffect(() => {
    async function initNotifications() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch initial notifications
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.is_read).length);
      }

      // Realtime subscription for notifications
      const notificationChannel = supabase
        .channel(`user_notifications:${user.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, (payload: any) => {
          console.log("New notification:", payload.new);
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
          setActiveToast({ 
            title: payload.new.title, 
            content: payload.new.content, 
            type: 'notification',
            link: payload.new.link 
          });
        })
        .subscribe();

      // Realtime subscription for chat messages (Global)
      // First find all active booking IDs for this user
      const { data: bookings } = await supabase
        .from("mentor_bookings")
        .select("id")
        .or(`student_id.eq.${user.id},mentor_id.eq.${user.id}`)
        .in("status", ["pending", "confirmed"]);

      if (bookings && bookings.length > 0) {
        const bookingIds = bookings.map((b: any) => b.id);
        
        const chatChannel = supabase
          .channel('global_chat_notifications')
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'session_messages'
          }, (payload: any) => {
            // Only notify if the message belongs to one of our bookings AND is not from us
            if (bookingIds.includes(payload.new.booking_id) && payload.new.user_id !== user.id) {
              setActiveToast({
                title: "New Message 💬",
                content: payload.new.content,
                type: 'chat',
                link: '/dashboard/mentors/sessions' // General link
              });
            }
          })
          .subscribe();
      }

      return () => {
        supabase.removeAllChannels();
      };
    }
    initNotifications();
  }, [supabase]);

  const markAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return (
    <div className="relative">
      {/* Global Toast Bar */}
      {activeToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-top duration-500 w-[calc(100%-40px)] max-w-md">
          <Link 
            href={activeToast.link || "#"}
            onClick={() => setActiveToast(null)}
            className="block glass bg-[#1a1a1a]/95 border-2 border-[var(--c-primary)]/50 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] group hover:scale-[1.02] transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--c-primary)]/20 flex items-center justify-center text-[var(--c-primary)] shrink-0">
                <span className="material-symbols-outlined text-[28px]">
                  {activeToast.type === 'chat' ? 'chat' : 'notifications_active'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black text-white mb-0.5 flex items-center justify-between">
                  {activeToast.title}
                  <span className="text-[10px] text-[var(--c-primary)] font-bold uppercase tracking-widest bg-[var(--c-primary)]/10 px-2 py-0.5 rounded-full">New</span>
                </div>
                <p className="text-xs text-[var(--c-muted)] font-medium truncate leading-tight">{activeToast.content}</p>
              </div>
              <button 
                onClick={(e) => { e.preventDefault(); setActiveToast(null); }}
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/40"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </Link>
        </div>
      )}

      <button 
        onClick={() => {
          setShowDropdown(!showDropdown);
          if (!showDropdown && unreadCount > 0) markAsRead();
        }}
        className="w-10 h-10 rounded-xl bg-[var(--c-bg3)] hover:bg-[var(--c-muted)]/20 flex items-center justify-center transition-all relative"
      >
        <span className="material-symbols-outlined text-[var(--c-text)]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-3 w-80 bg-[#121212] border border-[var(--c-border)] rounded-2xl shadow-2xl z-[100] overflow-hidden">
          <div className="p-4 border-b border-[var(--c-border)] flex items-center justify-between">
            <span className="font-bold text-sm text-white">Notifications</span>
            {unreadCount > 0 && <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{unreadCount} New</span>}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-[var(--c-muted)] text-sm italic">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <Link 
                  key={n.id} 
                  href={n.link || "#"}
                  className={`block p-4 border-b border-[var(--c-border)] hover:bg-white/5 transition-colors ${!n.is_read ? 'bg-[var(--c-primary)]/5' : ''}`}
                >
                  <div className="font-bold text-xs text-white mb-1">{n.title}</div>
                  <p className="text-[11px] text-[var(--c-muted)] leading-relaxed">{n.content}</p>
                  <div className="text-[9px] text-[var(--c-muted)] mt-2 opacity-60">
                    {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(n.created_at))}
                  </div>
                </Link>
              ))
            )}
          </div>
          
          <div className="p-3 bg-[#1a1a1a] text-center">
            <button className="text-[10px] text-[var(--c-primary)] font-bold hover:underline">View All Notifications</button>
          </div>
        </div>
      )}
    </div>
  );
}
