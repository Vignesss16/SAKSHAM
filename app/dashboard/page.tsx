import Link from "next/link";
import React from "react";

export default function DashboardPage() {
  return (
    <div id="dash-home">
      <div className="flex justify-between items-end mb-7 flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-[clamp(24px,3vw,32px)] font-black m-0 mb-1.5 tracking-tight text-[var(--c-text)]">
            Welcome back, Alex 👋
          </h1>
          <p className="text-muted text-[15px] m-0">
            Track your progress and prep for your upcoming Software Engineer mock.
          </p>
        </div>
        <Link href="/dashboard/new" className="btn-ghost">
          <span className="material-symbols-outlined text-[18px]">
            calendar_month
          </span>
          View Schedule
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-7">
        <div
          className="stat-card"
          style={{ borderTopColor: "var(--c-primary)" }}
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-muted font-semibold uppercase tracking-wider">
              Last Interview Score
            </span>
            <span className="material-symbols-outlined text-primary text-[20px]">
              analytics
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-[40px] font-black text-[var(--c-text)]">
              78
            </span>
            <span className="text-muted text-base">/100</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-secondary">
            <span className="material-symbols-outlined text-base">
              trending_up
            </span>
            +5.2% from last session
          </div>
        </div>

        <div
          className="stat-card"
          style={{ borderTopColor: "var(--c-secondary)" }}
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-muted font-semibold uppercase tracking-wider">
              Interviews Completed
            </span>
            <span className="material-symbols-outlined text-secondary text-[20px]">
              history_edu
            </span>
          </div>
          <span className="font-heading text-[40px] font-black text-[var(--c-text)]">
            12
          </span>
          <div className="progress-bar mt-1">
            <div className="progress-fill w-[75%]"></div>
          </div>
        </div>

        <div
          className="stat-card"
          style={{
            borderTopColor: "var(--c-primary)",
            borderLeft: "3px solid var(--c-primary)",
          }}
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-muted font-semibold uppercase tracking-wider">
              Next Scheduled
            </span>
            <span className="material-symbols-outlined text-primary text-[20px]">
              event
            </span>
          </div>
          <div>
            <span className="font-heading text-[17px] font-bold">
              Tomorrow, 10 AM
            </span>
            <p className="text-muted text-xs mt-1 mb-0">
              Frontend Architecture Review
            </p>
          </div>
          <Link
            href="/dashboard/new"
            className="bg-transparent border-none cursor-pointer text-primary text-[13px] font-heading font-semibold flex items-center gap-1 p-0 no-underline"
          >
            Prepare Now{" "}
            <span className="material-symbols-outlined text-base">
              arrow_forward
            </span>
          </Link>
        </div>

        <div
          className="stat-card"
          style={{ borderTopColor: "var(--c-tertiary)" }}
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-muted font-semibold uppercase tracking-wider">
              Certificates Earned
            </span>
            <span className="material-symbols-outlined text-tertiary text-[20px]">
              workspace_premium
            </span>
          </div>
          <span className="font-heading text-[40px] font-black text-[var(--c-text)]">
            3
          </span>
          <Link
            href="/dashboard/certificates"
            className="bg-transparent border-none cursor-pointer text-tertiary text-[13px] font-heading font-semibold flex items-center gap-1 p-0 no-underline"
          >
            View All{" "}
            <span className="material-symbols-outlined text-base">
              arrow_forward
            </span>
          </Link>
        </div>
      </div>

      {/* Activity & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 flex-wrap">
        {/* Recent Activity */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-heading text-lg font-bold m-0">
              Recent Activity
            </h3>
            <Link href="/dashboard/interviews" className="bg-transparent border-none cursor-pointer text-primary text-[13px] font-heading font-semibold hover:underline">
              View All
            </Link>
          </div>
          <div className="glass overflow-hidden rounded-[14px]">
            {/* Activity items */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--c-border)] cursor-pointer transition-colors hover:bg-white/5">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-[var(--c-bg3)] rounded-[10px] flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">
                    code
                  </span>
                </div>
                <div>
                  <div className="font-heading text-sm font-semibold text-[var(--c-text)]">
                    Software Engineer – Backend Focus
                  </div>
                  <div className="text-xs text-muted">
                    Completed 2 hours ago · 45 min
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-heading text-[15px] font-bold text-[var(--c-text)]">
                    82/100
                  </div>
                  <div className="badge badge-teal text-[9px]">Completed</div>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--c-border)] cursor-pointer transition-colors hover:bg-white/5">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-[var(--c-bg3)] rounded-[10px] flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">
                    data_object
                  </span>
                </div>
                <div>
                  <div className="font-heading text-sm font-semibold text-[var(--c-text)]">
                    Data Structure Deep Dive
                  </div>
                  <div className="text-xs text-muted">
                    Scheduled for Oct 24, 2:00 PM
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-heading text-[15px] font-bold text-muted">
                  --/--
                </div>
                <div className="badge badge-blue text-[9px]">Pending</div>
              </div>
            </div>

            <div className="px-5 py-4 flex items-center justify-between cursor-pointer transition-colors hover:bg-white/5">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-[var(--c-bg3)] rounded-[10px] flex items-center justify-center text-tertiary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">
                    psychology
                  </span>
                </div>
                <div>
                  <div className="font-heading text-sm font-semibold text-[var(--c-text)]">
                    Behavioral Interview Round
                  </div>
                  <div className="text-xs text-muted">
                    Completed Oct 20 · 32 min
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-heading text-[15px] font-bold text-[var(--c-text)]">
                  74/100
                </div>
                <div className="badge badge-teal text-[9px]">Completed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div>
          <h3 className="font-heading text-lg font-bold m-0 mb-4">
            AI Recommendation
          </h3>
          <div className="ai-border p-6 bg-[var(--c-bg2)]">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="material-symbols-outlined filled text-primary text-[22px] font-variation-settings-filled">
                psychology
              </span>
              <span className="font-heading text-sm font-bold text-[var(--c-text)]">
                PrepAI Insight
              </span>
            </div>
            <p className="text-[13px] text-[var(--c-text)] leading-[1.7] m-0 mb-4">
              Your technical answers are strong, but your soft-skill responses
              show hesitancy. Focus on STAR-method behavioral questions before
              your next interview.
            </p>
            <Link
              href="/dashboard/new"
              className="btn-primary w-full justify-center text-[13px] p-2.5"
            >
              Practice Behavioral
            </Link>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-2.5 mt-4">
            <Link
              href="/dashboard/resume"
              className="btn-ghost justify-center text-xs px-3 py-2.5 flex-col gap-1.5 h-auto"
            >
              <span className="material-symbols-outlined text-[20px] text-primary">
                description
              </span>
              Resume
            </Link>
            <Link
              href="/dashboard/certificates"
              className="btn-ghost justify-center text-xs px-3 py-2.5 flex-col gap-1.5 h-auto"
            >
              <span className="material-symbols-outlined text-[20px] text-secondary">
                verified
              </span>
              Certificates
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
