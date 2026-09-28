type DbError = { message?: string; code?: string; details?: string | null };

const byCode: Record<string, string> = {
  "42501": "You do not have access to this record.",
  "23505": "A record like this already exists.",
  "23503": "A linked record no longer exists. Refresh the page and try again.",
  "23514": "One of the values is not allowed. Check the form and try again.",
  "23502": "A required field is missing.",
  "22P02": "One of the values is in the wrong format.",
  "22001": "One of the values is too long.",
  PGRST116: "That record could not be found. Refresh the page and try again.",
  PGRST202: "This feature is not available on the database yet.",
};

/** Turns a Supabase/Postgres error into copy that is safe to show, logging the raw error. */
export function friendlyError(
  error: DbError,
  context: string,
  fallback = "Something went wrong while saving. Please try again.",
) {
  console.error(`[${context}]`, error.code, error.message, error.details ?? "");
  const message = error.message || "";
  if (message.includes("Temple access denied"))
    return "Your temple is awaiting approval, or you do not have access to it.";
  // Messages raised by our own database functions are written for people.
  if (error.code === "P0001" && message) return message;
  if (error.code && byCode[error.code]) return byCode[error.code];
  if (/fetch failed|network|timeout/i.test(message))
    return "We could not reach the database. Check your connection and try again.";
  return fallback;
}
