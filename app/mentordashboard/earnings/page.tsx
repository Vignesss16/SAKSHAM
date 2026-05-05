import Link from "next/link";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function MentorEarningsPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: bookings } = await supabase
    .from("mentor_bookings")
    .select("id, scheduled_at, status, payment_amount, commission_amount, student:student_id(full_name)")
    .eq("mentor_id", user.id)
    .order("scheduled_at", { ascending: false });

  const completedBookings = (bookings || []).filter(b => b.status === "completed");
  const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.payment_amount || 0), 0);
  const totalCommission = completedBookings.reduce((sum, b) => sum + (b.commission_amount || 0), 0);
  const netEarnings = totalEarnings - totalCommission;
  
  // Pending earnings (confirmed but not yet completed)
  const pendingBookings = (bookings || []).filter(b => b.status === "confirmed");
  const pendingAmount = pendingBookings.reduce((sum, b) => sum + (b.payment_amount || 0), 0);

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="font-heading text-[clamp(28px,4vw,40px)] font-black tracking-tight text-white m-0 mb-2 leading-none">
            Earnings & Revenue
          </h1>
          <p className="text-[var(--c-muted)] text-base m-0 max-w-md">
            Track your mentorship income, platform fees, and upcoming payouts.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="bg-[#1a1a1a] border border-[var(--c-border)] rounded-2xl px-5 py-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#64dc64] animate-pulse"></div>
            <span className="text-xs font-bold uppercase tracking-widest text-white/60">Live Updates</span>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <div className="stat-card group relative overflow-hidden" style={{ borderTopColor: "var(--c-primary)" }}>
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--c-primary)]/10 rounded-full blur-2xl group-hover:bg-[var(--c-primary)]/20 transition-colors"></div>
          <span className="text-[11px] text-muted font-black uppercase tracking-[0.15em] block mb-3 opacity-60">Total Revenue</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-white">₹</span>
            <span className="font-heading text-[44px] font-black text-white tracking-tighter">{totalEarnings.toLocaleString()}</span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[11px] text-[#64dc64] font-bold">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            Gross earnings
          </div>
        </div>

        <div className="stat-card group relative overflow-hidden" style={{ borderTopColor: "var(--c-secondary)" }}>
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--c-secondary)]/10 rounded-full blur-2xl group-hover:bg-[var(--c-secondary)]/20 transition-colors"></div>
          <span className="text-[11px] text-muted font-black uppercase tracking-[0.15em] block mb-3 opacity-60">Net Payout</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-[var(--c-primary)]">₹</span>
            <span className="font-heading text-[44px] font-black text-white tracking-tighter">{netEarnings.toLocaleString()}</span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[11px] text-muted font-bold">
            After platform fee
          </div>
        </div>

        <div className="stat-card group relative overflow-hidden" style={{ borderTopColor: "var(--c-tertiary)" }}>
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--c-tertiary)]/10 rounded-full blur-2xl group-hover:bg-[var(--c-tertiary)]/20 transition-colors"></div>
          <span className="text-[11px] text-muted font-black uppercase tracking-[0.15em] block mb-3 opacity-60">Upcoming</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-[var(--c-tertiary)]">₹</span>
            <span className="font-heading text-[44px] font-black text-white tracking-tighter">{pendingAmount.toLocaleString()}</span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[11px] text-amber-400 font-bold">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            {pendingBookings.length} pending sessions
          </div>
        </div>

        <div className="stat-card group relative overflow-hidden" style={{ borderTopColor: "#fff" }}>
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>
          <span className="text-[11px] text-muted font-black uppercase tracking-[0.15em] block mb-3 opacity-60">Completed</span>
          <div className="flex items-baseline gap-1">
            <span className="font-heading text-[44px] font-black text-white tracking-tighter">{completedBookings.length}</span>
            <span className="text-lg font-bold text-muted">Sessions</span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[11px] text-muted font-bold">
            Total success count
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        {/* Transaction History */}
        <div className="glass rounded-[24px] overflow-hidden border border-[var(--c-border)] shadow-2xl">
          <div className="px-8 py-6 border-b border-[var(--c-border)] flex items-center justify-between bg-white/[0.02]">
            <h3 className="font-bold text-xl m-0 flex items-center gap-3">
              <span className="material-symbols-outlined text-[var(--c-primary)]">history</span>
              Transaction History
            </h3>
            <div className="text-[11px] font-black uppercase tracking-widest text-muted">Last 30 Days</div>
          </div>
          
          {completedBookings.length === 0 ? (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-[var(--c-primary)]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl text-[var(--c-primary)]">payments</span>
              </div>
              <h3 className="text-2xl font-black mb-3">Your Wallet is Empty</h3>
              <p className="text-muted mb-8 max-w-sm mx-auto">Complete your first mentorship session to unlock your earnings dashboard.</p>
              <Link href="/mentordashboard/sessions" className="btn-primary py-4 px-10 text-sm shadow-xl shadow-[var(--c-primary)]/20">
                Manage Sessions
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--c-border)]">
              {completedBookings.map((b) => (
                <div key={b.id} className="px-8 py-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#1a1a1a] border border-[var(--c-border)] flex items-center justify-center text-[var(--c-primary)] group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined">check_circle</span>
                    </div>
                    <div>
                      <div className="font-bold text-white text-base mb-1">Session with {(b.student as any)?.full_name}</div>
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(b.scheduled_at))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-xl text-[var(--c-primary)] leading-none mb-1">+₹{(b.payment_amount - b.commission_amount).toLocaleString()}</div>
                    <div className="text-[10px] text-muted font-bold uppercase tracking-tighter">Net Credit</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="ai-border p-8 bg-gradient-to-br from-[var(--c-primary)]/10 to-transparent border-[var(--c-primary)]/20 rounded-[24px]">
            <div className="w-12 h-12 bg-[var(--c-primary)]/20 rounded-2xl flex items-center justify-center text-[var(--c-primary)] mb-6">
              <span className="material-symbols-outlined">payout</span>
            </div>
            <h4 className="text-xl font-bold mb-3">Payout Schedule</h4>
            <p className="text-sm text-[var(--c-muted)] leading-relaxed mb-6">
              Earnings are automatically processed and sent to your registered bank account every <span className="text-white font-bold">Friday</span>.
            </p>
            <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-muted font-bold">Platform Fee</span>
                <span className="text-white font-black">10%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted font-bold">GST</span>
                <span className="text-white font-black">Included</span>
              </div>
              <div className="w-full h-[1px] bg-white/5"></div>
              <div className="flex justify-between text-xs">
                <span className="text-white font-black">Next Payout</span>
                <span className="text-[var(--c-primary)] font-black">May 8, 2026</span>
              </div>
            </div>
          </div>

          <div className="glass p-8 rounded-[24px] border border-[var(--c-border)]">
            <h4 className="text-lg font-bold mb-4">Security Notice</h4>
            <p className="text-xs text-muted leading-loose m-0">
              Your financial security is our priority. All transactions are encrypted and processed via secure payment gateways. If you notice any discrepancy, contact support immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
