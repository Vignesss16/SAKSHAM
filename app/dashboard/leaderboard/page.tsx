import { createClient } from "@supabase/supabase-js";

export const revalidate = 0;

export default async function LeaderboardPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("credits, full_name, avatar_url, id")
    .order("credits", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Leaderboard error:", error);
  }

  const topUsers = (profiles || []).filter(p => (p.credits || 0) > 0);

  const rankEmojis: Record<number, string> = { 0: "🥇", 1: "🥈", 2: "🥉" };

  return (
    <div className="min-h-screen bg-[#0e1417] text-[#dde3e7] p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-['Plus_Jakarta_Sans'] text-4xl font-bold text-[#dde3e7] tracking-tight">
            Global Leaderboard
          </h1>
          <p className="text-[#bbc9cf] text-lg max-w-2xl">
            See how you rank against other candidates — earn more credits by completing AI interviews and daily challenges.
          </p>
        </div>

        {/* Credits Evaluation System Breakdown */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-8">
          <div className="glass p-5 rounded-2xl border-l-4 border-l-[#10b981] flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#10b981]">workspace_premium</span>
              <span className="text-[#10b981] font-bold text-sm uppercase tracking-wider">Elite Score (80+)</span>
            </div>
            <p className="text-[#bbc9cf] text-xs leading-relaxed mb-4">Complete an AI Interview with an exceptional score.</p>
            <div className="text-2xl font-black text-white">+2500 <span className="text-sm font-normal text-gray-500">credits</span></div>
          </div>
          
          <div className="glass p-5 rounded-2xl border-l-4 border-l-[#0ea5e9] flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#0ea5e9]">thumb_up</span>
              <span className="text-[#0ea5e9] font-bold text-sm uppercase tracking-wider">Advanced (60-79)</span>
            </div>
            <p className="text-[#bbc9cf] text-xs leading-relaxed mb-4">Complete an AI Interview with a proficient score.</p>
            <div className="text-2xl font-black text-white">+1000 <span className="text-sm font-normal text-gray-500">credits</span></div>
          </div>

          <div className="glass p-5 rounded-2xl border-l-4 border-l-[#00d1ff] flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#00d1ff]">task_alt</span>
              <span className="text-[#00d1ff] font-bold text-sm uppercase tracking-wider">Daily Challenge</span>
            </div>
            <p className="text-[#bbc9cf] text-xs leading-relaxed mb-4">Solve the daily DSA question without failing anti-cheat.</p>
            <div className="text-2xl font-black text-white">+1000 <span className="text-sm font-normal text-gray-500">credits</span></div>
          </div>

          <div className="glass p-5 rounded-2xl border-l-4 border-l-[#f43f5e] flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#f43f5e]">model_training</span>
              <span className="text-[#f43f5e] font-bold text-sm uppercase tracking-wider">Base Score (&lt;60)</span>
            </div>
            <p className="text-[#bbc9cf] text-xs leading-relaxed mb-4">Complete an AI Interview and identify areas for focus.</p>
            <div className="text-2xl font-black text-white">+500 <span className="text-sm font-normal text-gray-500">credits</span></div>
          </div>
        </div>

        <div className="bg-[#1a2123] rounded-2xl border border-[#242424] shadow-2xl overflow-hidden">
          <div className="bg-[#121212] px-8 py-5 border-b border-[#242424] flex items-center justify-between">
            <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#dde3e7] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00d1ff]">stars</span>
              Top Credit Earners
            </h2>
            <div className="px-3 py-1 bg-[#00d1ff]/10 text-[#00d1ff] text-xs font-bold rounded-full border border-[#00d1ff]/20">
              Updated Live
            </div>
          </div>

          <div className="divide-y divide-[#242424]">
            {topUsers.length === 0 ? (
              <div className="p-12 text-center text-[#859399]">
                No credits earned yet. Complete an interview to appear here!
              </div>
            ) : (
              topUsers.map((user, idx) => (
                <div key={user.id} className="p-6 flex items-center gap-6 hover:bg-[#242b2e]/50 transition-colors">
                  <div className="flex items-center justify-center w-10 text-xl font-black font-['Plus_Jakarta_Sans'] text-[#859399]">
                    {rankEmojis[idx] || `#${idx + 1}`}
                  </div>
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name || "User"} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#00d1ff] to-[#03c6b2] flex items-center justify-center font-bold text-[#001f28] text-lg uppercase">
                        {(user.full_name || "?").charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-['Plus_Jakarta_Sans'] font-bold text-[#dde3e7]">
                      {user.full_name || "Anonymous Developer"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[#00d1ff] font-bold text-lg">
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                    {(user.credits || 0).toLocaleString()} credits
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
