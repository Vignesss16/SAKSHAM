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

  const isApproved = userRole === "mentor";
  const hasApp = !!app;

  // If no application yet, show application CTA instead of dashboard
  if (!hasApp && !isApproved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8">
        <div className="glass p-12 max-w-2xl ai-border shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--c-primary)]/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          
          <div className="w-20 h-20 bg-[var(--c-primary)]/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <span className="material-symbols-outlined text-5xl text-[var(--c-primary)]">assignment_ind</span>
          </div>
          
          <h1 className="text-4xl font-black mb-4 tracking-tight">Become a SAKSHAM Expert</h1>
          <p className="text-lg text-muted mb-10 leading-relaxed">
            You are now in the Expert Portal. To start conducting mock interviews and earning, please complete your professional profile.
          </p>
          
          <Link href="/mentordashboard/apply" className="btn-primary py-5 px-12 text-lg shadow-xl shadow-[var(--c-primary)]/20">
            Start Your Application
            <span className="material-symbols-outlined ml-2">arrow_forward</span>
          </Link>
        </div>
      </div>
    );
  }

  const { data: mentorData } = await supabase.from("mentors").select("*").eq("user_id", user.id).maybeSingle();
  const { count: sessionCount } = await supabase.from("mentor_bookings").select("*", { count: "exact", head: true }).eq("mentor_id", user.id);

  return (
    <div id="mentor-dash" className="relative">
      <div className={`mb-7 ${!isApproved ? 'opacity-40 grayscale-[0.5]' : ''}`}>
        <h1 className="font-heading text-[32px] font-black m-0 mb-1.5 text-[var(--c-text)] tracking-tight">
          Mentor Dashboard
        </h1>
        <p className="text-muted text-[15px] m-0">Manage your students and track your earnings.</p>
      </div>

      <div className={`grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5 mb-8 ${!isApproved ? 'opacity-40 grayscale-[0.5]' : ''}`}>
        <div className="stat-card" style={{ borderTopColor: "var(--c-primary)" }}>
          <span className="text-[11px] text-muted font-semibold uppercase tracking-wider block mb-1">Total Earnings</span>
          <span className="font-heading text-[40px] font-black text-[var(--c-text)]">₹0.00</span>
        </div>
        <div className="stat-card" style={{ borderTopColor: "var(--c-secondary)" }}>
          <span className="text-[11px] text-muted font-semibold uppercase tracking-wider block mb-1">Active Sessions</span>
          <span className="font-heading text-[40px] font-black text-[var(--c-text)]">{sessionCount || 0}</span>
        </div>
        <div className="stat-card" style={{ borderTopColor: "var(--c-tertiary)" }}>
          <span className="text-[11px] text-muted font-semibold uppercase tracking-wider block mb-1">Your Rating</span>
          <span className="font-heading text-[40px] font-black text-[var(--c-text)]">
            {mentorData?.rating && mentorData.rating > 0 ? mentorData.rating.toFixed(1) : "New"}
          </span>
        </div>
      </div>

      <div className={`glass p-8 ai-border flex flex-col md:flex-row items-center justify-between gap-6 ${!isApproved ? 'opacity-40 grayscale-[0.5]' : ''}`}>
        <div>
          <h3 className="font-heading text-xl font-bold mb-2">Review Your Upcoming Sessions</h3>
          <p className="text-muted text-sm max-w-md">See who you're helping next and prepare for your consultations.</p>
        </div>
        <Link href="/mentordashboard/sessions" className={`btn-primary py-3 px-8 ${!isApproved ? 'pointer-events-none' : ''}`}>
          View All Sessions
        </Link>
      </div>
    </div>
  );
}
