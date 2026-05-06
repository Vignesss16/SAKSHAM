"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [userRole, setUserRole] = useState<"student" | "mentor" | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchBooking() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from("mentor_bookings")
        .select(`
          *, 
          mentor:mentor_id(profiles(full_name)), 
          student:student_id(full_name)
        `)
        .eq("id", bookingId)
        .single();

      if (error || !data) {
        alert("Booking not found");
        router.push("/dashboard");
        return;
      }

      setBooking(data);
      
      if (user.id === data.student_id) {
        setUserRole("student");
      } else if (user.id === data.mentor_id) {
        setUserRole("mentor");
      } else {
        router.push("/dashboard");
      }

      setLoading(false);
    }
    fetchBooking();
  }, [bookingId, supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return alert("Please select a rating.");
    
    setSubmitting(true);
    try {
      const toUserId = userRole === "student" ? booking.mentor_id : booking.student_id;

      // Update booking status to completed if it isn't already
      if (booking.status !== "completed") {
        await supabase.from("mentor_bookings").update({ status: "completed" }).eq("id", bookingId);
      }

      const { error } = await supabase.from("mentor_reviews").insert({
        booking_id: bookingId,
        from_user_id: currentUserId,
        to_user_id: toUserId,
        rating: rating,
        feedback: feedback
      });

      if (error) throw error;

      // Note: A real app should recalculate the mentor's average rating here using a database trigger
      // For this demo, we just submit the review.

      alert("Review submitted successfully!");
      router.push("/dashboard");

    } catch (err: any) {
      alert("Error submitting review: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-[var(--c-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const targetName = userRole === "student" ? "Mentor" : "Student";

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="text-center mb-8">
        <span className="material-symbols-outlined text-6xl text-[var(--c-primary)] mb-4">rate_review</span>
        <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-black text-[var(--c-text)]">
          Rate your session with {userRole === "student" ? booking?.mentor?.profiles?.full_name : booking?.student?.full_name}
        </h1>
        <p className="text-[var(--c-muted)] mt-2">
          Your feedback helps us maintain high quality standards on SAKSHAM.AI.
        </p>
      </div>

      <div className="glass p-8 ai-border">
        <form onSubmit={handleSubmit}>
          <div className="mb-8 text-center flex flex-col items-center">
            <label className="text-sm font-bold text-[var(--c-text)] mb-4 block">
              Rate your {targetName}
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`bg-transparent border-none outline-none transition-transform hover:scale-110 ${star <= rating ? 'text-amber-400' : 'text-[var(--c-border)]'}`}
                >
                  <span className="material-symbols-outlined text-5xl cursor-pointer">
                    {star <= rating ? 'star' : 'star'}
                  </span>
                </button>
              ))}
            </div>
            <div className="text-xs font-bold text-[var(--c-primary)] mt-3 h-4 uppercase tracking-wider">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </div>
          </div>

          <div className="mb-8">
            <label className="text-xs font-semibold text-[var(--c-muted)] uppercase tracking-wider mb-2 block">
              Additional Feedback (Optional)
            </label>
            <textarea 
              className="field min-h-[120px] resize-y"
              placeholder={`Share your experience with the ${targetName.toLowerCase()}...`}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={submitting || rating === 0}
            className="btn-primary w-full justify-center py-4 text-[16px]"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      </div>
    </div>
  );
}
