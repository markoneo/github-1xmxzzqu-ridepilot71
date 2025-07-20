import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role key
const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://xvurxeuwgzmzkpgkekah.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2dXJ4ZXV3Z3ptemtwZ2tla2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMDkyNzgsImV4cCI6MjA1OTg4NTI3OH0.dRa4m8yD-UV-SbBsyaolOz8sY_PmsgfRePYgkOmfb4s";

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is required');
}

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY is required');
}

// Create server-side client that can bypass RLS
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});