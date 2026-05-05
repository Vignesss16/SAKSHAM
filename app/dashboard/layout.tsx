"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { AIChatbot } from "@/components/AIChatbot";

const navItems = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard", exact: true },
  { href: "/dashboard/daily", icon: "task_alt", label: "Daily Challenge" },
  { href: "/dashboard/new", icon: "mic", label: "AI Interview" },
  { href: "/dashboard/resume", icon: "description", label: "AI Resume Analyzer" },
  { href: "/dashboard/mentors", icon: "groups", label: "Find a Mentor" },
  { href: "/dashboard/certificates", icon: "verified", label: "Certificates" },
  { href: "/dashboard/reports", icon: "analytics", label: "Reports" },
  { href: "/dashboard/leaderboard", icon: "leaderboard", label: "Leaderboard" },
  { href: "/dashboard/settings", icon: "settings", label: "Settings" },
];

const ALL_PAGES = [
  { label: "Dashboard", href: "/dashboard", desc: "Your home overview and stats" },
  { label: "Daily Challenge", href: "/dashboard/daily", desc: "Solve daily questions to earn credits" },
  { label: "AI Interview", href: "/dashboard/new", desc: "Start a new mock interview session" },
  { label: "AI Resume Analyzer", href: "/dashboard/resume", desc: "Analyze and score your resume" },
  { label: "Find a Mentor", href: "/dashboard/mentors", desc: "Connect with industry experts for 1-on-1 guidance" },
  { label: "Certificates", href: "/dashboard/certificates", desc: "View earned certificates" },
  { label: "Reports", href: "/dashboard/reports", desc: "View interview performance reports" },
  { label: "Leaderboard", href: "/dashboard/leaderboard", desc: "See global rankings by credits" },
  { label: "Settings", href: "/dashboard/settings", desc: "Manage your profile and preferences" },
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
  const [userRole, setUserRole] = useState("Student");
  const [theme, setTheme] = useState('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const saved = localStorage.getItem('saksham-theme') || 'dark';
    setTheme(saved);
    applyTheme(saved);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("full_name, avatar_url, role").eq("id", user.id).maybeSingle();
        if (data) {
          setUserName(data.full_name || user.user_metadata?.full_name || "Student");
          setAvatarUrl(data.avatar_url || user.user_metadata?.avatar_url || "");
          setUserRole(data.role || "Student");
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

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('saksham-theme', newTheme);
    applyTheme(newTheme);
  };

  // Interview room is fullscreen — no sidebar
  if (pathname === "/dashboard/interview") {
    return <>{children}</>;
  }

  const isActive = (item: { href: string; exact?: boolean }) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  const studentNavItems = [
    { href: "/dashboard", icon: "dashboard", label: "Dashboard", exact: true },
    { href: "/dashboard/daily", icon: "task_alt", label: "Daily Challenge" },
    { href: "/dashboard/new", icon: "mic", label: "AI Interview" },
    { href: "/dashboard/resume", icon: "description", label: "AI Resume Analyzer" },
    { href: "/dashboard/mentors", icon: "groups", label: "Find a Mentor" },
    { href: "/dashboard/mentors/sessions", icon: "event_repeat", label: "My Sessions" },
    { href: "/dashboard/certificates", icon: "verified", label: "Certificates" },
    { href: "/dashboard/reports", icon: "analytics", label: "Reports" },
    { href: "/dashboard/leaderboard", icon: "leaderboard", label: "Leaderboard" },
    { href: "/dashboard/settings", icon: "settings", label: "Settings" },
  ];

  const mentorNavItems = [
    { href: "/mentordashboard", icon: "dashboard", label: "Dashboard", exact: true },
    { href: "/mentordashboard/sessions", icon: "event_repeat", label: "My Sessions" },
    { href: "/mentordashboard/settings", icon: "settings", label: "Profile & Settings" },
    { href: "/mentordashboard/earnings", icon: "payments", label: "Earnings & Reports" },
  ];

  const [isMentorFlow, setIsMentorFlow] = useState(false);

  useEffect(() => {
    async function checkMentorFlow() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roleData } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      const userRole = roleData?.role || "student";

      const { data: app } = await supabase
        .from("mentor_applications")
        .select("status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const isMentor = userRole === "mentor" || !!app;
      setIsMentorFlow(isMentor);

      // If they are in the mentor flow but at /dashboard, send them to the right place
      if (isMentor && pathname.startsWith('/dashboard') && !pathname.startsWith('/dashboard/settings') && !pathname.startsWith('/dashboard/reports')) {
        router.replace('/mentordashboard');
      }
    }
    checkMentorFlow();
  }, [supabase, pathname, router]);

  const dynamicNavItems = isMentorFlow ? mentorNavItems : studentNavItems;
  const dynamicAllPages = isMentorFlow
    ? ALL_PAGES.filter(p => !['/dashboard/daily', '/dashboard/new', '/dashboard/resume', '/dashboard/leaderboard', '/dashboard/certificates'].includes(p.href))
    : ALL_PAGES;

  const searchResults = searchQuery.trim()
    ? dynamicAllPages.filter(p =>
        p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.desc.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Security: Prevent mentors from accessing student-only pages
  useEffect(() => {
    if (isMentorFlow) {
      const studentOnlyPaths = ['/dashboard/daily', '/dashboard/new', '/dashboard/resume', '/dashboard/certificates', '/dashboard/leaderboard'];
      if (studentOnlyPaths.some(path => pathname.startsWith(path))) {
        router.replace('/dashboard');
      }
    }
  }, [isMentorFlow, pathname, router]);

  return (
    <div className="flex min-h-screen bg-[var(--c-bg)]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1A1A1A] border-r border-[var(--c-border)] fixed top-0 left-0 h-screen flex flex-col px-4 py-6 z-50">
        <div className="font-['Plus_Jakarta_Sans'] font-black text-lg text-[var(--c-primary)] tracking-tight mb-8 px-2">
          SAKSHAM.AI
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
          {dynamicNavItems.map((item) => (
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
          
          {userRole === "admin" && (
            <Link
              href="/admin"
              className={`sidebar-link ${pathname.startsWith("/admin") ? "active" : ""}`}
            >
              <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
              Admin Panel
            </Link>
          )}
        </nav>

        <div className="mt-auto pt-5 border-t border-[var(--c-border)] flex flex-col gap-1">
          {userRole === "student" && (
            <Link
              href="/dashboard/new"
              className="btn-primary w-full justify-center text-[13px] p-3 mb-2"
            >
              <span className="material-symbols-outlined text-[18px]">
                add_circle
              </span>
              New Interview
            </Link>
          )}
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
            <div className="relative max-w-[400px] w-full" ref={searchRef}>
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[var(--c-muted)] pointer-events-none">
                search
              </span>
              <input
                className="field !pl-12 pr-10"
                type="text"
                placeholder="Search pages, features..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
                onFocus={() => setShowSearch(true)}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded border border-[var(--c-border)] bg-[var(--c-bg2)] text-[10px] text-[var(--c-muted)] font-bold pointer-events-none">
                /
              </div>
              {showSearch && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1A1A] border border-[var(--c-border)] rounded-xl shadow-2xl z-50 overflow-hidden">
                  {searchResults.map((r) => (
                    <Link
                      key={r.href}
                      href={r.href}
                      onClick={() => { setSearchQuery(''); setShowSearch(false); }}
                      className="flex flex-col px-4 py-3 hover:bg-white/5 transition-colors border-b border-[var(--c-border)] last:border-0"
                    >
                      <span className="text-sm font-semibold text-[var(--c-text)]">{r.label}</span>
                      <span className="text-xs text-[var(--c-muted)]">{r.desc}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 relative">
            <button
              onClick={handleThemeToggle}
              className="bg-transparent border-none cursor-pointer w-9 h-9 rounded-lg flex items-center justify-center text-[var(--c-muted)] hover:bg-[var(--c-bg3)] transition-transform active:scale-95"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
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

      {!isMentorFlow && <AIChatbot />}
    </div>
  );
}
