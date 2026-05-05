"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function initNotifications() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }

      // Realtime subscription
      console.log(`Subscribing to notifications for user: ${user.id}`);
      const channel = supabase
        .channel(`user_notifications:${user.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          console.log("New notification received via realtime:", payload.new);
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
        })
        .subscribe((status) => {
          console.log(`Notification realtime status:`, status);
        });

      return () => {
        console.log(`Unsubscribing from notifications for user: ${user.id}`);
        supabase.removeChannel(channel);
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
                    {new Date(n.created_at).toLocaleDateString()} at {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
