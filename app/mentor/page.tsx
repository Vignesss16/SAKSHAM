import Link from "next/link";
import React from "react";

export default function MentorLandingPage() {
  return (
    <div className="min-h-screen bg-[#0e1417] text-[#dde3e7] font-['Plus_Jakarta_Sans']">
      {/* ── MENTOR NAV ── */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-[#0e1417]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group no-underline">
            <div className="w-8 h-8 rounded-lg bg-[var(--c-primary)] flex items-center justify-center shadow-lg shadow-[var(--c-primary)]/20">
              <span className="material-symbols-outlined text-[#001f28] text-[20px] font-bold">school</span>
            </div>
            <span className="font-black text-lg text-[var(--c-text)] tracking-tight">
              SAKSHAM.AI <span className="text-[var(--c-primary)] font-medium text-xs ml-1 px-2 py-0.5 bg-[var(--c-primary)]/10 rounded-full">FOR MENTORS</span>
            </span>
          </Link>
          
          <div className="hidden md:flex gap-8 items-center">
            <a href="#benefits" className="text-sm font-semibold text-[var(--c-muted)] hover:text-white transition-colors no-underline">Benefits</a>
            <a href="#how-it-works" className="text-sm font-semibold text-[var(--c-muted)] hover:text-white transition-colors no-underline">Process</a>
            <Link href="/login?role=mentor&redirect=/dashboard" className="text-sm font-bold text-[var(--c-primary)] hover:underline no-underline">
              Mentor Login
            </Link>
            <Link href="/dashboard/mentor-register" className="btn-primary py-2 px-6 text-sm shadow-lg shadow-[var(--c-primary)]/10">
              Apply to Join
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="relative pt-40 pb-24 px-6 overflow-hidden">
        {/* Background visual */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--c-primary)]/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-[var(--c-secondary)]/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-[var(--c-primary)] animate-pulse"></span>
            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/80">India's Leading AI Prep Network</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[0.95] tracking-tight text-white">
            Your expertise. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--c-primary)] to-[var(--c-secondary)]">Their future.</span>
          </h1>
          
          <p className="text-xl text-[var(--c-muted)] mb-12 max-w-2xl mx-auto leading-relaxed">
            Join 200+ industry leaders from Google, Amazon, and Meta. Conduct mock interviews, provide 1-on-1 guidance, and help candidates land their dream jobs.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <Link href="/dashboard/mentor-register" className="btn-primary py-5 px-12 text-lg shadow-2xl shadow-[var(--c-primary)]/20 hover:-translate-y-1 transition-transform">
              Join the Expert Network
              <span className="material-symbols-outlined ml-2">rocket_launch</span>
            </Link>
            <Link href="/login?role=mentor&redirect=/dashboard" className="group flex items-center gap-3 text-white font-bold text-lg no-underline hover:text-[var(--c-primary)] transition-colors">
              Access Dashboard
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[var(--c-primary)] group-hover:text-[#001f28] transition-all">
                <span className="material-symbols-outlined">arrow_forward</span>
              </div>
            </Link>
          </div>

          {/* Social Proof */}
          <div className="mt-20 pt-10 border-t border-white/5">
            <p className="text-xs font-bold text-white/30 uppercase tracking-[0.3em] mb-8">Mentors joining from</p>
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-8 opacity-40 grayscale">
              <span className="text-2xl font-black">Google</span>
              <span className="text-2xl font-black">Amazon</span>
              <span className="text-2xl font-black">Microsoft</span>
              <span className="text-2xl font-black">Meta</span>
              <span className="text-2xl font-black">Netflix</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENEFITS SECTION ── */}
      <section id="benefits" className="py-32 px-6 bg-[#11181b]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-white mb-4">Why Mentor on SAKSHAM.AI?</h2>
            <p className="text-[var(--c-muted)] max-w-xl mx-auto">We provide the platform, the AI tools, and the candidates. You provide the impact.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass p-10 flex flex-col items-start hover:border-[var(--c-primary)]/30 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-[var(--c-primary)]/10 flex items-center justify-center text-[var(--c-primary)] mb-8">
                <span className="material-symbols-outlined text-3xl">payments</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Monetize Expertise</h3>
              <p className="text-[var(--c-muted)] leading-relaxed">Set your own hourly rates (avg. $50-$150/hr). Get paid for every consultation and mock interview you conduct.</p>
            </div>
            
            <div className="glass p-10 flex flex-col items-start hover:border-[var(--c-secondary)]/30 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-[var(--c-secondary)]/10 flex items-center justify-center text-[var(--c-secondary)] mb-8">
                <span className="material-symbols-outlined text-3xl">schedule</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Total Flexibility</h3>
              <p className="text-[var(--c-muted)] leading-relaxed">You control your calendar. Accept bookings that fit your schedule, from 1 hour a week to full-time coaching.</p>
            </div>
            
            <div className="glass p-10 flex flex-col items-start hover:border-[var(--c-tertiary)]/30 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-[var(--c-tertiary)]/10 flex items-center justify-center text-[var(--c-tertiary)] mb-8">
                <span className="material-symbols-outlined text-3xl">auto_awesome</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">AI-Powered Insights</h3>
              <p className="text-[var(--c-muted)] leading-relaxed">Leverage our AI evaluation engine to get pre-session data on your student's performance, making your calls more effective.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FOOTER ── */}
      <section className="py-32 px-6 text-center border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--c-primary)]/5 blur-[120px] rounded-full translate-y-1/2"></div>
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-5xl font-black text-white mb-6">Ready to shape careers?</h2>
          <p className="text-xl text-[var(--c-muted)] mb-10">It takes less than 2 minutes to apply for the SAKSHAM.AI Expert Program.</p>
          <Link href="/dashboard/mentor-register" className="btn-primary py-5 px-16 text-xl shadow-2xl shadow-[var(--c-primary)]/20">
            Apply Now
          </Link>
        </div>
      </section>

      <footer className="py-12 px-6 text-center border-t border-white/5">
        <div className="flex justify-center gap-8 mb-6">
          <a href="#" className="text-[var(--c-muted)] hover:text-white transition-colors no-underline text-sm font-medium">Privacy Policy</a>
          <a href="#" className="text-[var(--c-muted)] hover:text-white transition-colors no-underline text-sm font-medium">Terms of Use</a>
          <a href="#" className="text-[var(--c-muted)] hover:text-white transition-colors no-underline text-sm font-medium">Contact Support</a>
        </div>
        <p className="text-[var(--c-muted)]/50 text-xs">© 2026 SAKSHAM.AI Mentor Program. Built for the future of tech education.</p>
      </footer>
    </div>
  );
}
