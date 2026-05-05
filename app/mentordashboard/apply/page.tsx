import { redirect } from "next/navigation";

// Redirect /mentordashboard/apply → /dashboard/mentor-register
export default function MentorApplyRedirect() {
  redirect("/dashboard/mentor-register");
}
