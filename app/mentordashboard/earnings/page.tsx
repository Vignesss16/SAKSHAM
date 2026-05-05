import Link from "next/link";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export default async function MentorEarningsPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { data: bookings } = user
    ? await supabase
        .from("mentor_bookings")
        .select("id, scheduled_at, status, payment_amount, commission_amount")
        .eq("mentor_id", user.id)
        .order("scheduled_at", { ascending: false })
    : { data: [] };

  const completedBookings = (bookings || []).filter(b => b.status === "completed");
  const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.payment_amount || 0), 0);
  const totalCommission = completedBookings.reduce((sum, b) => sum + (b.commission_amount || 0), 0);
  const netEarnings = totalEarnings - totalCommission;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-black tracking-tight text-[var(--c-text)] m-0 mb-2">
          Earnings & Reports
        </h1>
        <p className="text-[var(--c-muted)] text-[15px] m-0">
          Track your income from mentorship sessions.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="stat-card" style={{ borderTopColor: "var(--c-primary)" }}>
          <span className="text-[11px] text-muted font-semibold uppercase tracking-wider block mb-1">Total Earned</span>
          <span className="font-heading text-[40px] font-black text-[var(--c-text)]">₹{totalEarnings.toLocaleString()}</span>
        </div>
        <div className="stat-card" style={{ borderTopColor: "var(--c-secondary)" }}>
          <span className="text-[11px] text-muted font-semibold uppercase tracking-wider block mb-1">Platform Fee</span>
          <span className="font-heading text-[40px] font-black text-[var(--c-text)]">₹{totalCommission.toLocaleString()}</span>
        </div>
        <div className="stat-card" style={{ borderTopColor: "var(--c-tertiary)" }}>
          <span className="text-[11px] text-muted font-semibold uppercase tracking-wider block mb-1">Net Payout</span>
          <span className="font-heading text-[40px] font-black text-[var(--c-text)]">₹{netEarnings.toLocaleString()}</span>
        </div>
      </div>

      {/* Transaction History */}
      <div className="glass overflow-hidden rounded-2xl">
        <div className="px-6 py-4 border-b border-[var(--c-border)]">
          <h3 className="font-bold text-lg m-0">Transaction History</h3>
        </div>
        {completedBookings.length === 0 ? (
          <div className="p-16 text-center">
            <span className="material-symbols-outlined text-5xl text-[var(--c-primary)] mb-4 block">payments</span>
            <h3 className="text-xl font-bold mb-2">No Earnings Yet</h3>
            <p className="text-muted mb-8">Complete your first session to start earning.</p>
            <Link href="/mentordashboard/sessions" className="btn-primary py-3 px-8">View Sessions</Link>
          </div>
        ) : (
          <div className="divide-y divide-[var(--c-border)]">
            {completedBookings.map((b) => (
              <div key={b.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[var(--c-text)]">Session Completed</div>
                  <div className="text-sm text-muted">
                    {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(b.scheduled_at))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[var(--c-primary)]">+₹{(b.payment_amount - b.commission_amount).toLocaleString()}</div>
                  <div className="text-xs text-muted">After ₹{b.commission_amount} fee</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 glass p-6 border border-[var(--c-primary)]/20 text-sm text-muted">
        <span className="material-symbols-outlined text-[var(--c-primary)] mr-2 align-middle">info</span>
        Payouts are processed weekly. Payment gateway integration coming soon.
      </div>
    </div>
  );
}
