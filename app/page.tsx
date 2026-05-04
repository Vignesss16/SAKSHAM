'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <div className="min-h-screen text-[var(--c-text)]" style={{ background: 'var(--c-bg)', fontFamily: 'Inter, sans-serif' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 50,
        background: 'rgba(14,20,23,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--c-border)'
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 20, color: 'var(--c-primary)', letterSpacing: '-0.02em' }}>SAKSHAM.AI</div>
            <div style={{ display: 'flex', gap: 28 }} className="hidden md:flex">
              {['Features', 'Pricing', 'About'].map(item => (
                <a key={item} href="#" style={{ color: 'var(--c-muted)', textDecoration: 'none', fontSize: 14, fontFamily: "'Plus Jakarta Sans'", fontWeight: 500, transition: 'color 0.2s' }}
                  onMouseOver={e => (e.currentTarget.style.color = 'var(--c-primary)')}
                  onMouseOut={e => (e.currentTarget.style.color = 'var(--c-muted)')}
                >{item}</a>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/login" style={{ color: 'var(--c-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans'", fontSize: 14, fontWeight: 500, padding: '8px 12px', transition: 'color 0.2s', textDecoration: 'none' }}
              onMouseOver={e => (e.currentTarget.style.color = 'var(--c-text)')}
              onMouseOut={e => (e.currentTarget.style.color = 'var(--c-muted)')}
            >Login</Link>
            <Link href="/login" className="btn-primary" style={{ fontSize: 14, padding: '10px 22px' }}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        paddingTop: 120, paddingBottom: 100,
        background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,209,255,0.15) 0%, transparent 60%)',
        backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,209,255,0.15) 0%, transparent 60%),
          linear-gradient(rgba(0,209,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,209,255,0.03) 1px, transparent 1px)`,
        backgroundSize: 'auto, 40px 40px, 40px 40px'
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>

          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div className={`badge badge-teal fade-up delay-1`} style={{ width: 'fit-content' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>bolt</span>
              New: AI Coding Interviews are here
            </div>

            <h1 className="fade-up delay-2" style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: 'clamp(40px,5vw,64px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', margin: 0 }}>
              Master Your Next<br />
              <span style={{ color: 'var(--c-primary)', textShadow: '0 0 20px rgba(0,209,255,0.5)' }}>Big Interview</span><br />
              with AI
            </h1>

            <p className="fade-up delay-3" style={{ fontSize: 18, color: 'var(--c-muted)', lineHeight: 1.7, maxWidth: 480, margin: 0 }}>
              Practice real job interviews with expert AI feedback and verifiable certificates. Don&apos;t leave your career to chance.
            </p>

            <div className="fade-up delay-4" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link href="/login" className="btn-primary" style={{ fontSize: 15, padding: '14px 28px' }}>
                Start Your First Mock Interview
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              </Link>
              <button className="btn-ghost" style={{ fontSize: 15, padding: '14px 24px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>play_circle</span>
                Watch Demo
              </button>
            </div>

            <div className="fade-up delay-5" style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
              <div style={{ display: 'flex' }}>
                {[1, 2, 3].map((seed, i) => (
                  <div key={seed} style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#00d1ff,#44e2cd)', border: '2px solid var(--c-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#001f28', fontSize: 13, marginLeft: i > 0 ? -12 : 0 }}>
                    {['A', 'R', 'S'][i]}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 14, color: 'var(--c-muted)' }}>
                <span style={{ color: 'var(--c-text)', fontWeight: 700 }}>12,000+</span> students placed recently
              </div>
            </div>
          </div>

          {/* Right: AI card visual */}
          <div className="fade-up delay-3" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -40, background: 'radial-gradient(ellipse,rgba(0,209,255,0.15) 0%,transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
            <div className="ai-border glow-blue" style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, minHeight: 380, justifyContent: 'center' }}>
              {/* Waveform */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, height: 80 }}>
                {[24, 48, 36, 64, 56, 72, 48, 80, 56, 64, 40, 32].map((h, i) => (
                  <div key={i} className="wave-bar" style={{ height: h }}></div>
                ))}
              </div>

              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: 20, fontWeight: 700, color: 'var(--c-text)', margin: '0 0 8px' }}>AI Listening...</p>
                <p style={{ color: 'var(--c-muted)', fontSize: 14, maxWidth: 280, lineHeight: 1.5, margin: 0 }}>&quot;Tell me about a difficult technical challenge you solved.&quot;</p>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 20px', background: 'var(--c-bg3)', borderRadius: 99, fontSize: 12, color: 'var(--c-muted)' }}>
                <span style={{ width: 8, height: 8, background: '#ff6b6b', borderRadius: '50%', animation: 'blink 1s ease-in-out infinite', display: 'inline-block' }}></span>
                AI is analyzing tone &amp; vocabulary
              </div>

              {/* Score preview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, width: '100%' }}>
                <div style={{ textAlign: 'center', padding: 10, background: 'rgba(0,209,255,0.05)', borderRadius: 10, border: '1px solid rgba(0,209,255,0.1)' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--c-primary)' }}>88%</div>
                  <div style={{ fontSize: 10, color: 'var(--c-muted)', marginTop: 2 }}>Clarity</div>
                </div>
                <div style={{ textAlign: 'center', padding: 10, background: 'rgba(68,226,205,0.05)', borderRadius: 10, border: '1px solid rgba(68,226,205,0.1)' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--c-secondary)' }}>92%</div>
                  <div style={{ fontSize: 10, color: 'var(--c-muted)', marginTop: 2 }}>Confidence</div>
                </div>
                <div style={{ textAlign: 'center', padding: 10, background: 'rgba(236,211,255,0.05)', borderRadius: 10, border: '1px solid rgba(236,211,255,0.1)' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--c-tertiary)' }}>85%</div>
                  <div style={{ fontSize: 10, color: 'var(--c-muted)', marginTop: 2 }}>Relevance</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div style={{ background: 'rgba(0,209,255,0.04)', borderTop: '1px solid var(--c-border)', borderBottom: '1px solid var(--c-border)', padding: '14px 0', overflow: 'hidden' }}>
        <div style={{ animation: 'ticker 20s linear infinite', display: 'flex', gap: 48, whiteSpace: 'nowrap' }}>
          {[1, 2].map(i => (
            <span key={i} style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: 13, fontWeight: 600, color: 'var(--c-muted)', flexShrink: 0 }}>
              ✦ Google ✦ Amazon ✦ Microsoft ✦ Meta ✦ Apple ✦ Netflix ✦ Stripe ✦ Airbnb ✦ McKinsey ✦ Goldman Sachs ✦ Deloitte ✦ Accenture ✦ Uber ✦ LinkedIn ✦ Salesforce ✦ Oracle&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section style={{ padding: '100px 32px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.02em' }}>Precision Tools for Modern Hires</h2>
          <p style={{ color: 'var(--c-muted)', fontSize: 17, maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>Our AI engine analyzes your performance across hundreds of data points to give you the competitive edge.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20 }}>
          {[
            { icon: 'description', color: 'var(--c-primary)', bg: 'rgba(0,209,255,0.1)', title: 'Resume-based Questions', desc: 'AI scans your CV to generate hyper-relevant behavioral and technical prompts tailored to your experience.' },
            { icon: 'mic', color: 'var(--c-secondary)', bg: 'rgba(68,226,205,0.1)', title: 'Voice Interview', desc: 'Natural language processing enables seamless voice-to-voice mock interview sessions with real-time feedback.' },
            { icon: 'insights', color: 'var(--c-tertiary)', bg: 'rgba(236,211,255,0.1)', title: 'Detailed Feedback', desc: 'Granular breakdown of tone, vocabulary, confidence, accuracy, and more — all within seconds of finishing.' },
            { icon: 'verified', color: 'var(--c-primary)', bg: 'rgba(0,209,255,0.1)', title: 'Verifiable Certificate', desc: 'Prove your interview readiness to top recruiters with blockchain-verified digital badges on LinkedIn.' },
          ].map((f, i) => (
            <div key={i} className="glass" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16, transition: 'transform 0.2s,border-color 0.2s', cursor: 'default' }}
              onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-6px)')}
              onMouseOut={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <div style={{ width: 48, height: 48, background: f.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color }}>
                <span className="material-symbols-outlined">{f.icon}</span>
              </div>
              <h3 style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--c-text)' }}>{f.title}</h3>
              <p style={{ color: 'var(--c-muted)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '80px 32px', background: '#161d1f', borderTop: '1px solid var(--c-border)', borderBottom: '1px solid var(--c-border)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, textAlign: 'center', margin: '0 0 64px', letterSpacing: '-0.02em' }}>Your Path to Career Mastery</h2>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 24, width: '100%', maxWidth: 900, position: 'relative' }}>
              {[
                { icon: 'upload_file', label: 'Upload Resume', sub: 'Personalize your session instantly.', c: 'var(--c-primary)', active: true },
                { icon: 'work', label: 'Choose Role', sub: '500+ specialized career paths.', c: 'var(--c-border)', active: false },
                { icon: 'record_voice_over', label: 'Voice Interview', sub: 'Talk naturally with our AI.', c: 'var(--c-border)', active: false },
                { icon: 'analytics', label: 'Get Feedback', sub: 'Actionable AI insights in seconds.', c: 'var(--c-border)', active: false },
                { icon: 'workspace_premium', label: 'Get Certificate', sub: 'Share your achievement.', c: 'var(--c-secondary)', active: true },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12 }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: s.active ? (i === 4 ? 'rgba(68,226,205,0.1)' : 'rgba(0,209,255,0.1)') : 'rgba(255,255,255,0.03)', border: `2px solid ${s.c}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.active ? s.c : 'var(--c-text)', boxShadow: s.active ? `0 0 24px ${s.c}66` : 'none' }}>
                    <span className="material-symbols-outlined">{s.icon}</span>
                  </div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 700, fontSize: 14 }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: '100px 32px', maxWidth: 1280, margin: '0 auto' }}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: 'clamp(28px,4vw,36px)', fontWeight: 800, margin: '0 0 48px', letterSpacing: '-0.02em' }}>Results from the community</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
          {[
            { quote: `"MockAI Pro's detailed feedback on my 'Tell me about yourself' answer changed my entire approach. I secured an SDE-1 role at Google just 3 weeks later!"`, name: 'Ananya Sharma', role: 'IIT Bombay · Google Placement', avatar: 'A', avatarBg: 'linear-gradient(135deg,#00d1ff,#44e2cd)', avatarColor: '#001f28', borderColor: 'var(--c-primary)', nameColor: 'var(--c-primary)' },
            { quote: `"The voice interview mode is so realistic. It helped me overcome my stammering and build the confidence I needed for my final rounds at Amazon."`, name: 'Rahul Mehta', role: 'SRM University · Amazon Placement', avatar: 'R', avatarBg: 'linear-gradient(135deg,#44e2cd,#a4e6ff)', avatarColor: '#001f28', borderColor: 'var(--c-secondary)', nameColor: 'var(--c-secondary)' },
            { quote: `"Having a verifiable certificate on my LinkedIn profile actually got recruiters reaching out to me. The ROI on this platform is incredible."`, name: 'Sara Jenkins', role: 'Stanford University · McKinsey', avatar: 'S', avatarBg: 'linear-gradient(135deg,#ecd3ff,#d9afff)', avatarColor: '#2c0051', borderColor: 'var(--c-tertiary)', nameColor: 'var(--c-tertiary)' },
          ].map((t, i) => (
            <div key={i} className="glass" style={{ padding: 32, borderLeft: `3px solid ${t.borderColor}` }}>
              <p style={{ color: 'var(--c-text)', fontSize: 15, lineHeight: 1.7, margin: '0 0 24px', fontStyle: 'italic' }}>{t.quote}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: t.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: t.avatarColor, fontFamily: "'Plus Jakarta Sans'", fontSize: 15 }}>{t.avatar}</div>
                <div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: t.nameColor }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ padding: '80px 32px', maxWidth: 1280, margin: '0 auto' }}>
        <div className="ai-border" style={{ padding: 60, textAlign: 'center', background: 'linear-gradient(135deg,rgba(0,209,255,0.05),rgba(68,226,205,0.03))' }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.02em' }}>Ready to land your dream job?</h2>
          <p style={{ color: 'var(--c-muted)', fontSize: 17, maxWidth: 500, margin: '0 auto 32px', lineHeight: 1.7 }}>Join 12,000+ students who have already transformed their interview skills with SAKSHAM.AI.</p>
          <Link href="/login" className="btn-primary" style={{ fontSize: 16, padding: '16px 36px' }}>
            Start Free Today
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: 'var(--c-bg1)', borderTop: '1px solid var(--c-border)', padding: '48px 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: 20, color: 'var(--c-primary)' }}>SAKSHAM.AI</div>
          <div style={{ display: 'flex', gap: 28 }}>
            {['Privacy Policy', 'Terms of Service', 'Contact'].map(l => (
              <a key={l} href="#" style={{ color: 'var(--c-muted)', fontSize: 13, textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
          <div style={{ color: 'var(--c-muted)', fontSize: 13 }}>© 2024 SAKSHAM.AI. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
