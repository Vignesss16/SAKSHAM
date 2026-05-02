import Link from "next/link";

const sessions = [
  { id: 1, title: "Software Engineer – Backend Focus", date: "2 hours ago", duration: "45 min", score: 82, status: "Completed", icon: "code", iconColor: "text-[#00d1ff]" },
  { id: 2, title: "Frontend Architecture Review", date: "Tomorrow, 10 AM", duration: "45 min", score: null, status: "Scheduled", icon: "web", iconColor: "text-[#44e2cd]" },
  { id: 3, title: "Behavioral Interview Round", date: "Oct 20", duration: "32 min", score: 74, status: "Completed", icon: "psychology", iconColor: "text-[#ecd3ff]" },
  { id: 4, title: "Data Structure Deep Dive", date: "Oct 24, 2:00 PM", duration: null, score: null, status: "Pending", icon: "data_object", iconColor: "text-[#00d1ff]" },
  { id: 5, title: "System Design Round", date: "Oct 15", duration: "60 min", score: 91, status: "Completed", icon: "hub", iconColor: "text-[#44e2cd]" },
];

export default function InterviewsPage() {
  return (
    <div>
      <div className="flex justify-between items-end mb-7 flex-wrap gap-4">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-black tracking-tight text-[var(--c-text)] m-0 mb-1.5">
            Interviews
          </h1>
          <p className="text-[var(--c-muted)] text-[15px] m-0">
            All your mock interview sessions in one place.
          </p>
        </div>
        <Link href="/dashboard/new" className="btn-primary text-[13px]">
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          New Interview
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-7">
        {[
          { label: "Total Sessions", value: "12", icon: "history_edu", color: "var(--c-primary)" },
          { label: "Avg. Score", value: "79", icon: "analytics", color: "var(--c-secondary)" },
          { label: "Hours Practiced", value: "8.5", icon: "schedule", color: "var(--c-tertiary)" },
          { label: "Certificates", value: "3", icon: "workspace_premium", color: "var(--c-primary)" },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ borderTopColor: s.color }}>
            <div className="flex justify-between items-start">
              <span className="text-[11px] text-[var(--c-muted)] font-semibold uppercase tracking-wider">{s.label}</span>
              <span className="material-symbols-outlined text-[20px]" style={{ color: s.color }}>{s.icon}</span>
            </div>
            <span className="font-['Plus_Jakarta_Sans'] text-[40px] font-black text-[var(--c-text)]">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Sessions list */}
      <div>
        <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold mb-4">All Sessions</h3>
        <div className="glass overflow-hidden rounded-[14px]">
          {sessions.map((s, i) => (
            <div
              key={s.id}
              className={`px-5 py-4 flex items-center justify-between cursor-pointer transition-colors hover:bg-white/5 ${i < sessions.length - 1 ? "border-b border-[var(--c-border)]" : ""}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-[var(--c-bg3)] rounded-[10px] flex items-center justify-center shrink-0">
                  <span className={`material-symbols-outlined text-[20px] ${s.iconColor}`}>{s.icon}</span>
                </div>
                <div>
                  <div className="font-['Plus_Jakarta_Sans'] text-sm font-semibold text-[var(--c-text)]">{s.title}</div>
                  <div className="text-xs text-[var(--c-muted)]">
                    {s.date}{s.duration ? ` · ${s.duration}` : ""}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[var(--c-text)]">
                    {s.score !== null ? `${s.score}/100` : "--/--"}
                  </div>
                  <div className={`badge text-[9px] ${s.status === "Completed" ? "badge-teal" : s.status === "Scheduled" ? "badge-blue" : "badge-purple"}`}>
                    {s.status}
                  </div>
                </div>
                {s.status === "Completed" && (
                  <Link href="/dashboard/reports" className="text-[var(--c-muted)] hover:text-[var(--c-primary)] transition-colors">
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  </Link>
                )}
                {s.status !== "Completed" && (
                  <Link href="/dashboard/new" className="text-[var(--c-muted)] hover:text-[var(--c-primary)] transition-colors">
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
