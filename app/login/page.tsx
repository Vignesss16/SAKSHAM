'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { Eye, EyeOff, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function LoginContent() {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') === 'signup' ? 'signup' : 'signin'
  const isMentor = searchParams.get('role') === 'mentor'

  const [tab, setTab] = useState<'signin' | 'signup'>(defaultTab)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  // Sign-in form state
  const [signin, setSignin] = useState({ email: '', password: '' })
  // Sign-up form state
  const [signup, setSignup] = useState({ name: '', email: '', password: '' })

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signin.email,
        password: signin.password,
      })
      if (error) throw error
      setSuccess(true)
      localStorage.setItem('user_name', data.user?.user_metadata?.full_name || signin.email.split('@')[0])
      setTimeout(() => { window.location.href = '/dashboard' }, 1200)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signup.email,
        password: signup.password,
        options: {
          data: {
            full_name: signup.name,
          }
        }
      })
      if (error) throw error
      setSuccess(true)
      localStorage.setItem('user_name', signup.name || signup.email.split('@')[0])
      setTimeout(() => { window.location.href = '/dashboard' }, 1200)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setError('')
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${location.origin}/api/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL (visual) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #090f12 0%, #0e1417 60%, #121f24 100%)' }}>
        {/* ambient glows */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-[100px]"
          style={{ background: 'rgba(0,209,255,0.12)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full blur-[80px]"
          style={{ background: 'rgba(68,226,205,0.08)' }} />
        <div className="absolute top-1/2 right-1/3 w-32 h-32 rounded-full blur-[60px]"
          style={{ background: 'rgba(236,211,255,0.06)' }} />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(var(--c-primary) 1px, transparent 1px), linear-gradient(90deg, var(--c-primary) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }} />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--c-primary)] flex items-center justify-center shadow-[0_0_20px_rgba(0,209,255,0.4)]">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L16 6.2V11.8L9 16L2 11.8V6.2L9 2Z" fill="#001f28" />
              <circle cx="9" cy="9" r="3" fill="rgba(0,31,40,0.4)" />
            </svg>
          </div>
          <span className="font-black text-xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--c-text)' }}>
            SAKSHAM<span style={{ color: 'var(--c-primary)' }}>.AI</span>
            {isMentor && <span className="text-xs font-normal ml-2 text-white/50 uppercase tracking-widest">Mentor Portal</span>}
          </span>
        </div>

        {/* Center content */}
        <div className="relative space-y-8">
          <div>
            <h2 className="text-4xl font-black leading-tight mb-4"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--c-text)' }}>
              {isMentor ? "Help talent grow" : "Your dream job"}
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #00d1ff 0%, #44e2cd 50%, #ecd3ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {isMentor ? "with SAKSHAM.AI Expert." : "starts with one session."}
              </span>
            </h2>
            <p className="text-[var(--c-muted)] leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
              {isMentor 
                ? "Manage your consultations, track your earnings, and provide expert guidance to aspiring candidates."
                : "Join 50,000+ candidates who mastered their interviews with AI coaching."}
            </p>
          </div>

          {/* Testimonial card */}
          <div className="ai-border p-5 max-w-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-[var(--c-primary)] flex items-center justify-center text-sm font-bold text-[#001f28]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {isMentor ? "SJ" : "RK"}
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--c-text)]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{isMentor ? "Sarah Jenkins" : "Rahul Kumar"}</div>
                <div className="text-xs text-[var(--c-primary)]" style={{ fontFamily: 'Inter, sans-serif' }}>{isMentor ? "Senior Recruiter @ Google" : "SDE @ Amazon"}</div>
              </div>
            </div>
            <p className="text-sm text-[var(--c-muted)] leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
              {isMentor 
                ? "&ldquo;SAKSHAM.AI makes it incredibly easy to manage my mentorship hours and connect with high-quality candidates.&rdquo;"
                : "&ldquo;Used SAKSHAM.AI for 2 weeks before my Amazon loop. Got L5 offer. The AI feedback was better than any human mock I did.&rdquo;"}
            </p>
          </div>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-2.5">
            {[
              { label: isMentor ? 'Expert Dashboard' : '50K+ Users', color: 'var(--c-primary)' },
              { label: isMentor ? 'Live Consultations' : '94% Success Rate', color: 'var(--c-secondary)' },
              { label: isMentor ? 'Earnings Reports' : '200+ Companies', color: 'var(--c-tertiary)' },
            ].map(s => (
              <div key={s.label} className="px-3 py-1.5 rounded-full text-xs font-semibold border"
                style={{ borderColor: `${s.color}40`, background: `${s.color}10`, color: s.color, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {s.label}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative text-xs text-[var(--c-muted)]" style={{ fontFamily: 'Inter, sans-serif' }}>
          © 2024 SAKSHAM.AI, Inc. · <a href="#" className="hover:text-[var(--c-text)] transition-colors">Privacy</a> · <a href="#" className="hover:text-[var(--c-text)] transition-colors">Terms</a>
        </div>
      </div>

      {/* ── RIGHT PANEL (form) ── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 relative min-h-screen">
        {/* Back link */}
        <div className="absolute top-6 left-6">
          <Link href={isMentor ? "/mentor" : "/"}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--c-muted)] hover:text-[var(--c-text)] transition-colors"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <ArrowLeft className="w-4 h-4" /> Back to {isMentor ? 'mentor landing' : 'home'}
          </Link>
        </div>

        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 rounded-lg bg-[var(--c-primary)] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L16 6.2V11.8L9 16L2 11.8V6.2L9 2Z" fill="#001f28" />
              </svg>
            </div>
            <span className="font-black text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--c-text)' }}>
              SAKSHAM<span style={{ color: 'var(--c-primary)' }}>.AI</span>
            </span>
          </div>

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black text-[var(--c-text)] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {isMentor ? 'Mentor Portal' : (tab === 'signin' ? 'Welcome back' : 'Create account')}
            </h1>
            <p className="text-sm text-[var(--c-muted)]" style={{ fontFamily: 'Inter, sans-serif' }}>
              {isMentor 
                ? 'Sign in to access your Mentor Dashboard' 
                : (tab === 'signin' ? 'Sign in to continue your interview prep' : 'Start mastering interviews for free')}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl border border-[var(--c-border)] bg-[var(--c-bg1)] p-1 mb-8">
            {(['signin', 'signup'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError('') }}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  background: tab === t ? 'var(--c-bg3)' : 'transparent',
                  color: tab === t ? 'var(--c-text)' : 'var(--c-muted)',
                }}>
                {t === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-[10px] border border-[var(--c-border)] bg-[var(--c-bg2)] text-sm font-semibold text-[var(--c-text)] hover:border-[rgba(0,209,255,0.2)] hover:bg-[var(--c-bg3)] transition-all mb-6"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[var(--c-border)]" />
            <span className="text-xs text-[var(--c-muted)]" style={{ fontFamily: 'Inter, sans-serif' }}>or continue with email</span>
            <div className="flex-1 h-px bg-[var(--c-border)]" />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg border border-[rgba(255,180,171,0.3)] bg-[rgba(255,180,171,0.05)] text-sm text-[var(--error)]"
              style={{ fontFamily: 'Inter, sans-serif', color: 'var(--c-error, #ffb4ab)' }}>
              {error}
            </div>
          )}

          {/* Success */}
          {success ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--c-secondary)' }} />
              <div className="font-bold text-[var(--c-text)]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {tab === 'signin' ? 'Signed in!' : 'Account created!'}
              </div>
              <div className="text-sm text-[var(--c-muted)] mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>Redirecting you now…</div>
            </div>
          ) : tab === 'signin' ? (
            /* SIGN IN FORM */
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--c-text)] mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={signin.email}
                  onChange={e => setSignin(s => ({ ...s, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-[10px] border border-[var(--c-border)] bg-[var(--c-bg2)] text-[var(--c-text)] text-sm placeholder:text-[var(--c-muted)] focus:outline-none focus:border-[var(--c-primary)] focus:shadow-[0_0_0_3px_rgba(0,209,255,0.1)] transition-all"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-[var(--c-text)]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Password</label>
                  <a href="#" className="text-xs text-[var(--c-primary)] hover:underline" style={{ fontFamily: 'Inter, sans-serif' }}>Forgot password?</a>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={signin.password}
                    onChange={e => setSignin(s => ({ ...s, password: e.target.value }))}
                    className="w-full px-4 py-3 pr-12 rounded-[10px] border border-[var(--c-border)] bg-[var(--c-bg2)] text-[var(--c-text)] text-sm placeholder:text-[var(--c-muted)] focus:outline-none focus:border-[var(--c-primary)] focus:shadow-[0_0_0_3px_rgba(0,209,255,0.1)] transition-all"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--c-muted)] hover:text-[var(--c-text)] transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-[10px] font-bold text-[#001f28] bg-[var(--c-primary)] hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(0,209,255,0.3)] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          ) : (
            /* SIGN UP FORM */
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--c-text)] mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Alex Johnson"
                  value={signup.name}
                  onChange={e => setSignup(s => ({ ...s, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-[10px] border border-[var(--c-border)] bg-[var(--c-bg2)] text-[var(--c-text)] text-sm placeholder:text-[var(--c-muted)] focus:outline-none focus:border-[var(--c-primary)] focus:shadow-[0_0_0_3px_rgba(0,209,255,0.1)] transition-all"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--c-text)] mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={signup.email}
                  onChange={e => setSignup(s => ({ ...s, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-[10px] border border-[var(--c-border)] bg-[var(--c-bg2)] text-[var(--c-text)] text-sm placeholder:text-[var(--c-muted)] focus:outline-none focus:border-[var(--c-primary)] focus:shadow-[0_0_0_3px_rgba(0,209,255,0.1)] transition-all"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--c-text)] mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="Min. 8 characters"
                    value={signup.password}
                    onChange={e => setSignup(s => ({ ...s, password: e.target.value }))}
                    className="w-full px-4 py-3 pr-12 rounded-[10px] border border-[var(--c-border)] bg-[var(--c-bg2)] text-[var(--c-text)] text-sm placeholder:text-[var(--c-muted)] focus:outline-none focus:border-[var(--c-primary)] focus:shadow-[0_0_0_3px_rgba(0,209,255,0.1)] transition-all"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--c-muted)] hover:text-[var(--c-text)] transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password strength */}
              {signup.password && (
                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    {[signup.password.length >= 8, /[A-Z]/.test(signup.password), /[0-9]/.test(signup.password)].map((ok, i) => (
                      <div key={i} className="flex-1 h-1 rounded-full transition-all"
                        style={{ background: ok ? 'var(--c-secondary)' : 'var(--c-bg3)' }} />
                    ))}
                  </div>
                  <p className="text-xs text-[var(--c-muted)]" style={{ fontFamily: 'Inter, sans-serif' }}>
                    8+ chars · uppercase · number
                  </p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-[10px] font-bold text-[#001f28] bg-[var(--c-primary)] hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(0,209,255,0.3)] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
              </button>

              <p className="text-xs text-center text-[var(--c-muted)]" style={{ fontFamily: 'Inter, sans-serif' }}>
                By creating an account you agree to our{' '}
                <a href="#" className="text-[var(--c-primary)] hover:underline">Terms</a> and{' '}
                <a href="#" className="text-[var(--c-primary)] hover:underline">Privacy Policy</a>.
              </p>
            </form>
          )}

          {/* Switch tab */}
          {!success && (
            <p className="mt-6 text-center text-sm text-[var(--c-muted)]" style={{ fontFamily: 'Inter, sans-serif' }}>
              {tab === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => { setTab(tab === 'signin' ? 'signup' : 'signin'); setError('') }}
                className="font-semibold hover:underline"
                style={{ color: 'var(--c-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {tab === 'signin' ? 'Sign up free' : 'Sign in'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{color:'var(--c-primary)'}} /></div>}>
      <LoginContent />
    </Suspense>
  )
}

