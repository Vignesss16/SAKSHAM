"use client";
import { useState } from "react";

export default function SettingsPage() {
  const [toggles, setToggles] = useState([
    { label: "Email reminders for scheduled interviews", enabled: true },
    { label: "Weekly progress report", enabled: true },
    { label: "Certificate issue notifications", enabled: false },
    { label: "Product updates and tips", enabled: false },
  ]);

  const toggleSetting = (index: number) => {
    const newToggles = [...toggles];
    newToggles[index].enabled = !newToggles[index].enabled;
    setToggles(newToggles);
  };

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-black tracking-tight text-[var(--c-text)] m-0 mb-1.5">
          Settings
        </h1>
        <p className="text-[var(--c-muted)] text-[15px] m-0">
          Manage your account preferences and notification settings.
        </p>
      </div>

      <div className="grid gap-5">
        {/* Profile */}
        <div className="glass p-6">
          <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold mb-4">Profile</h3>
          <div className="flex items-center gap-5 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--c-primary)] to-[var(--c-secondary)] flex items-center justify-center font-['Plus_Jakarta_Sans'] font-bold text-[#001f28] text-xl">
              A
            </div>
            <div>
              <div className="font-['Plus_Jakarta_Sans'] font-bold text-[var(--c-text)]">Alex Rivera</div>
              <div className="text-sm text-[var(--c-muted)]">alex@example.com</div>
            </div>
            <button className="ml-auto btn-ghost text-sm">Edit Profile</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[var(--c-muted)] font-semibold uppercase tracking-wider block mb-1.5">Full Name</label>
              <input className="field" defaultValue="Alex Rivera" />
            </div>
            <div>
              <label className="text-xs text-[var(--c-muted)] font-semibold uppercase tracking-wider block mb-1.5">Email</label>
              <input className="field" defaultValue="alex@example.com" type="email" />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="glass p-6">
          <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold mb-4">Notifications</h3>
          <div className="space-y-4">
            {toggles.map((n, i) => (
              <div key={n.label} className="flex items-center justify-between">
                <span className="text-sm text-[var(--c-text)]">{n.label}</span>
                <button 
                  onClick={() => toggleSetting(i)}
                  className={`w-10 h-6 rounded-full relative transition-colors ${n.enabled ? "bg-[var(--c-primary)]" : "bg-[var(--c-bg3)]"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full transition-all ${n.enabled ? "right-1 bg-white" : "left-1 bg-gray-400"}`}></span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="glass p-6 border-[rgba(255,180,171,0.2)]">
          <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold mb-4 text-[var(--c-error)]">Danger Zone</h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[var(--c-text)]">Delete Account</div>
              <div className="text-xs text-[var(--c-muted)]">Permanently delete your account and all associated data.</div>
            </div>
            <button className="px-4 py-2 rounded-lg border border-[rgba(255,180,171,0.4)] text-[var(--c-error)] text-sm font-semibold hover:bg-[rgba(255,180,171,0.08)] transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
