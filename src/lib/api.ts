import { supabase } from "@/lib/supabase";

const apiUrl = (import.meta.env["VITE_TAKKA_API_URL"] ?? "http://localhost:8080").replace(
  /\/$/,
  "",
);
const API_TIMEOUT_MS = 15_000;

/** The two member-facing endpoints the Java API serves. Moderation lives in the /admin console. */
export type SubmittedReport = {
  id: string;
  target_type: "ACCOUNT" | "POST";
  target_id: string;
  reason: string;
  status: string;
  created_at: string;
};

export type AccountStatus = {
  status: "ACTIVE" | "BLOCKED";
  reason?: string;
  blockedAt?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("Your session has expired. Please log in again.");
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(new DOMException("Request timed out", "TimeoutError")),
    API_TIMEOUT_MS,
  );
  let response: Response;
  try {
    response = await fetch(apiUrl + path, {
      ...init,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } finally {
    window.clearTimeout(timeout);
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${response.status})`);
  }
  if (response.status === 204 || response.headers.get("content-length") === "0")
    return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function submitReport(input: {
  targetType: "ACCOUNT" | "POST";
  targetId: string;
  reason: string;
  details?: string;
}) {
  return request<SubmittedReport>("/api/reports", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getAccountStatus() {
  return request<AccountStatus>("/api/account/status");
}
