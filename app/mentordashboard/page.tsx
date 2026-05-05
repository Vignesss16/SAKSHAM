import Link from "next/link";
import React from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function MentorDashboardPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?role=mentor");
  }

  // Get role and application status
  const { data: roleData } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const userRole = roleData?.role || "student";

  const { data: app } = await supabase
    .from("mentor_applications")
    .select("status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const isMentorFlow = userRole === "mentor" || !!app;

  if (!isMentorFlow) {
    redirect("/dashboard");
  }

  const isApproved = userRole === "mentor";
  const { data: mentorData } = await supabase.from("mentors").select("*").eq("user_id", user.id).maybeSingle();
  const { count: sessionCount } = await supabase.from("mentor_bookings").select("*", { count: "exact", head: true }).eq("mentor_id", user.id);

  return (
    <div id="mentor-dash" className="relative">
      {!isApproved && (
        <div className="absolute inset-0 z-10 bg-[var(--c-bg)]/60 backdrop-blur-[2px] flex items-center justify-center rounded-2xl border border-white/5 min-h-[400px]">
          <div className="glass p-10 text-center max-w-md ai-border shadow-2xl">
            <div className="w-16 h-16 bg-[var(--c-primary)]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl text-[var(--c-primary)] animate-pulse">verified_user</span>
            </div>
            <h2 className="text-2xl font-black mb-3">Application Under Review</h2>
            <p className="text-muted mb-6 text-sm">We are currently verifying your professional background. You will get full access to these features within a few hours of approval.</p>
            <Link href="/dashboard/mentor-register" className="btn-primary py-3 px-8 text-sm">
              View Application Status
            </Link>
          </div>
        </div>
      )}

      <div className={`mb-7 ${!isApproved ? 'opacity-40 grayscale-[0.5]' : ''}`}>
        <h1 className="font-heading text-[32px] font-black m-0 mb-1.5 text-[var(--c-text)] tracking-tight">
          Mentor Dashboard
        </h1>
        <p className="text-muted text-[15px] m-0">Manage your students and track your earnings.</p>
      </div>

      <div className={`grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5 mb-8 ${!isApproved ? 'opacity-40 grayscale-[0.5]' : ''}`}>
        <div className="stat-card" style={{ borderTopColor: "var(--c-primary)" }}>
          <span className="text-[11px] text-muted font-semibold uppercase tracking-wider block mb-1">Total Earnings</span>
          <span className="font-heading text-[40px] font-black text-[var(--c-text)]">$0.00</span>
        </div>
        <div className="stat-card" style={{ borderTopColor: "var(--c-secondary)" }}>
          <span className="text-[11px] text-muted font-semibold uppercase tracking-wider block mb-1">Active Sessions</span>
          <span className="font-heading text-[40px] font-black text-[var(--c-text)]">{sessionCount || 0}</span>
        </div>
        <div className="stat-card" style={{ borderTopColor: "var(--c-tertiary)" }}>
          <span className="text-[11px] text-muted font-semibold uppercase tracking-wider block mb-1">Your Rating</span>
          <span className="font-heading text-[40px] font-black text-[var(--c-text)]">{mentorData?.rating || "5.0"}</span>
        </div>
      </div>

      <div className={`glass p-8 ai-border flex flex-col md:flex-row items-center justify-between gap-6 ${!isApproved ? 'opacity-40 grayscale-[0.5]' : ''}`}>
        <div>
          <h3 className="font-heading text-xl font-bold mb-2">Review Your Upcoming Sessions</h3>
          <p className="text-muted text-sm max-w-md">See who you're helping next and prepare for your consultations.</p>
        </div>
        <Link href="/dashboard/mentors/sessions" className={`btn-primary py-3 px-8 ${!isApproved ? 'pointer-events-none' : ''}`}>
          View All Sessions
        </Link>
      </div>
    </div>
  );
}
