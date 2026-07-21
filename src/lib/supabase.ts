// Re-export the typed, singleton Supabase browser client so callers get the
// generated Database types (fixes `never` inference on .from() calls) and we
// avoid instantiating multiple GoTrueClient instances.
export { supabase } from "@/integrations/supabase/client";
