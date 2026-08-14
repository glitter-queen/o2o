import { createClient } from "@supabase/supabase-js";

// Robust against messy env vars: if a value got pasted with line breaks
// or duplicated multiple times, take only the FIRST clean token.
// (A Supabase URL and a JWT anon key are always a single token, no spaces.)
const firstToken = (v) => (v || "").split(/\s+/).filter(Boolean)[0] || "";

const url = firstToken(import.meta.env.VITE_SUPABASE_URL);
const key = firstToken(import.meta.env.VITE_SUPABASE_ANON_KEY);

if (!url || !key) {
  console.warn(
    "Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel."
  );
}

export const supabase = createClient(url, key);
