import Link from "next/link";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const revalidate = 0;

export default async function InterviewsPage() {
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
  
  let interviews: any[] = [];
  let certificatesCount = 0;

  if (user) {
    const { data } = await supabase
      .from('interviews')
      .select('id, title, score, created_at, status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    interviews = data || [];

    const { count } = await supabase
      .from('certificates')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
      
    certificatesCount = count || 0;
  }

  const completedInterviews = interviews.filter(i => i.score !== null);
  const totalSessions = interviews.length;
  const avgScore = completedInterviews.length > 0 
    ? Math.round(completedInterviews.reduce((acc, curr) => acc + (curr.score || 0), 0) / completedInterviews.length)
    : 0;
  
  // Estimate 45 mins per session
  const hoursPracticed = (totalSessions * 45 / 60).toFixed(1);

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
          { label: "Total Sessions", value: totalSessions.toString(), icon: "history_edu", color: "var(--c-primary)" },
          { label: "Avg. Score", value: avgScore.toString(), icon: "analytics", color: "var(--c-secondary)" },
          { label: "Hours Practiced", value: hoursPracticed, icon: "schedule", color: "var(--c-tertiary)" },
          { label: "Certificates", value: certificatesCount.toString(), icon: "workspace_premium", color: "var(--c-primary)" },
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
          {interviews.length === 0 ? (
            <div className="p-8 text-center text-[var(--c-muted)]">
              No sessions found. Start a new interview to see your history!
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--c-border)]">
                  <th className="p-4 text-[13px] font-semibold text-[var(--c-muted)] uppercase tracking-wider">Role / Topic</th>
                  <th className="p-4 text-[13px] font-semibold text-[var(--c-muted)] uppercase tracking-wider hidden sm:table-cell">Date</th>
                  <th className="p-4 text-[13px] font-semibold text-[var(--c-muted)] uppercase tracking-wider">Score</th>
                  <th className="p-4 text-[13px] font-semibold text-[var(--c-muted)] uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--c-border)]">
                {interviews.map((session) => (
                  <tr key={session.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--c-bg)] border border-[var(--c-border)] flex items-center justify-center">
                          <span className="material-symbols-outlined text-[var(--c-primary)]">psychology</span>
                        </div>
                        <div>
                          <div className="font-semibold text-[var(--c-text)] text-[15px]">{session.title || 'Mock Interview'}</div>
                          <div className="text-[13px] text-[var(--c-muted)] sm:hidden mt-0.5">
                            {new Date(session.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-[14px] text-[var(--c-muted)] hidden sm:table-cell">
                      {new Date(session.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      {session.score !== null ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[rgba(68,226,205,0.1)] text-[var(--c-secondary)] font-bold text-[13px]">
                          {session.score} / 100
                        </div>
                      ) : (
                        <span className="text-[13px] text-[var(--c-muted)] italic">Pending</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {session.score !== null ? (
                        <Link href={`/dashboard/reports?id=${session.id}`} className="text-[13px] font-semibold text-[var(--c-primary)] hover:underline">
                          View Report
                        </Link>
                      ) : (
                        <span className="text-[13px] text-[var(--c-muted)]">Incomplete</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
