"use client";
import { useState, useEffect } from "react";
import { createBrowserClient } from '@supabase/ssr';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  
  // Profile State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");

  const [toggles, setToggles] = useState([
    { label: "Email reminders for scheduled interviews", enabled: true },
    { label: "Weekly progress report", enabled: true },
    { label: "Certificate issue notifications", enabled: false },
    { label: "Product updates and tips", enabled: false },
  ]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setEmail(user.email || "");
        
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        if (profile?.full_name) {
          setFullName(profile.full_name);
        } else if (user.user_metadata?.full_name) {
          setFullName(user.user_metadata.full_name);
        }
      }
    }
    loadProfile();
  }, [supabase]);

  const toggleSetting = (index: number) => {
    const newToggles = [...toggles];
    newToggles[index].enabled = !newToggles[index].enabled;
    setToggles(newToggles);
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').upsert({ id: userId, full_name: fullName });
      if (error) throw error;
      alert("Profile updated successfully!");
    } catch (err: any) {
      alert("Error updating profile: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'billing', label: 'Billing' },
    { id: 'integration', label: 'Integrations' },
  ];

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-black tracking-tight text-[var(--c-text)] m-0 mb-1.5">
          Settings
        </h1>
        <p className="text-[var(--c-muted)] text-[15px] m-0">
          Manage your account preferences and integration settings.
        </p>
      </div>

      <div className="flex border-b border-[#242424] mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === tab.id 
                ? 'border-[#00d1ff] text-[#00d1ff]' 
                : 'border-transparent text-[#859399] hover:text-[#bbc9cf]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 max-w-3xl">
        {activeTab === 'profile' && (
          <>
            <div className="glass p-6">
              <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold mb-4">Profile</h3>
              <div className="flex items-center gap-5 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--c-primary)] to-[var(--c-secondary)] flex items-center justify-center font-['Plus_Jakarta_Sans'] font-bold text-[#001f28] text-xl">
                  {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="font-['Plus_Jakarta_Sans'] font-bold text-[var(--c-text)]">{fullName || "User"}</div>
                  <div className="text-sm text-[var(--c-muted)]">{email}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-[var(--c-muted)] font-semibold uppercase tracking-wider block mb-1.5">Full Name</label>
                  <input 
                    className="field" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--c-muted)] font-semibold uppercase tracking-wider block mb-1.5">Email</label>
                  <input 
                    className="field opacity-50 cursor-not-allowed" 
                    value={email} 
                    disabled 
                    type="email" 
                  />
                </div>
              </div>
              <button 
                onClick={handleUpdateProfile} 
                disabled={loading}
                className="btn-primary text-sm px-6 py-2"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

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
          </>
        )}

        {activeTab === 'notifications' && (
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
        )}

        {activeTab === 'billing' && (
          <div className="glass p-6">
            <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold mb-4">Billing & Plan</h3>
            <div className="bg-[#242b2e]/50 p-4 rounded-xl border border-[#3c494e] mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-white">Pro Plan</span>
                <span className="bg-[#00d1ff]/20 text-[#00d1ff] px-2 py-1 text-xs font-bold rounded">ACTIVE</span>
              </div>
              <p className="text-sm text-[#bbc9cf]">Unlimited interviews and advanced analytics.</p>
            </div>
            <button className="btn-ghost text-sm">Manage Subscription</button>
          </div>
        )}

        {activeTab === 'integration' && (
          <div className="glass p-6">
            <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold mb-4">Integrations</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#242b2e]/50 rounded-xl border border-[#3c494e]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded flex items-center justify-center font-bold text-[#1a73e8] text-xl">G</div>
                  <div>
                    <div className="font-bold text-white text-sm">Google Calendar</div>
                    <div className="text-xs text-[#bbc9cf]">Sync your scheduled mock interviews.</div>
                  </div>
                </div>
                <button className="btn-ghost text-xs">Connect</button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-[#242b2e]/50 rounded-xl border border-[#3c494e]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#0052cc] rounded flex items-center justify-center font-bold text-white text-xl">J</div>
                  <div>
                    <div className="font-bold text-white text-sm">Jira</div>
                    <div className="text-xs text-[#bbc9cf]">Export system design tickets.</div>
                  </div>
                </div>
                <button className="btn-ghost text-xs">Connect</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
