import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Loader2 } from "lucide-react";

export const revalidate = 0;

export default async function LeaderboardPage() {
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

  // Fetch highest scores
  const { data: interviews, error } = await supabase
    .from("interviews")
    .select("score, user_id, profiles(full_name, avatar_url)")
    .order("score", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Leaderboard error:", error);
  }

  // Group by user to show max score per user
  const userScores = new Map();
  if (interviews) {
    interviews.forEach((interview: any) => {
      const uid = interview.user_id;
      if (!userScores.has(uid) || userScores.get(uid).score < interview.score) {
        userScores.set(uid, {
          name: interview.profiles?.full_name || "Anonymous Developer",
          avatar: interview.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
          score: interview.score,
        });
      }
    });
  }

  const topUsers = Array.from(userScores.values()).sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-[#0e1417] text-[#dde3e7] p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-['Plus_Jakarta_Sans'] text-4xl font-bold text-[#dde3e7] tracking-tight">
            Global Leaderboard
          </h1>
          <p className="text-[#bbc9cf] text-lg max-w-2xl">
            See how you rank against other candidates across technical interviews.
          </p>
        </div>

        <div className="bg-[#1a2123] rounded-2xl border border-[#242424] shadow-2xl overflow-hidden">
          <div className="bg-[#121212] px-8 py-5 border-b border-[#242424] flex items-center justify-between">
            <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#dde3e7] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00d1ff]">trophy</span>
              Top Performers
            </h2>
            <div className="px-3 py-1 bg-[#00d1ff]/10 text-[#00d1ff] text-xs font-bold rounded-full border border-[#00d1ff]/20">
              Updated Live
            </div>
          </div>

          <div className="divide-y divide-[#242424]">
            {topUsers.length === 0 ? (
              <div className="p-12 text-center text-[#859399]">
                No interview scores recorded yet. Be the first to take an interview!
              </div>
            ) : (
              topUsers.map((user, idx) => (
                <div key={idx} className="p-6 flex items-center gap-6 hover:bg-[#242b2e]/50 transition-colors">
                  <div className="flex items-center justify-center w-10 text-xl font-black font-['Plus_Jakarta_Sans'] text-[#859399]">
                    {idx === 0 ? (
                      <span className="text-[#ffd700] text-3xl drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">1</span>
                    ) : idx === 1 ? (
                      <span className="text-[#c0c0c0] text-2xl drop-shadow-[0_0_10px_rgba(192,192,192,0.5)]">2</span>
                    ) : idx === 2 ? (
                      <span className="text-[#cd7f32] text-xl drop-shadow-[0_0_10px_rgba(205,127,50,0.5)]">3</span>
                    ) : (
                      idx + 1
                    )}
                  </div>
                  
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#242b2e] border-2 border-[#3c494e] shrink-0 relative">
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-white">{user.name}</h3>
                    <p className="text-sm text-[#859399]">Software Engineer</p>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className="text-3xl font-black font-['Plus_Jakarta_Sans'] text-[#00d1ff]">
                      {user.score}
                    </div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-[#44e2cd]">
                      Peak Score
                    </div>
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
