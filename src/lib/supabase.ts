import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client (for realtime subscriptions)
export function createBrowserClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Server-side Supabase client (for admin operations)
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(
    supabaseUrl,
    serviceRoleKey || supabaseAnonKey,
    {
      auth: { persistSession: false },
    }
  );
}
