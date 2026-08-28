import { supabase } from "@/lib/supabase";

const apiUrl = (import.meta.env["VITE_TAKKA_API_URL"] ?? "http://localhost:8080").replace(
  /\/$/,
  "",
);

export type AdminIdentity = { userId: string; email: string; role: "SUPER_ADMIN" | "MODERATOR" };
export type Overview = {
  openReports: number;
  members: number;
  blockedMembers: number;
  posts: number;
  removedPosts: number;
  universities: number;
  publishedUniversities: number;
};
export type AdminReport = {
  id: string;
  reporter_id: string;
  target_type: "ACCOUNT" | "POST";
  target_id: string;
  reason: string;
  details: string | null;
  status: string;
  resolution_notes: string | null;
  target_snapshot: Record<string, unknown>;
  created_at: string;
};
export type AdminMember = {
  id: string;
  email: string;
  full_name: string;
  account_type: string;
  created_at: string;
  student_profiles: Array<{
    verification_status: string;
    universities: { name: string } | null;
  }>;
  account_moderation: Array<{ status: string; reason: string | null; blocked_at: string | null }>;
};
export type AdminPost = {
  id: string;
  body: string;
  created_at: string;
  moderation_status: string;
  removal_reason: string | null;
  report_count: number;
  profiles: { full_name: string; email: string } | null;
};
export type AdminUniversity = {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  university_type: "public" | "private";
  city: string;
  region: string | null;
  country_code: string;
  description: string;
  about: string | null;
  website_url: string | null;
  logo_path: string | null;
  is_published: boolean;
  archived_at: string | null;
  founded_year: number | null;
  contact_email: string | null;
  contact_phone: string | null;
  data_source_url: string | null;
  campuses: Array<{ count: number }>;
  departments: Array<{ count: number }>;
  programs: Array<{ count: number }>;
};
export type AuditAction = {
  id: string;
  admin_email: string;
  action: string;
  target_type: string;
  target_id: string;
  reason: string;
  created_at: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("Your session has expired. Please log in again.");
  const response = await fetch(apiUrl + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${response.status})`);
  }
  if (response.status === 204 || response.headers.get("content-length") === "0")
    return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const adminApi = {
  me: () => request<AdminIdentity>("/api/admin/me"),
  overview: () => request<Overview>("/api/admin/overview"),
  reports: (status = "") =>
    request<AdminReport[]>(`/api/admin/reports${status ? `?status=${status}` : ""}`),
  updateReport: (id: string, status: string, notes: string) =>
    request<AdminReport>(`/api/admin/reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, notes }),
    }),
  members: (search = "", status = "") =>
    request<AdminMember[]>(
      `/api/admin/members?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`,
    ),
  memberAction: (id: string, action: "block" | "unblock", reason: string, reportId?: string) =>
    request<void>(`/api/admin/members/${id}/${action}`, {
      method: "POST",
      body: JSON.stringify({ reason, reportId: reportId ?? null }),
    }),
  deleteMember: (id: string, reason: string) =>
    request<void>(`/api/admin/members/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    }),
  posts: (status = "") =>
    request<AdminPost[]>(`/api/admin/posts${status ? `?status=${status}` : ""}`),
  postAction: (id: string, action: "remove" | "restore", reason: string, reportId?: string) =>
    request<void>(`/api/admin/posts/${id}/${action}`, {
      method: "POST",
      body: JSON.stringify({ reason, reportId: reportId ?? null }),
    }),
  audit: () => request<AuditAction[]>("/api/admin/audit-log"),
  universities: () => request<AdminUniversity[]>("/api/admin/universities"),
  saveUniversity: (value: Record<string, unknown>, id?: string) =>
    request<AdminUniversity>(`/api/admin/universities${id ? `/${id}` : ""}`, {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(value),
    }),
  universityAction: (id: string, action: "publish" | "unpublish" | "archive", reason: string) =>
    request<void>(`/api/admin/universities/${id}/${action}`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
};

export async function submitReport(input: {
  targetType: "ACCOUNT" | "POST";
  targetId: string;
  reason: string;
  details?: string;
}) {
  return request<AdminReport>("/api/reports", { method: "POST", body: JSON.stringify(input) });
}

export function getAccountStatus() {
  return request<{ status: "ACTIVE" | "BLOCKED"; reason?: string; blockedAt?: string }>(
    "/api/account/status",
  );
}
