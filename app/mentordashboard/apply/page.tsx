"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export default function MentorRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    company: "",
    jobRole: "",
    experienceYears: "",
    linkedinUrl: "",
    bio: "",
    hourlyRate: "500",
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function checkStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?role=mentor&redirect=/mentordashboard/apply");
        return;
      }

      // Pre-fill name if available
      const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();
      if (profile?.role === "mentor") {
        setApplicationStatus("already_mentor");
        setChecking(false);
        return;
      }

      if (profile?.full_name) {
        setFormData((prev) => ({ ...prev, fullName: profile.full_name }));
      }

      // Check if they already applied
      const { data: app } = await supabase
        .from("mentor_applications")
        .select("status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (app) {
        setApplicationStatus(app.status);
      }
      setChecking(false);
    }
    checkStatus();
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("mentor_applications").insert({
        user_id: user.id,
        full_name: formData.fullName,
        company: formData.company,
        job_role: formData.jobRole,
        experience_years: parseInt(formData.experienceYears, 10),
        linkedin_url: formData.linkedinUrl,
        bio: formData.bio,
        hourly_rate: parseInt(formData.hourlyRate, 10) || 500,
        status: "pending",
      });

      if (error) throw error;

      setApplicationStatus("pending");
      // Trigger a reload of layout to show overlay if needed
      window.location.reload();
    } catch (err: any) {
      alert("Error submitting application: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[var(--c-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (applicationStatus === "already_mentor") {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center glass mt-10">
        <span className="material-symbols-outlined text-6xl text-[var(--c-primary)] mb-4">verified</span>
        <h2 className="text-2xl font-bold font-['Plus_Jakarta_Sans'] text-white mb-2">You are a Verified Mentor</h2>
        <p className="text-[var(--c-muted)]">Your profile is already active in the mentor directory.</p>
        <button onClick={() => router.push("/mentordashboard")} className="btn-primary mt-6">Go to Dashboard</button>
      </div>
    );
  }

  if (applicationStatus === "pending") {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center glass mt-10">
        <div className="w-20 h-20 bg-[var(--c-secondary)]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-5xl text-[var(--c-secondary)] animate-pulse">hourglass_top</span>
        </div>
        <h2 className="text-3xl font-black font-['Plus_Jakarta_Sans'] text-white mb-4">Application Under Review</h2>
        <p className="text-lg text-[var(--c-muted)] leading-relaxed">
          Our team is currently reviewing your profile for the Expert Program. <br/>
          <span className="text-white font-bold">You will receive an email confirmation once selected, usually within a few hours.</span>
        </p>
        <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10 text-sm text-[var(--c-muted)]">
          Thank you for joining India's most advanced AI-powered mentor network.
        </div>
        <button onClick={() => router.push("/mentordashboard")} className="btn-primary mt-6">Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-black tracking-tight text-[var(--c-text)] m-0 mb-2">
          Become a Mentor
        </h1>
        <p className="text-[var(--c-muted)] text-[15px] m-0">
          Share your expertise, guide students, and get paid for your time. Fill out the application below to join our verified mentor network.
        </p>
      </div>

      <div className="glass p-8 ai-border">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs text-[var(--c-muted)] font-semibold uppercase tracking-wider block mb-2">Full Name</label>
              <input
                required
                className="field"
                placeholder="e.g. John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-[var(--c-muted)] font-semibold uppercase tracking-wider block mb-2">Current Job Role</label>
              <input
                required
                className="field"
                placeholder="e.g. Senior Software Engineer"
                value={formData.jobRole}
                onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs text-[var(--c-muted)] font-semibold uppercase tracking-wider block mb-2">Current Company</label>
              <input
                required
                className="field"
                placeholder="e.g. Google, Microsoft, Startup"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-[var(--c-muted)] font-semibold uppercase tracking-wider block mb-2">Years of Experience</label>
              <input
                required
                type="number"
                min="1"
                className="field"
                placeholder="e.g. 5"
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[var(--c-muted)] font-semibold uppercase tracking-wider block mb-2">LinkedIn Profile URL</label>
            <input
              required
              type="url"
              className="field"
              placeholder="https://linkedin.com/in/yourprofile"
              value={formData.linkedinUrl}
              onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs text-[var(--c-muted)] font-semibold uppercase tracking-wider block mb-2">Desired Hourly Rate (₹)</label>
            <input
              required
              type="number"
              min="100"
              step="50"
              className="field"
              placeholder="e.g. 500"
              value={formData.hourlyRate}
              onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
            />
            <p className="text-[10px] text-[var(--c-muted)] mt-1">Suggested: ₹300 - ₹1500 per hour</p>
          </div>

          <div>
            <label className="text-xs text-[var(--c-muted)] font-semibold uppercase tracking-wider block mb-2">Short Bio / Expertise</label>
            <textarea
              required
              className="field min-h-[100px] resize-y"
              placeholder="Tell us about your background, what you specialize in, and how you can help students..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center py-3 text-[15px]"
          >
            {loading ? "Submitting Application..." : "Submit Application"}
            {!loading && <span className="material-symbols-outlined text-[18px]">send</span>}
          </button>
        </form>
      </div>
    </div>
  );
}
