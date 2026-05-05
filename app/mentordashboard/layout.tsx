"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const mentorNavItems = [
  { href: "/mentordashboard", icon: "dashboard", label: "Dashboard", exact: true },
  { href: "/dashboard/mentors/sessions", icon: "event_repeat", label: "My Sessions" },
  { href: "/dashboard/settings", icon: "settings", label: "Profile & Settings" },
  { href: "/dashboard/reports", icon: "payments", label: "Earnings & Reports" },
];

function applyTheme(theme: string) {
  const root = document.documentElement;
  if (theme === 'light') {
    root.style.setProperty('--c-bg', '#f0f4f8');
    root.style.setProperty('--c-bg1', '#ffffff');
    root.style.setProperty('--c-bg2', '#e8edf2');
    root.style.setProperty('--c-bg3', '#d1dae3');
    root.style.setProperty('--c-border', '#c5cfd8');
    root.style.setProperty('--c-text', '#0d1b24');
    root.style.setProperty('--c-muted', '#4a6374');
  } else {
    root.style.setProperty('--c-bg', '#0e1417');
    root.style.setProperty('--c-bg1', '#121212');
    root.style.setProperty('--c-bg2', '#1a1a1a');
    root.style.setProperty('--c-bg3', '#242424');
    root.style.setProperty('--c-border', '#242424');
    root.style.setProperty('--c-text', '#dde3e7');
    root.style.setProperty('--c-muted', '#859399');
  }
}

export default function MentorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [userName, setUserName] = useState("Expert");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userRole, setUserRole] = useState("Mentor");
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const saved = localStorage.getItem('saksham-theme') || 'dark';
    setTheme(saved);
    applyTheme(saved);
  }, []);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("full_name, avatar_url, role").eq("id", user.id).maybeSingle();
        if (data) {
          setUserName(data.full_name || user.user_metadata?.full_name || "Expert");
          setAvatarUrl(data.avatar_url || user.user_metadata?.avatar_url || "");
          setUserRole(data.role || "Mentor");
        }
      } else {
        router.push("/login?role=mentor");
      }
    }
    loadUser();
  }, [supabase, router]);

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('saksham-theme', newTheme);
    applyTheme(newTheme);
  };

  const isActive = (item: { href: string; exact?: boolean }) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <div className="flex min-h-screen bg-[var(--c-bg)]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1A1A1A] border-r border-[var(--c-border)] fixed top-0 left-0 h-screen flex flex-col px-4 py-6 z-50">
        <div className="font-['Plus_Jakarta_Sans'] font-black text-lg text-[var(--c-primary)] tracking-tight mb-8 px-2">
          SAKSHAM.AI <span className="text-[10px] uppercase font-bold text-white/40 ml-1">Expert</span>
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
            <div className="text-xs text-[var(--c-muted)] capitalize">{userRole}</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
          {mentorNavItems.map((item) => (
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
          <div className="flex-1"></div>
          <div className="flex items-center gap-2 relative">
            <button
              onClick={handleThemeToggle}
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
    </div>
  );
}
