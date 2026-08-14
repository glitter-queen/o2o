import { createClient } from "@supabase/supabase-js";

// Strip ALL whitespace/newlines that can sneak in when pasting env vars.
// A Supabase URL and a JWT anon key never contain spaces or line breaks,
// so this is safe — and it prevents the "invalid header value" error.
const clean = (v) => (v || "").replace(/\s/g, "").trim();

const url = clean(import.meta.env.VITE_SUPABASE_URL);
const key = clean(import.meta.env.VITE_SUPABASE_ANON_KEY);

if (!url || !key) {
  console.warn(
    "Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel."
  );
}

export const supabase = createClient(url, key);
