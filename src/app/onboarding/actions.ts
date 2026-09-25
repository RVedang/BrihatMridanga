"use server";
import { redirect } from "next/navigation";
import { requireSignedIn } from "@/lib/auth";
import { isValidTimeZone } from "@/lib/timezones";

export async function registerTemple(
  _previous: { message: string },
  form: FormData,
) {
  const { client, profile } = await requireSignedIn();
  if (profile?.role === "admin") redirect("/portal");
  if (profile?.role === "temple_coordinator" && profile.temple_id)
    redirect("/portal");
  const text = (name: string) => String(form.get(name) || "").trim();
  const timezone = text("timezone") || "Asia/Kolkata";
  if (!isValidTimeZone(timezone))
    return { message: "Choose a valid time zone, such as Asia/Kolkata." };
  if (!text("name")) return { message: "Temple name is required." };
  if (!text("country")) return { message: "Country is required." };
  if (!text("display_name")) return { message: "Your name is required." };
  if (text("information").length > 2000)
    return { message: "Temple information is too long." };
  if (text("contact").length > 500)
    return { message: "Contact details are too long." };
  const { error } = await client.rpc("register_temple", {
    request: {
      name: text("name"),
      country: text("country"),
      city: text("city"),
      timezone,
      information: text("information"),
      contact: text("contact"),
      displayName: text("display_name"),
      centreName: text("centre_name"),
    },
  });
  if (error)
    return {
      message:
        error.message.includes("schema cache") || error.code === "PGRST202"
          ? "Temple registration is not available on this database yet."
          : error.message,
    };
  redirect("/portal");
}
