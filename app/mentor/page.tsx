import Link from "next/link";
import React from "react";

export default function MentorLandingPage() {
  return (
    <div className="min-h-screen bg-[#0e1417] text-[#dde3e7] font-['Plus_Jakarta_Sans']">
      {/* Simple Header */}
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/" className="font-black text-xl text-[var(--c-primary)] tracking-tight no-underline">
          SAKSHAM.AI <span className="text-white font-normal text-sm ml-1">For Mentors</span>
        </Link>
        <div className="flex gap-6 items-center">
          <Link href="/login" className="text-sm font-bold hover:text-[var(--c-primary)] transition-colors no-underline">
            Mentor Login
          </Link>
          <Link href="/dashboard/mentor-register" className="btn-primary py-2 px-6 text-sm">
            Apply Now
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-6 text-center max-w-4xl mx-auto">
        <div className="badge badge-teal mb-6 px-4 py-1.5 text-[12px] font-bold tracking-[0.2em] uppercase mx-auto">Expert Program</div>
        <h1 className="text-5xl md:text-7xl font-black mb-8 leading-[1.1] tracking-tight text-white">
          Empower the next generation of <span className="text-[var(--c-primary)]">Tech Talent.</span>
        </h1>
        <p className="text-xl text-[var(--c-muted)] mb-12 max-w-2xl mx-auto leading-relaxed">
          Join India's most advanced AI-powered prep platform. Mentor students, conduct mock interviews, and grow your professional network.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard/mentor-register" className="btn-primary py-5 px-12 text-lg shadow-xl shadow-[var(--c-primary)]/20">
            Join the Expert Network
          </Link>
          <Link href="/login" className="btn-ghost py-5 px-12 text-lg border border-white/10">
            Access Dashboard
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white/5 border-y border-white/5 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--c-primary)]/10 flex items-center justify-center text-[var(--c-primary)] mb-6">
              <span className="material-symbols-outlined text-3xl">payments</span>
            </div>
            <h3 className="text-xl font-bold mb-3">Earn on your terms</h3>
            <p className="text-[var(--c-muted)]">Set your own hourly rates and availability. Get paid securely for every session you conduct.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--c-secondary)]/10 flex items-center justify-center text-[var(--c-secondary)] mb-6">
              <span className="material-symbols-outlined text-3xl">psychology</span>
            </div>
            <h3 className="text-xl font-bold mb-3">AI-Assisted Prep</h3>
            <p className="text-[var(--c-muted)]">Use our AI insights to help students prepare better. We provide the data, you provide the wisdom.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--c-tertiary)]/10 flex items-center justify-center text-[var(--c-tertiary)] mb-6">
              <span className="material-symbols-outlined text-3xl">groups</span>
            </div>
            <h3 className="text-xl font-bold mb-3">Professional Network</h3>
            <p className="text-[var(--c-muted)]">Connect with other industry leaders and top-tier talent from across the country.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 text-center border-t border-white/5">
        <p className="text-[var(--c-muted)] text-sm">© 2026 SAKSHAM.AI Mentor Program. All rights reserved.</p>
      </footer>
    </div>
  );
}
