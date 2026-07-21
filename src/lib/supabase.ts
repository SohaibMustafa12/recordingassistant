import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tymnibaiwcyrthqpxffq.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5bW5pYmFpd2N5cnRocXB4ZmZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1MzQxNDMsImV4cCI6MjEwMDExMDE0M30.keoeiHA6OquVObbD9jqBGDFKpzjhkGcFWAIpi30Cvh4";

// This check prevents the "Multiple instances" error
const globalWithSupabase = (
  typeof window !== "undefined" ? window : globalThis
) as typeof globalThis & {
  supabase?: ReturnType<typeof createClient>;
};

const supabaseInstance = globalWithSupabase.supabase || createClient(supabaseUrl, supabaseAnonKey);

if (process.env.NODE_ENV !== "production") {
  globalWithSupabase.supabase = supabaseInstance;
}

export const supabase = supabaseInstance;
