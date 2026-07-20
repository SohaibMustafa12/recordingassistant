import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://tymnibaiwcyrthqpxffq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5bW5pYmFpd2N5cnRocXB4ZmZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1MzQxNDMsImV4cCI6MjEwMDExMDE0M30.keoeiHA6OquVObbD9jqBGDFKpzjhkGcFWAIpi30Cvh4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
