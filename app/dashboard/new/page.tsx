'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const personas = [
  { emoji: '🤖', name: 'Technical Sam', desc: 'Rigorous, detail-oriented', color: 'var(--c-primary)', activeColor: 'rgba(0,209,255,0.05)' },
  { emoji: '👩‍💼', name: 'HR Jordan', desc: 'Friendly, culture-focused', color: 'var(--c-secondary)', activeColor: 'rgba(68,226,205,0.05)' },
  { emoji: '💼', name: 'Senior Morgan', desc: 'Strategic, tough follow-ups', color: 'var(--c-tertiary)', activeColor: 'rgba(236,211,255,0.05)' },
]

export default function NewInterviewPage() {
  const router = useRouter()
  const [selectedPersona, setSelectedPersona] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      // Post to our new API route
      const res = await fetch('/api/generate-prompt', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to generate prompt');
      }

      const data = await res.json();
      
      // Save the generated prompt to localStorage so the interview page can read it
      localStorage.setItem('omnidimension_system_prompt', data.prompt);
      if (data.variables) {
        localStorage.setItem('omnidimension_variables', JSON.stringify(data.variables));
      }
      
      // Navigate to the interview page
      router.push('/dashboard/interview');
    } catch (error) {
      console.error(error);
      alert('There was an error initializing the interview.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ minHeight: '100vh', background: 'var(--c-bg)', position: 'relative' }}>
      {/* Minimal top bar */}
      <header style={{ background: 'var(--c-bg1)', borderBottom: '1px solid var(--c-border)', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--c-primary)' }}>PrepAI</div>
        <Link href="/dashboard" className="btn-ghost" style={{ fontSize: 13, padding: '8px 16px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span> Back
        </Link>
      </header>

      <div style={{ maxWidth: 800, margin: '60px auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(24px,3vw,36px)', fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.02em' }}>Configure Your Interview</h1>
          <p style={{ color: 'var(--c-muted)', fontSize: 16, margin: 0 }}>Customize the session to match your target company and role.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Role & Company */}
          <div className="glass" style={{ padding: 28 }}>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, margin: '0 0 20px', color: 'var(--c-text)' }}>Role &amp; Company</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 6, display: 'block' }}>Job Title</label>
                <input name="jobTitle" className="field" type="text" defaultValue="Senior Software Engineer" required />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 6, display: 'block' }}>Target Company</label>
                <input name="targetCompany" className="field" type="text" placeholder="e.g. Google, Amazon..." required />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 6, display: 'block' }}>Interview Type</label>
                <select name="interviewType" className="field">
                  <option>Technical (DSA + System Design)</option>
                  <option>Behavioral (STAR Method)</option>
                  <option>HR / Culture Fit</option>
                  <option>Full Loop (All types)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 6, display: 'block' }}>Difficulty</label>
                <select name="difficulty" className="field">
                  <option>Mid-Level</option>
                  <option>Entry Level</option>
                  <option>Senior / Lead</option>
                  <option>FAANG Level</option>
                </select>
              </div>
            </div>
            
            <div style={{ marginTop: 20 }}>
              <label style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 6, display: 'block' }}>Resume (PDF)</label>
              <input name="resume" type="file" accept="application/pdf" className="field" style={{ padding: '10px' }} required />
            </div>
            
            <div style={{ marginTop: 20 }}>
              <label style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 6, display: 'block' }}>Job Description</label>
              <textarea name="jd" className="field" rows={4} placeholder="Paste the job description here..." required></textarea>
            </div>
          </div>



          {/* AI Persona */}
          <div className="glass" style={{ padding: 28 }}>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: 'var(--c-text)' }}>AI Interviewer Persona</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {personas.map((p, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedPersona(i)}
                  style={{
                    padding: 16,
                    border: `1.5px solid ${selectedPersona === i ? p.color : 'var(--c-border)'}`,
                    borderRadius: 12,
                    cursor: 'pointer',
                    background: selectedPersona === i ? p.activeColor : 'transparent',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={e => { if (selectedPersona !== i) e.currentTarget.style.borderColor = p.color }}
                  onMouseOut={e => { if (selectedPersona !== i) e.currentTarget.style.borderColor = 'var(--c-border)' }}
                >
                  <div style={{ fontSize: 20, marginBottom: 8 }}>{p.emoji}</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: selectedPersona === i ? p.color : 'var(--c-text)' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <button type="submit" disabled={isLoading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 17, padding: 18, border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
            <span className="material-symbols-outlined">mic</span>
            {isLoading ? 'Generating Prompt...' : 'Start Voice Interview'}
          </button>
        </div>
      </div>
    </form>
  )
}
