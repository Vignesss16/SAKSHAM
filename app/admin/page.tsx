"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Application = {
  id: string;
  user_id: string;
  full_name: string;
  company: string;
  job_role: string;
  experience_years: number;
  linkedin_url: string;
  bio: string;
  status: string;
  created_at: string;
};

export default function AdminDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchApplications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("mentor_applications")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) {
      setApplications(data as Application[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();
  }, [supabase]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action} this application?`)) return;

    try {
      const res = await fetch('/api/admin/verify-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: id, action })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to process application');
      
      alert(data.message);
      fetchApplications();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-black mb-6">Mentor Applications</h1>
      
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="w-8 h-8 border-4 border-[var(--c-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : applications.length === 0 ? (
        <div className="glass p-8 text-center text-[var(--c-muted)]">
          No applications found.
        </div>
      ) : (
        <div className="grid gap-6">
          {applications.map(app => (
            <div key={app.id} className="glass p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-[var(--c-text)]">
                    {app.full_name}
                  </h2>
                  <div className="text-sm text-[var(--c-primary)] font-semibold mt-1">
                    {app.job_role} at {app.company} • {app.experience_years} YOE
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  app.status === 'pending' ? 'bg-[rgba(255,180,171,0.1)] text-[#ffb4ab]' :
                  app.status === 'approved' ? 'bg-[rgba(100,220,100,0.1)] text-[#64dc64]' :
                  'bg-[var(--c-bg3)] text-[var(--c-muted)]'
                }`}>
                  {app.status}
                </span>
              </div>
              
              <div className="mb-4">
                <a 
                  href={app.linkedin_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-sm text-[var(--c-secondary)] hover:underline flex items-center gap-1 mb-2"
                >
                  <span className="material-symbols-outlined text-[16px]">link</span>
                  LinkedIn Profile
                </a>
                <p className="text-sm text-[var(--c-muted)] bg-[var(--c-bg1)] p-4 rounded-lg">
                  {app.bio}
                </p>
              </div>

              {app.status === 'pending' && (
                <div className="flex gap-3 mt-4 pt-4 border-t border-[var(--c-border)]">
                  <button 
                    onClick={() => handleAction(app.id, 'approve')}
                    className="bg-[#64dc64] hover:bg-[#52c652] text-[#001f28] font-bold py-2 px-6 rounded-lg text-sm transition-colors"
                  >
                    Approve Mentor
                  </button>
                  <button 
                    onClick={() => handleAction(app.id, 'reject')}
                    className="bg-[var(--c-bg3)] hover:bg-[#ffb4ab] hover:text-[#001f28] text-[var(--c-text)] font-bold py-2 px-6 rounded-lg text-sm transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
