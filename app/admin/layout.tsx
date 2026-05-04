"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      
      if (data?.role === "admin") {
        setIsAdmin(true);
      } else {
        router.push("/dashboard");
      }
    }
    checkAdmin();
  }, [supabase, router]);

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-[var(--c-bg)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--c-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[var(--c-bg)] text-[var(--c-text)]">
      <header className="bg-[#1A1A1A] border-b border-[var(--c-border)] p-4 flex items-center justify-between">
        <div className="font-['Plus_Jakarta_Sans'] font-black text-xl text-[var(--c-primary)]">
          SAKSHAM.AI <span className="text-white">Admin</span>
        </div>
        <button onClick={() => router.push("/dashboard")} className="btn-ghost text-sm">
          Exit Admin
        </button>
      </header>
      <main className="p-8 max-w-[1200px] mx-auto">
        {children}
      </main>
    </div>
  );
}
