import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"];
const supabasePublishableKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
const takkaApiUrl = import.meta.env["VITE_TAKKA_API_URL"]?.replace(/\/$/, "");
const supabaseProxyUrl = (
  import.meta.env["VITE_SUPABASE_PROXY_URL"] ?? (takkaApiUrl ? `${takkaApiUrl}/api/supabase` : "")
).replace(/\/$/, "");
const REQUEST_TIMEOUT_MS = 15_000;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.",
  );
}

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const sourceSignal = init?.signal ?? (input instanceof Request ? input.signal : undefined);
  const relayAbort = () => controller.abort(sourceSignal?.reason);
  sourceSignal?.addEventListener("abort", relayAbort, { once: true });
  const timeout = window.setTimeout(
    () => controller.abort(new DOMException("Request timed out", "TimeoutError")),
    REQUEST_TIMEOUT_MS,
  );
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
    sourceSignal?.removeEventListener("abort", relayAbort);
  }
}

function proxySupabaseFetch(input: RequestInfo | URL, init?: RequestInit) {
  if (typeof window === "undefined") return fetch(input, init);
  if (!supabaseProxyUrl) return fetchWithTimeout(input, init);
  const original = new URL(input instanceof Request ? input.url : input.toString());
  if (original.origin !== new URL(supabaseUrl).origin) return fetchWithTimeout(input, init);
  const proxyUrl = `${supabaseProxyUrl}${original.pathname}${original.search}`;
  return fetchWithTimeout(input instanceof Request ? new Request(proxyUrl, input) : proxyUrl, init);
}

export function isSupabaseConnectionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /failed to fetch|fetch failed|network|timeout|timed out|load failed/i.test(message);
}

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: typeof window !== "undefined",
    detectSessionInUrl: typeof window !== "undefined",
    persistSession: typeof window !== "undefined",
  },
  global: { fetch: proxySupabaseFetch },
});
