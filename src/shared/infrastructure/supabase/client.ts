import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "@shared/utils/env";

let client: SupabaseClient | undefined;

export function getSupabase(): SupabaseClient {
  if (client) {
    return client;
  }

  const supabaseUrl = requireEnv("SUPABASE_URL");
  const supabasePublishableKey = requireEnv("SUPABASE_PUBLISHABLE_KEY");

  client = createClient(supabaseUrl, supabasePublishableKey);
  return client;
}

export function resetSupabaseClient(): void {
  client = undefined;
}
