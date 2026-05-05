"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams, useRouter } from "next/navigation";

type Mentor = {
  user_id: string;
  full_name: string;
  company: string;
  job_role: string;
  experience_years: number;
  linkedin_url: string;
  bio: string;
  rating: number;
  total_reviews: number;
  hourly_rate: number;
  profiles: { avatar_url: string } | { avatar_url: string }[];
};

export default function MentorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  // Basic booking form state (for demo, we just use a date picker)
  const [scheduledAt, setScheduledAt] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchMentor() {
      const { data, error } = await supabase
        .from("mentors")
        .select(`*, profiles(full_name, avatar_url)`)
        .eq("user_id", params.id)
        .single();
      
      if (data) {
        // Handle joined profile data correctly
        const mentorData = {
          ...data,
          full_name: data.profiles?.full_name || "Mentor",
          avatar_url: data.profiles?.avatar_url
        };
        setMentor(mentorData as any);
      }
      setLoading(false);
    }
    fetchMentor();
  }, [supabase, params.id]);

  const handleBookSession = async () => {
    if (!scheduledAt) return alert("Please select a date and time");
    
    setBookingLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      if (user.id === mentor?.user_id) throw new Error("You cannot book yourself");

      const rate = mentor?.hourly_rate || 0;
      const commission = Math.round(rate * 0.20); // 20% commission

      const { data, error } = await supabase.from("mentor_bookings").insert({
        student_id: user.id,
        mentor_id: mentor!.user_id,
        scheduled_at: new Date(scheduledAt).toISOString(),
        status: "pending",
        payment_amount: rate,
        commission_amount: commission
      }).select().single();

      if (error) throw error;

      alert("Session booked successfully! You can join the call from your dashboard when it is time.");
      // In a real app we would redirect to a bookings list or confirmation page
      router.push("/dashboard");

    } catch (err: any) {
      alert("Error booking session: " + err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-[var(--c-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="glass p-12 text-center text-[var(--c-muted)]">
        Mentor not found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Mentor Info */}
      <div className="md:col-span-2 space-y-6">
        <div className="glass p-8 flex items-start gap-6">
          {mentor.avatar_url ? (
            <img src={mentor.avatar_url} alt={mentor.full_name} className="w-24 h-24 rounded-full object-cover border-4 border-[var(--c-primary)]" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--c-primary)] to-[var(--c-secondary)] flex items-center justify-center font-bold text-[#001f28] text-3xl">
              {mentor.full_name?.charAt(0) || "M"}
            </div>
          )}
          
          <div className="flex-1">
            <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-black text-[var(--c-text)] m-0">
              {mentor.full_name}
            </h1>
            <div className="text-[var(--c-primary)] font-semibold text-lg mb-2">
              {mentor.job_role} at {mentor.company}
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-[var(--c-muted)] mb-4">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px] text-amber-400">star</span>
                <span className="text-[var(--c-text)] font-bold">{mentor.rating > 0 ? mentor.rating.toFixed(1) : 'New'}</span> 
                ({mentor.total_reviews} reviews)
              </div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">work</span>
                {mentor.experience_years} Years Experience
              </div>
              <a href={mentor.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[var(--c-secondary)] hover:underline">
                <span className="material-symbols-outlined text-[18px]">link</span>
                LinkedIn
              </a>
            </div>
          </div>
        </div>

        <div className="glass p-8">
          <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold mb-4">About Me</h2>
          <p className="text-[var(--c-muted)] whitespace-pre-wrap leading-relaxed">
            {mentor.bio}
          </p>
        </div>
      </div>

      {/* Booking Card */}
      <div className="md:col-span-1">
        <div className="glass p-6 sticky top-24">
          <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold mb-6 border-b border-[var(--c-border)] pb-4">
            Book a 1-on-1 Session
          </h3>
          
          <div className="flex justify-between items-end mb-6">
            <span className="text-[var(--c-muted)] text-sm">Session Rate</span>
            <span className="font-['Plus_Jakarta_Sans'] text-2xl font-black text-[var(--c-text)]">
              ₹{mentor.hourly_rate} <span className="text-sm text-[var(--c-muted)] font-normal">/ hr</span>
            </span>
          </div>

          <div className="mb-6">
            <label className="text-xs text-[var(--c-muted)] font-semibold uppercase tracking-wider block mb-2">Select Date & Time</label>
            <input 
              type="datetime-local" 
              className="field"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div className="bg-[var(--c-bg1)] p-4 rounded-xl mb-6 text-sm">
            <div className="flex justify-between mb-2 text-[var(--c-muted)]">
              <span>Platform Fee (20%)</span>
              <span>₹{Math.round(mentor.hourly_rate * 0.20)}</span>
            </div>
            <div className="flex justify-between font-bold text-[var(--c-text)] pt-2 border-t border-[var(--c-border)]">
              <span>Total Price</span>
              <span>₹{mentor.hourly_rate}</span>
            </div>
          </div>

          <button 
            onClick={handleBookSession}
            disabled={bookingLoading}
            className="btn-primary w-full justify-center py-3 text-[15px]"
          >
            {bookingLoading ? "Booking..." : "Confirm Booking"}
          </button>
          
          <p className="text-xs text-[var(--c-muted)] text-center mt-4">
            You will not be charged until the session is confirmed.
          </p>
        </div>
      </div>
    </div>
  );
}
