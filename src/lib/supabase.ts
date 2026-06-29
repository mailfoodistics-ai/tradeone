import { createClient } from "@supabase/supabase-js";

// Read these from env vars. You should set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Supabase environment variables (VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY) are not set.");
}

export const supabase = createClient(SUPABASE_URL ?? "", SUPABASE_ANON_KEY ?? "");

export function getSupabaseErrorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const normalized = message.toLowerCase();

  if (!message) return fallback;
  if (normalized.includes("bucket") && normalized.includes("not found")) {
    return "Storage bucket not found. Create a public Storage bucket named \"attachments\" in Supabase and try again.";
  }
  if (normalized.includes("row-level security") || normalized.includes("permission") || normalized.includes("policy")) {
    return "Supabase permissions are blocking this action. Review your table and Storage policies and try again.";
  }
  if (normalized.includes("failed to fetch") || normalized.includes("network")) {
    return "The request could not reach Supabase. Check your connection and confirm the project URL/key are correct.";
  }
  if (normalized.includes("duplicate") || normalized.includes("unique constraint")) {
    return "This record already exists. Use a different account name or value and try again.";
  }

  return message;
}
