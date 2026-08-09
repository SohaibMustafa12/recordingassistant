import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!url || !key) {
  throw new Error("The application backend is not configured.");
}

export const supabase = createClient<Database>(url, key, {
  auth: {
    storage: typeof window === "undefined" ? undefined : window.localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});
