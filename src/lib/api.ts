import { supabase } from "@/lib/supabase";

const apiUrl = (import.meta.env["VITE_TAKKA_API_URL"] ?? "http://localhost:8080").replace(
  /\/$/,
  "",
);
export const adminConsoleUrl = `${apiUrl}/admin`;
export const adminLoginUrl = `${apiUrl}/admin/login`;
const API_TIMEOUT_MS = 15_000;

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

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
  email?: string;
  administrator: boolean;
  adminRole?: "SUPER_ADMIN" | "MODERATOR";
  adminSource?: "BOOTSTRAP" | "ADMIN_USERS" | "NONE";
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
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "The account service is unavailable.";
    throw new ApiRequestError(message, 0);
  } finally {
    window.clearTimeout(timeout);
  }
  const text =
    response.status === 204 || response.headers.get("content-length") === "0"
      ? ""
      : await response.text();
  if (!response.ok) {
    let message = "";
    try {
      message = (JSON.parse(text) as { error?: string }).error ?? "";
    } catch {
      if (response.headers.get("content-type")?.startsWith("text/plain")) message = text.trim();
    }
    throw new ApiRequestError(message || `Request failed (${response.status})`, response.status);
  }
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
