"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function MentorSettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", bio: "", hourly_rate: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login?role=mentor"); return; }
      const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle();
      const { data: mentor } = await supabase.from("mentors").select("bio, hourly_rate").eq("user_id", user.id).maybeSingle();
      setForm({
        full_name: profile?.full_name || "",
        email: profile?.email || user.email || "",
        bio: mentor?.bio || "",
        hourly_rate: mentor?.hourly_rate?.toString() || "",
      });
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ full_name: form.full_name }).eq("id", user.id);
    await supabase.from("mentors").update({ bio: form.bio, hourly_rate: parseInt(form.hourly_rate) || 0 }).eq("user_id", user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return (
    <div className="flex justify-center p-12">
      <div className="w-8 h-8 border-4 border-[var(--c-primary)] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-black tracking-tight text-[var(--c-text)] m-0 mb-2">
          Profile & Settings
        </h1>
        <p className="text-muted text-[15px] m-0">Update your expert profile and preferences.</p>
      </div>

      <form onSubmit={handleSave} className="glass p-8 space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Full Name</label>
          <input
            type="text"
            value={form.full_name}
            onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
            className="w-full bg-[var(--c-bg3)] border border-[var(--c-border)] rounded-xl px-4 py-3 text-[var(--c-text)] focus:border-[var(--c-primary)] outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Email</label>
          <input
            type="email"
            value={form.email}
            disabled
            className="w-full bg-[var(--c-bg3)] border border-[var(--c-border)] rounded-xl px-4 py-3 text-muted cursor-not-allowed"
          />
          <p className="text-xs text-muted mt-1">Email cannot be changed.</p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Short Bio / Expertise</label>
          <textarea
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            rows={4}
            placeholder="Tell students about your background and expertise..."
            className="w-full bg-[var(--c-bg3)] border border-[var(--c-border)] rounded-xl px-4 py-3 text-[var(--c-text)] focus:border-[var(--c-primary)] outline-none transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Hourly Rate (₹)</label>
          <input
            type="number"
            value={form.hourly_rate}
            onChange={e => setForm(f => ({ ...f, hourly_rate: e.target.value }))}
            placeholder="e.g. 500"
            className="w-full bg-[var(--c-bg3)] border border-[var(--c-border)] rounded-xl px-4 py-3 text-[var(--c-text)] focus:border-[var(--c-primary)] outline-none transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full py-4 text-base justify-center"
        >
          {saving ? (
            <><span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span> Saving...</>
          ) : saved ? (
            <><span className="material-symbols-outlined">check_circle</span> Saved!</>
          ) : (
            <><span className="material-symbols-outlined">save</span> Save Changes</>
          )}
        </button>
      </form>
    </div>
  );
}
