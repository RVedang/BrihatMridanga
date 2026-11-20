"use server";
import { revalidatePath } from "next/cache";
import { requireActor } from "@/lib/auth";
import { validDate } from "@/lib/dates";
import { friendlyError } from "@/lib/errors";
export async function setMarathonDates(_previous: string, form: FormData) {
  const { client, profile } = await requireActor();
  const target = String(form.get("temple") || "");
  const starts = String(form.get("start") || ""),
    ends = String(form.get("end") || "");
  if (profile.role !== "admin" && target !== profile.temple_id)
    return "Temple access denied.";
  if (!validDate(starts) || !validDate(ends) || ends < starts)
    return "Enter a valid start and end date.";
  const { error } = await client.rpc("set_marathon_dates", {
    target,
    starts,
    ends,
  });
  if (error) return friendlyError(error, "setMarathonDates");
  revalidatePath("/portal");
  revalidatePath("/");
  return "Marathon dates saved.";
}
