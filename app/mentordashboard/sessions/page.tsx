"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";

type Booking = {
  id: string;
  scheduled_at: string;
  status: string;
  meeting_link: string;
  mentor: { profiles: { full_name: string } } | null;
  student: { full_name: string } | null;
  mentor_id: string;
  student_id: string;
};

export default function MentorSessionsPage() {
  const [sessions, setSessions] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchSessions() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data, error } = await supabase
        .from("mentor_bookings")
        .select(`
          id, scheduled_at, status, meeting_link, mentor_id, student_id,
          mentor:mentor_id(profiles(full_name)),
          student:student_id(full_name)
        `)
        .or(`student_id.eq.${user.id},mentor_id.eq.${user.id}`)
        .order("scheduled_at", { ascending: true });

      if (error) {
        console.error("Error fetching sessions:", error);
      }
      if (data) setSessions(data as any);
      setLoading(false);
    }
    fetchSessions();
  }, [supabase]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-amber-400 bg-amber-400/10";
      case "confirmed": return "text-blue-400 bg-blue-400/10";
      case "completed": return "text-green-400 bg-green-400/10";
      case "cancelled": return "text-red-400 bg-red-400/10";
      default: return "text-gray-400 bg-gray-400/10";
    }
  };

  const handleStatusUpdate = async (sessionId: string, newStatus: string, studentId: string) => {
    const { error } = await supabase
      .from("mentor_bookings")
      .update({ status: newStatus })
      .eq("id", sessionId);

    if (error) {
      alert("Error updating status: " + error.message);
    } else {
      // Notify student if confirmed
      if (newStatus === 'confirmed') {
        await supabase.from("notifications").insert({
          user_id: studentId,
          title: "Booking Confirmed! ✅",
          content: "Your mentorship session has been accepted. You can now join the call at the scheduled time.",
          type: "booking_confirmed",
          link: `/dashboard/mentors/sessions`
        });
      }

      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: newStatus } : s));
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-black tracking-tight text-[var(--c-text)] m-0 mb-2">
          My Sessions
        </h1>
        <p className="text-[var(--c-muted)] text-[15px] m-0">
          Manage your upcoming and past mentorship sessions.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-[var(--c-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass p-16 text-center">
          <span className="material-symbols-outlined text-5xl text-[var(--c-primary)] mb-4 block">event_busy</span>
          <h3 className="text-xl font-bold mb-2">No Sessions Yet</h3>
          <p className="text-[var(--c-muted)] mb-8">Once students book sessions with you, they will appear here.</p>
          <Link href="/mentordashboard" className="btn-primary py-3 px-8">
            Back to Dashboard
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const isMentor = session.mentor_id === userId;
            const otherParty = isMentor ? session.student?.full_name : session.mentor?.profiles?.full_name;
            const canJoin = session.status === "confirmed";
            const isPending = session.status === "pending";

            return (
              <div key={session.id} className="glass p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5 w-full md:w-auto">
                  <div className="w-12 h-12 rounded-xl bg-[var(--c-bg3)] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[var(--c-primary)]">
                      {isMentor ? "person" : "school"}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-[var(--c-text)] text-lg">
                      Session with {otherParty || "Unknown"}
                    </div>
                    <div className="text-sm text-[var(--c-muted)] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                      {new Intl.DateTimeFormat('en-US', {
                        dateStyle: 'full',
                        timeStyle: 'short'
                      }).format(new Date(session.scheduled_at))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(session.status)}`}>
                    {session.status}
                  </span>

                  {isPending && isMentor && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleStatusUpdate(session.id, 'confirmed', session.student_id)}
                        className="btn-primary py-2 px-4 text-xs"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(session.id, 'cancelled', session.student_id)}
                        className="btn-secondary py-2 px-4 text-xs border-red-500/20 text-red-400 hover:bg-red-500/10"
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  {canJoin && (
                    <Link href={`/dashboard/call/${session.id}`} className="btn-primary py-2 px-6 text-sm">
                      Join Call
                      <span className="material-symbols-outlined text-[18px] ml-1">videocam</span>
                    </Link>
                  )}
                  {session.status === "completed" && (
                    <Link href={`/mentordashboard/review/${session.id}`} className="btn-secondary py-2 px-6 text-sm">
                      View Review
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
