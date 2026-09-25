"use server";
import { redirect } from "next/navigation";
import { isConfigured, supabase } from "@/lib/supabase";

function intentOf(value: FormDataEntryValue | null) {
  return value === "coordinator" ? "coordinator" : "user";
}

export async function signIn(_previous: { message: string }, form: FormData) {
  if (!isConfigured()) return { message: "Sign-in is not available yet." };
  const client = await supabase();
  const { error } = await client.auth.signInWithPassword({
    email: String(form.get("email") || ""),
    password: String(form.get("password") || ""),
  });
  if (error)
    return { message: "Unable to sign in. Check your email and password." };
  redirect(`/auth/continue?intent=${intentOf(form.get("intent"))}`);
}

export async function signOut() {
  const client = await supabase();
  await client.auth.signOut();
  redirect("/");
}
