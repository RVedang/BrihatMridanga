import { redirect } from "next/navigation";
import { Landmark } from "lucide-react";
import { isConfigured } from "@/lib/supabase";
import { displayNameFromUser, requireSignedIn } from "@/lib/auth";
import { OnboardingForm } from "@/components/onboarding-form";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Add your temple",
  robots: { index: false, follow: false },
};

export default async function Onboarding() {
  if (!isConfigured()) redirect("/login");
  const { user, profile } = await requireSignedIn();
  if (profile?.role === "admin") redirect("/portal");
  if (profile?.role === "temple_coordinator" && profile.temple_id)
    redirect("/portal");
  return (
    <div className="container">
      <div className="login login-wide">
        <div className="login-mark" aria-hidden="true">
          <Landmark size={28} strokeWidth={1.3} />
        </div>
        <p className="eyebrow">Your temple</p>
        <h1>Add your temple</h1>
        <p className="lede">
          These details appear on the public temple page and on the dashboard.
          You can add photographs, stories and reports after this step.
        </p>
        <OnboardingForm defaultName={displayNameFromUser(user)} />
      </div>
    </div>
  );
}
