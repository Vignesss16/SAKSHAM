"use client";
import Link from "next/link";

const metrics = [
  { label: "Content Quality", score: 88, color: "bg-[#00d1ff]", note: "Richness and relevance of technical answers provided." },
  { label: "Clarity", score: 75, color: "bg-[#00d1ff]", note: "How clearly and articulately you explained complex concepts." },
  { label: "Confidence", score: 92, color: "bg-[#03c6b2]", note: "Maintaining composure and pace throughout the session." },
  { label: "Technical Accuracy", score: 68, color: "bg-[#ffb4ab]", note: "Correctness of syntax and system architecture patterns." },
];

const strengths = [
  { title: "Deep React Expertise", desc: "Exceptional understanding of the Virtual DOM and reconciliation process." },
  { title: "System Architecture", desc: "Strong grasp of state management libraries like Redux and Zustand." },
  { title: "Problem Solving", desc: "Approached edge cases logically during the live coding section." },
];

const improvements = [
  { title: "Database Scaling", desc: "Struggled to articulate the difference between replication and sharding." },
  { title: "Security Best Practices", desc: "Forgot to mention CSRF protection when discussing API design." },
  { title: "Network Optimization", desc: "Could provide more detail on CDN invalidation strategies." },
];

export default function ReportsPage() {
  // SVG ring: circumference ≈ 283 for r=45. 82% → offset = 283*(1-0.82) ≈ 51
  return (
    <div className="min-h-screen bg-[#0e1417] text-[#dde3e7]">
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Hero bento */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Score gauge */}
          <div className="lg:col-span-4 bg-[#1A1A1A] border border-[#242424] rounded-xl p-10 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00d1ff]/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="relative w-48 h-48 mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 192 192">
                <circle cx="96" cy="96" r="80" fill="transparent" stroke="#242424" strokeWidth="12" />
                <circle
                  cx="96" cy="96" r="80" fill="transparent"
                  stroke="url(#grad)" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray="502" strokeDashoffset="90"
                />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00D1FF" />
                    <stop offset="100%" stopColor="#03C6B2" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-extrabold text-white">82</span>
                <span className="text-gray-500 font-bold">/100</span>
              </div>
            </div>
            <div className="bg-[#03c6b2]/20 text-[#44e2cd] border border-[#44e2cd]/30 px-4 py-1 rounded-full text-sm font-bold mb-4 uppercase tracking-widest">
              Strong Candidate
            </div>
            <p className="text-gray-400 text-sm max-w-[240px]">
              You are in the top 15% of candidates for Senior Frontend roles this month.
            </p>
          </div>

          {/* AI Summary */}
          <div className="lg:col-span-8 relative bg-[#1a1a1a] rounded-xl p-8 flex flex-col justify-between border border-[#00d1ff]/40">
            <div className="absolute inset-[-1px] rounded-xl bg-gradient-to-r from-[#00d1ff] to-[#03c6b2] -z-10 rounded-[13px]"></div>
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-[#242424] p-2 rounded-lg">
                  <span className="material-symbols-outlined text-[#00d1ff]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                </div>
                <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-semibold text-white">AI Comprehensive Review</h2>
              </div>
              <p className="text-[#bbc9cf] text-lg mb-6 leading-relaxed">
                You demonstrated deep knowledge of React hooks and performance optimization strategies, particularly around memoization and concurrent rendering. Your technical accuracy during the system design phase was impressive; however, you could improve on explaining horizontal scaling tradeoffs and database sharding more granularly. Overall, your communication was professional, and your confidence remained steady even under challenging technical questioning.
              </p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => window.print()} className="bg-[#00d1ff] text-[#001f28] px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all">
                <span className="material-symbols-outlined">download</span> Download PDF Report
              </button>
              <Link href="/dashboard/certificates" className="bg-transparent border border-[#44e2cd] text-[#44e2cd] px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-[#44e2cd]/10 active:scale-95 transition-all">
                <span className="material-symbols-outlined">workspace_premium</span> View Certificate
              </Link>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m) => (
            <div key={m.label} className="bg-[#1A1A1A] border border-[#242424] p-6 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400 font-bold uppercase text-xs tracking-wider">{m.label}</span>
                <span className="text-white font-bold">{m.score}/100</span>
              </div>
              <div className="w-full bg-[#242424] h-2 rounded-full mb-4">
                <div className={`${m.color} h-full rounded-full`} style={{ width: `${m.score}%` }}></div>
              </div>
              <p className="text-xs text-gray-500">{m.note}</p>
            </div>
          ))}
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="bg-[#1A1A1A] border border-[#242424] rounded-xl overflow-hidden">
            <div className="bg-[#03c6b2]/10 px-6 py-4 border-b border-[#242424]">
              <h3 className="flex items-center gap-2 text-[#44e2cd] font-bold">
                <span className="material-symbols-outlined">trending_up</span> Key Strengths
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {strengths.map((s) => (
                <div key={s.title} className="flex gap-4">
                  <span className="material-symbols-outlined text-[#44e2cd] shrink-0">check_circle</span>
                  <div>
                    <p className="text-white font-bold">{s.title}</p>
                    <p className="text-sm text-gray-400">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Improvements */}
          <div className="bg-[#1A1A1A] border border-[#242424] rounded-xl overflow-hidden">
            <div className="bg-[#ffb4ab]/10 px-6 py-4 border-b border-[#242424]">
              <h3 className="flex items-center gap-2 text-[#ffb4ab] font-bold">
                <span className="material-symbols-outlined">warning</span> Areas of Improvement
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {improvements.map((i) => (
                <div key={i.title} className="flex gap-4">
                  <span className="material-symbols-outlined text-[#ffb4ab] shrink-0">cancel</span>
                  <div>
                    <p className="text-white font-bold">{i.title}</p>
                    <p className="text-sm text-gray-400">{i.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="flex flex-col items-center gap-4 w-full py-12 border-t border-[#242424] bg-[#121212] text-xs mt-8">
        <div className="font-bold text-[#00D1FF]">PrepAI</div>
        <div className="flex gap-6 text-gray-600">
          <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-gray-300 transition-colors">Contact</a>
        </div>
        <p className="text-gray-500">© 2024 PrepAI. Professional Excellence.</p>
      </footer>
    </div>
  );
}
