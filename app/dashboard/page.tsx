import Link from "next/link";
import React from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export default async function DashboardPage() {
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
  let firstName = "Student";
  let interviewsCompleted = 0;
  let lastScore: number | string = "--";
  let recentInterviews: any[] = [];
  let certificatesEarned = 0;
  let userCredits = 0;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, credits")
      .eq("id", user.id)
      .maybeSingle();

    const fullName = profile?.full_name || user.user_metadata?.full_name || "Student";
    firstName = fullName.split(" ")[0];
    userCredits = profile?.credits || 0;

    const { data: interviewsData } = await supabase
      .from("interviews")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (interviewsData) {
      recentInterviews = interviewsData;
      interviewsCompleted = interviewsData.length;
      if (interviewsData.length > 0) {
        lastScore = interviewsData[0].score !== null ? interviewsData[0].score : "--";
      }
    }

    const { count } = await supabase
      .from("certificates")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    certificatesEarned = count || 0;

    // Get role
    const { data: roleData } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const userRole = roleData?.role || "student";

    // Check if they have a mentor application
    const { data: app } = await supabase
      .from("mentor_applications")
      .select("status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const isMentorFlow = userRole === "mentor" || !!app;

    if (isMentorFlow) {
      // Mentor Dashboard logic
      const isApproved = userRole === "mentor";
      const { data: mentorData } = await supabase.from("mentors").select("*").eq("user_id", user.id).maybeSingle();
      const { count: sessionCount } = await supabase.from("mentor_bookings").select("*", { count: "exact", head: true }).eq("mentor_id", user.id);
      
      return (
        <div id="mentor-dash" className="relative">
          {!isApproved && (
            <div className="absolute inset-0 z-10 bg-[var(--c-bg)]/60 backdrop-blur-[2px] flex items-center justify-center rounded-2xl border border-white/5">
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
  }

  return (
    <div id="dash-home">
      <div className="flex justify-between items-end mb-7 flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-[clamp(24px,3vw,32px)] font-black m-0 mb-1.5 tracking-tight text-[var(--c-text)]">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-muted text-[15px] m-0">
            Track your progress and prep for your upcoming Job Interview mock.
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-7">
        <div className="stat-card" style={{ borderTopColor: "var(--c-primary)" }}>
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-muted font-semibold uppercase tracking-wider">
              Last Interview Score
            </span>
            <span className="material-symbols-outlined text-primary text-[20px]">analytics</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-[40px] font-black text-[var(--c-text)]">{lastScore}</span>
            <span className="text-muted text-base">/100</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-secondary">
            <span className="material-symbols-outlined text-base">trending_up</span>
            Based on AI evaluation
          </div>
        </div>

        <div className="stat-card" style={{ borderTopColor: "var(--c-secondary)" }}>
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-muted font-semibold uppercase tracking-wider">
              Interviews Completed
            </span>
            <span className="material-symbols-outlined text-secondary text-[20px]">history_edu</span>
          </div>
          <span className="font-heading text-[40px] font-black text-[var(--c-text)]">
            {interviewsCompleted}
          </span>
          <div className="progress-bar mt-1">
            <div className="progress-fill" style={{ width: `${Math.min(interviewsCompleted * 10, 100)}%` }}></div>
          </div>
        </div>

        {/* Credits stat card */}
        <div className="stat-card" style={{ borderTopColor: "var(--c-secondary)" }}>
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-muted font-semibold uppercase tracking-wider">
              Credits
            </span>
            <span className="material-symbols-outlined text-secondary text-[20px]">stars</span>
          </div>
          <span className="font-heading text-[40px] font-black text-[var(--c-text)]">
            {userCredits.toLocaleString()}
          </span>
          <div className="text-xs text-muted mt-1">Earn credits by completing interviews</div>
        </div>

        <div className="stat-card" style={{ borderTopColor: "var(--c-tertiary)" }}>
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-muted font-semibold uppercase tracking-wider">
              Certificates Earned
            </span>
            <span className="material-symbols-outlined text-tertiary text-[20px]">workspace_premium</span>
          </div>
          <span className="font-heading text-[40px] font-black text-[var(--c-text)]">
            {certificatesEarned}
          </span>
          <Link
            href="/dashboard/certificates"
            className="bg-transparent border-none cursor-pointer text-tertiary text-[13px] font-heading font-semibold flex items-center gap-1 p-0 no-underline"
          >
            View All{" "}
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
        </div>
      </div>

      {/* Activity & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 flex-wrap">
        {/* Recent Activity */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-heading text-lg font-bold m-0">Recent Activity</h3>
            <Link href="/dashboard/interviews" className="bg-transparent border-none cursor-pointer text-primary text-[13px] font-heading font-semibold hover:underline">
              View All
            </Link>
          </div>
          <div className="glass overflow-hidden rounded-[14px]">
            {recentInterviews.length === 0 ? (
              <div className="px-5 py-8 text-center text-muted">
                No recent interviews found. Start your first session!
              </div>
            ) : (
              recentInterviews.slice(0, 3).map((interview) => (
                <div key={interview.id} className="px-5 py-4 flex items-center justify-between border-b border-[var(--c-border)] cursor-pointer transition-colors hover:bg-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-[var(--c-bg3)] rounded-[10px] flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-[20px]">code</span>
                    </div>
                    <div>
                      <div className="font-heading text-sm font-semibold text-[var(--c-text)]">
                        {interview.title || "Mock Interview"}
                      </div>
                      <div className="text-xs text-muted">
                        Completed {new Date(interview.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-heading text-[15px] font-bold text-[var(--c-text)]">
                        {interview.score !== null ? `${interview.score}/100` : "--/100"}
                      </div>
                      <div className="badge badge-teal text-[9px]">Completed</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recommendation */}
        <div>
          <h3 className="font-heading text-lg font-bold m-0 mb-4">AI Recommendation</h3>
          <div className="ai-border p-6 bg-[var(--c-bg2)]">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="material-symbols-outlined filled text-primary text-[22px] font-variation-settings-filled">
                psychology
              </span>
              <span className="font-heading text-sm font-bold text-[var(--c-text)]">
                SAKSHAM.AI Insight
              </span>
            </div>
            <p className="text-[13px] text-[var(--c-text)] leading-[1.7] m-0 mb-4">
              {recentInterviews.length > 0
                ? "Your technical answers are solid. Review your previous AI feedback and continue practicing to boost your confidence."
                : "Welcome to SAKSHAM.AI! Start a mock interview to get personalized insights and improve your interview skills."}
            </p>
            <Link href="/dashboard/new" className="btn-primary w-full justify-center text-[13px] p-2.5">
              Practice Now
            </Link>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-2.5 mt-4">
            <Link href="/dashboard/resume" className="btn-ghost justify-center text-xs px-3 py-2.5 flex-col gap-1.5 h-auto">
              <span className="material-symbols-outlined text-[20px] text-primary">description</span>
              Resume
            </Link>
            <Link href="/dashboard/certificates" className="btn-ghost justify-center text-xs px-3 py-2.5 flex-col gap-1.5 h-auto">
              <span className="material-symbols-outlined text-[20px] text-secondary">verified</span>
              Certificates
            </Link>
          </div>
        </div>
      </div>

      {/* Become a Mentor Advertisement */}
      <div className="mt-12 glass p-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 border border-[var(--c-primary)]/20 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--c-primary)]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="relative z-10">
          <div className="badge badge-teal mb-4 px-3 py-1 text-[11px] font-bold tracking-widest uppercase">Expert Network</div>
          <h2 className="font-heading text-3xl font-black text-[var(--c-text)] mb-3">Share your knowledge. <br/><span className="text-[var(--c-primary)]">Become a Mentor.</span></h2>
          <p className="text-muted text-[15px] max-w-[500px] leading-relaxed">Join our community of industry experts, help students crack their dream interviews, and earn up to $100/hr while you're at it.</p>
        </div>
        <div className="relative z-10 shrink-0">
          <Link href="/dashboard/mentor-register" className="btn-primary py-4 px-10 text-[16px] shadow-lg shadow-[var(--c-primary)]/20 hover:-translate-y-1 transition-transform">
            Apply as Mentor
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
