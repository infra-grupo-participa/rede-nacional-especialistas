"use client";

import { createBrowserClient } from "@supabase/ssr";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_SCHEMA,
  SUPABASE_URL,
  assertSupabaseConfig,
  noStoreFetch,
} from "./config";

/** Client Supabase para componentes client-side. Schema `rede`. */
export function createClient() {
  assertSupabaseConfig();
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: { schema: SUPABASE_SCHEMA },
    global: { fetch: noStoreFetch },
  });
}
