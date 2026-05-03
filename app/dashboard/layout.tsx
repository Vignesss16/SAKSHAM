"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AIChatbot } from "@/components/AIChatbot";

const navItems = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard", exact: true },
  { href: "/dashboard/new", icon: "mic", label: "Interviews" },
  { href: "/dashboard/resume", icon: "description", label: "Resume" },
  { href: "/dashboard/certificates", icon: "verified", label: "Certificates" },
  { href: "/dashboard/reports", icon: "analytics", label: "Reports" },
  { href: "/dashboard/settings", icon: "settings", label: "Settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [userName, setUserName] = useState("Student");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).maybeSingle();
        if (data) {
          setUserName(data.full_name || user.user_metadata?.full_name || "Student");
          setAvatarUrl(data.avatar_url || user.user_metadata?.avatar_url || "");
        } else {
          setUserName(user.user_metadata?.full_name || "Student");
          setAvatarUrl(user.user_metadata?.avatar_url || "");
        }
      }
    }
    loadUser();
  }, [supabase]);

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Interview room is fullscreen — no sidebar
  if (pathname === "/dashboard/interview") {
    return <>{children}</>;
  }

  const isActive = (item: { href: string; exact?: boolean }) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <div className="flex min-h-screen bg-[var(--c-bg)]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1A1A1A] border-r border-[var(--c-border)] fixed top-0 left-0 h-screen flex flex-col px-4 py-6 z-50">
        <div className="font-['Plus_Jakarta_Sans'] font-black text-lg text-[var(--c-primary)] tracking-tight mb-8 px-2">
          PrepAI
        </div>

        <div className="mb-6 px-4 py-3 bg-white/5 rounded-xl flex items-center gap-3">
          {avatarUrl ? (
            <img src={avatarUrl} alt={userName} className="w-9 h-9 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--c-primary)] to-[var(--c-secondary)] flex items-center justify-center font-['Plus_Jakarta_Sans'] font-bold text-[#001f28] text-sm shrink-0 uppercase">
              {userName.charAt(0)}
            </div>
          )}
          <div>
            <div className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-[var(--c-text)]">
              {userName}
            </div>
            <div className="text-xs text-[var(--c-muted)]">Student</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive(item) ? "active" : ""}`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-5 border-t border-[var(--c-border)] flex flex-col gap-1">
          <Link
            href="/dashboard/new"
            className="btn-primary w-full justify-center text-[13px] p-3 mb-2"
          >
            <span className="material-symbols-outlined text-[18px]">
              add_circle
            </span>
            New Interview
          </Link>
          <button onClick={handleSignOut} className="sidebar-link w-full text-left bg-transparent border-none">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Log Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="top-header sticky top-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-[360px] w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[var(--c-muted)]">
                search
              </span>
              <input
                className="field pl-10"
                type="text"
                placeholder="Search sessions, resources..."
              />
            </div>
          </div>
          <div className="flex items-center gap-2 relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="bg-transparent border-none cursor-pointer w-9 h-9 rounded-lg flex items-center justify-center text-[var(--c-muted)] hover:bg-[var(--c-bg3)] relative"
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--c-primary)] rounded-full"></span>
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute top-12 right-16 w-80 bg-[#1A1A1A] border border-[var(--c-border)] rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-4 border-b border-[var(--c-border)] flex justify-between items-center">
                  <h3 className="font-bold text-white text-sm">Notifications</h3>
                  <button className="text-xs text-[var(--c-primary)] hover:underline border-none bg-transparent cursor-pointer">Mark all read</button>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  <div className="p-4 border-b border-[var(--c-border)] hover:bg-white/5 cursor-pointer">
                    <p className="text-sm text-white font-medium mb-1">New AI Report Generated</p>
                    <p className="text-xs text-[var(--c-muted)]">Your interview report for Software Engineer is ready.</p>
                  </div>
                  <div className="p-4 border-b border-[var(--c-border)] hover:bg-white/5 cursor-pointer">
                    <p className="text-sm text-white font-medium mb-1">Welcome to PrepAI</p>
                    <p className="text-xs text-[var(--c-muted)]">Complete your profile to get better recommendations.</p>
                  </div>
                </div>
              </div>
            )}

            <button 
              onClick={() => {
                const newTheme = theme === 'dark' ? 'light' : 'dark';
                setTheme(newTheme);
                if (newTheme === 'light') {
                  alert("Light theme is currently in beta. You may experience some contrast issues.");
                }
              }}
              className="bg-transparent border-none cursor-pointer w-9 h-9 rounded-lg flex items-center justify-center text-[var(--c-muted)] hover:bg-[var(--c-bg3)] transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <div className="w-px h-6 bg-[var(--c-border)] mx-1"></div>
            <div className="flex items-center gap-2.5">
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--c-primary)] to-[var(--c-secondary)] flex items-center justify-center font-['Plus_Jakarta_Sans'] font-bold text-[#001f28] text-[13px] uppercase">
                  {userName.charAt(0)}
                </div>
              )}
              <span className="text-sm font-medium text-[var(--c-text)]">
                {userName}
              </span>
            </div>
          </div>
        </header>

        <main className="p-8 flex-1">
          <div className="max-w-[1200px] mx-auto">{children}</div>
        </main>
      </div>
      
      <AIChatbot />
    </div>
  );
}
