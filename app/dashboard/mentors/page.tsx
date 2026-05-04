"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";

type Mentor = {
  user_id: string;
  full_name: string;
  company: string;
  job_role: string;
  experience_years: number;
  rating: number;
  total_reviews: number;
  hourly_rate: number;
  profiles: { avatar_url: string };
};

export default function MentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchMentors() {
      const { data, error } = await supabase
        .from("mentors")
        .select(`
          user_id, full_name, company, job_role, experience_years, rating, total_reviews, hourly_rate,
          profiles!inner(avatar_url)
        `);
      
      if (data) {
        setMentors(data as Mentor[]);
      }
      setLoading(false);
    }
    fetchMentors();
  }, [supabase]);

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-black tracking-tight text-[var(--c-text)] m-0 mb-2">
            Find a Mentor
          </h1>
          <p className="text-[var(--c-muted)] text-[15px] m-0">
            Connect with industry experts for 1-on-1 guidance and interview preparation.
          </p>
        </div>
        <Link href="/dashboard/mentor-register" className="btn-secondary text-sm">
          Become a Mentor
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-[var(--c-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : mentors.length === 0 ? (
        <div className="glass p-12 text-center text-[var(--c-muted)]">
          <span className="material-symbols-outlined text-4xl mb-3">group_off</span>
          <p>No mentors available at the moment. Check back later!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map((mentor) => (
            <div key={mentor.user_id} className="glass p-6 flex flex-col h-full">
              <div className="flex items-center gap-4 mb-4">
                {mentor.profiles?.avatar_url ? (
                  <img src={mentor.profiles.avatar_url} alt={mentor.full_name} className="w-14 h-14 rounded-full object-cover border-2 border-[var(--c-primary)]" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--c-primary)] to-[var(--c-secondary)] flex items-center justify-center font-bold text-[#001f28] text-lg">
                    {mentor.full_name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-[var(--c-text)] font-['Plus_Jakarta_Sans'] text-lg line-clamp-1">{mentor.full_name}</h3>
                  <div className="text-sm text-[var(--c-primary)] font-semibold line-clamp-1">
                    {mentor.job_role} @ {mentor.company}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 mb-5 text-sm text-[var(--c-muted)]">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-amber-400">star</span>
                  {mentor.rating > 0 ? mentor.rating.toFixed(1) : 'New'} 
                  <span className="text-[11px]">({mentor.total_reviews})</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">work</span>
                  {mentor.experience_years} YOE
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-[var(--c-border)] flex items-center justify-between">
                <div className="font-bold text-[var(--c-text)]">
                  ${mentor.hourly_rate} <span className="text-xs font-normal text-[var(--c-muted)]">/ session</span>
                </div>
                <Link href={`/dashboard/mentors/${mentor.user_id}`} className="btn-primary text-xs px-4 py-2">
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
