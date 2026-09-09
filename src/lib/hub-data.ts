import type { Enums } from "@/lib/database.types";
import {
  getUniversity,
  getMemberProfile,
  startDirectConversation,
  type CommunityProfile,
  type University,
  type UniversitySummary,
} from "@/lib/data";
import { supabase } from "@/lib/supabase";

// These tables land with the Hub migration. Keeping their models here makes the
// feature type-safe even before generated database types are refreshed remotely.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type MatcherPreferences = {
  user_id: string;
  preferred_field: string | null;
  preferred_city: string | null;
  preferred_degree_level: string | null;
  preferred_university_type: Enums<"university_type"> | null;
  field_weight: number;
  city_weight: number;
  degree_weight: number;
  type_weight: number;
};

export type SmartMatch = UniversitySummary & {
  score: number;
  componentScores: { field: number; city: number; degree: number; type: number };
  reasons: string[];
};

type SmartMatchRow = {
  university_id: string;
  score: number;
  match_reasons: string[];
  field_score: number;
  city_score: number;
  degree_score: number;
  type_score: number;
};

export type OpportunityType = "scholarship" | "internship" | "competition" | "workshop" | "event";
export type OpportunityStatus = "pending" | "published" | "rejected" | "closed" | "archived";

export type Opportunity = {
  id: string;
  title: string;
  organization: string;
  opportunity_type: OpportunityType;
  description: string;
  eligibility: string | null;
  location: string | null;
  external_url: string | null;
  university_id: string | null;
  starts_at: string | null;
  deadline_at: string;
  created_by: string | null;
  status: OpportunityStatus;
  review_note: string | null;
  created_at: string;
  university: { id: string; name: string; short_name: string } | null;
  bookmarked: boolean;
};

export type BuddyProfileInput = {
  topics: string[];
  goals: string;
  study_modes: ("online" | "in_person")[];
  languages: string[];
  availability: string[];
  is_active: boolean;
};

export type BuddyProfile = BuddyProfileInput & {
  user_id: string;
  profile: CommunityProfile & {
    student_profiles?:
      | {
          university_id: string;
          department_id: string | null;
          academic_year: number | null;
          university: { name: string; city: string } | null;
          department: { name: string } | null;
        }
      | Array<{
          university_id: string;
          department_id: string | null;
          academic_year: number | null;
          university: { name: string; city: string } | null;
          department: { name: string } | null;
        }>
      | null;
  };
};

export type BuddyMatch = BuddyProfile & { score: number; reasons: string[] };
export type BuddyRequest = {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string | null;
  status: "pending" | "accepted" | "declined" | "cancelled" | "blocked";
  created_at: string;
  sender: CommunityProfile;
  receiver: CommunityProfile;
};

function ok<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

export async function getMatcherPreferences(userId: string): Promise<MatcherPreferences | null> {
  const saved = ok<MatcherPreferences | null>(
    await db.from("matcher_preferences").select("*").eq("user_id", userId).maybeSingle(),
  );
  if (saved) return saved;
  const prospective = ok<{
    preferred_field: string | null;
    preferred_city: string | null;
    preferred_degree_level: string | null;
  } | null>(
    await db
      .from("prospective_profiles")
      .select("preferred_field,preferred_city,preferred_degree_level")
      .eq("user_id", userId)
      .maybeSingle(),
  );
  return prospective
    ? {
        user_id: userId,
        preferred_field: prospective.preferred_field,
        preferred_city: prospective.preferred_city,
        preferred_degree_level: prospective.preferred_degree_level,
        preferred_university_type: null,
        field_weight: 3,
        city_weight: 2,
        degree_weight: 3,
        type_weight: 1,
      }
    : null;
}

export async function saveMatcherPreferences(preferences: MatcherPreferences) {
  ok(await db.from("matcher_preferences").upsert(preferences, { onConflict: "user_id" }));
}

export async function listUniversityLocations(): Promise<string[]> {
  const rows = ok<Array<{ city: string; region: string | null }>>(
    await db
      .from("universities")
      .select("city,region")
      .eq("is_published", true)
      .is("archived_at", null),
  );
  return [
    ...new Set(rows.flatMap((item) => [item.city, item.region].filter(Boolean) as string[])),
  ].sort((left, right) => left.localeCompare(right));
}

export async function listSmartMatches(preferences: MatcherPreferences): Promise<SmartMatch[]> {
  const ranked = ok<SmartMatchRow[]>(
    await db.rpc("recommend_universities_v2", {
      p_preferred_field: preferences.preferred_field,
      p_preferred_city: preferences.preferred_city,
      p_preferred_degree_level: preferences.preferred_degree_level,
      p_preferred_university_type: preferences.preferred_university_type,
      p_field_weight: preferences.field_weight,
      p_city_weight: preferences.city_weight,
      p_degree_weight: preferences.degree_weight,
      p_type_weight: preferences.type_weight,
      p_limit: 12,
    }),
  );
  if (!ranked.length) return [];
  const summaries = ok<UniversitySummary[]>(
    await db
      .from("universities")
      .select(
        "id,name,short_name,city,region,university_type,description,cover_image_path,cover_image_credit,cover_image_source_url,cover_image_license,departments(count)",
      )
      .in(
        "id",
        ranked.map((item) => item.university_id),
      ),
  );
  const byId = new Map(summaries.map((item) => [item.id, item]));
  return ranked.flatMap((item) => {
    const university = byId.get(item.university_id);
    return university
      ? [
          {
            ...university,
            score: item.score,
            reasons: item.match_reasons,
            componentScores: {
              field: item.field_score,
              city: item.city_score,
              degree: item.degree_score,
              type: item.type_score,
            },
          },
        ]
      : [];
  });
}

export async function loadUniversityComparison(ids: string[]): Promise<University[]> {
  return Promise.all(ids.slice(0, 3).map(getUniversity));
}

export async function listOpportunities(userId: string): Promise<Opportunity[]> {
  await db.rpc("deliver_due_opportunity_reminders");
  const [items, bookmarks] = await Promise.all([
    db
      .from("opportunities")
      .select("*,university:universities(id,name,short_name)")
      .eq("status", "published")
      .gt("deadline_at", new Date().toISOString())
      .order("deadline_at", { ascending: true }),
    db.from("opportunity_bookmarks").select("opportunity_id").eq("user_id", userId),
  ]);
  const saved = new Set(
    ok<Array<{ opportunity_id: string }>>(bookmarks).map((item) => item.opportunity_id),
  );
  return ok<Array<Omit<Opportunity, "bookmarked">>>(items).map((item) => ({
    ...item,
    bookmarked: saved.has(item.id),
  }));
}

export async function listOwnOpportunitySubmissions(userId: string): Promise<Opportunity[]> {
  const rows = ok<Array<Omit<Opportunity, "bookmarked">>>(
    await db
      .from("opportunities")
      .select("*,university:universities(id,name,short_name)")
      .eq("created_by", userId)
      .order("created_at", { ascending: false }),
  );
  return rows.map((item) => ({ ...item, bookmarked: false }));
}

export async function submitOpportunity(
  input: Omit<
    Opportunity,
    "id" | "created_at" | "status" | "review_note" | "university" | "bookmarked"
  >,
) {
  ok(await db.from("opportunities").insert({ ...input, status: "pending" }));
}

export async function setOpportunityBookmarked(
  userId: string,
  opportunityId: string,
  saved: boolean,
) {
  const query = db.from("opportunity_bookmarks");
  if (saved) ok(await query.upsert({ user_id: userId, opportunity_id: opportunityId }));
  else ok(await query.delete().eq("user_id", userId).eq("opportunity_id", opportunityId));
}

export async function getBuddyProfile(userId: string): Promise<BuddyProfileInput | null> {
  return ok(
    await db
      .from("study_buddy_profiles")
      .select("topics,goals,study_modes,languages,availability,is_active")
      .eq("user_id", userId)
      .maybeSingle(),
  );
}

export async function saveBuddyProfile(userId: string, input: BuddyProfileInput) {
  ok(
    await db
      .from("study_buddy_profiles")
      .upsert({ user_id: userId, ...input }, { onConflict: "user_id" }),
  );
}

function overlap(left: string[], right: string[]) {
  const normalized = new Set(left.map((item) => item.toLowerCase()));
  return right.filter((item) => normalized.has(item.toLowerCase()));
}

export function buddyStudent(profile: BuddyProfile["profile"]) {
  const student = profile.student_profiles;
  return Array.isArray(student) ? student[0] : student;
}

export async function listBuddyMatches(userId: string): Promise<BuddyMatch[]> {
  const [mineResult, member, candidatesResult, dismissalsResult, requestsResult] =
    await Promise.all([
      db.from("study_buddy_profiles").select("*").eq("user_id", userId).single(),
      getMemberProfile(userId),
      db
        .from("study_buddy_profiles")
        .select(
          "*,profile:profiles!study_buddy_profiles_user_id_fkey(id,full_name,avatar_path,account_type,student_profiles(university_id,department_id,academic_year,university:universities(name,city),department:departments(name)))",
        )
        .eq("is_active", true)
        .neq("user_id", userId),
      db.from("study_buddy_dismissals").select("dismissed_user_id").eq("user_id", userId),
      db
        .from("study_buddy_requests")
        .select("sender_id,receiver_id,status")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .in("status", ["pending", "blocked"]),
    ]);
  const mine = ok<BuddyProfileInput & { user_id: string }>(mineResult);
  const dismissed = new Set(
    ok<Array<{ dismissed_user_id: string }>>(dismissalsResult).map(
      (item) => item.dismissed_user_id,
    ),
  );
  const pending = new Set(
    ok<Array<{ sender_id: string; receiver_id: string }>>(requestsResult).flatMap((item) => [
      item.sender_id,
      item.receiver_id,
    ]),
  );
  const myStudent = member.student;
  return ok<BuddyProfile[]>(candidatesResult)
    .filter((item) => !dismissed.has(item.user_id) && !pending.has(item.user_id))
    .map((item) => {
      const student = buddyStudent(item.profile);
      const topics = overlap(mine.topics, item.topics);
      const availability = overlap(mine.availability, item.availability);
      const modes = overlap(mine.study_modes, item.study_modes);
      const languages = overlap(mine.languages, item.languages);
      let score =
        Math.min(45, topics.length * 15) +
        Math.min(20, availability.length * 7) +
        Math.min(15, modes.length * 15) +
        Math.min(10, languages.length * 5);
      if (myStudent?.department_id && myStudent.department_id === student?.department_id)
        score += 10;
      const reasons = [
        topics.length ? `${topics.length} shared topic${topics.length > 1 ? "s" : ""}` : null,
        availability.length ? "Available at the same time" : null,
        modes[0] ? `Both prefer ${modes[0].replace("_", " ")}` : null,
        myStudent?.department_id === student?.department_id ? "Same department" : null,
      ].filter(Boolean) as string[];
      return { ...item, score: Math.min(score, 100), reasons };
    })
    .sort((a, b) => b.score - a.score);
}

export async function listBuddyRequests(userId: string): Promise<BuddyRequest[]> {
  return ok(
    await db
      .from("study_buddy_requests")
      .select(
        "*,sender:profiles!study_buddy_requests_sender_id_fkey(id,full_name,avatar_path,account_type),receiver:profiles!study_buddy_requests_receiver_id_fkey(id,full_name,avatar_path,account_type)",
      )
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false }),
  );
}

export async function sendBuddyRequest(userId: string, receiverId: string, message: string) {
  ok(
    await db
      .from("study_buddy_requests")
      .insert({ sender_id: userId, receiver_id: receiverId, message: message.trim() || null }),
  );
}

export async function respondToBuddyRequest(
  request: BuddyRequest,
  action: "accepted" | "declined" | "cancelled" | "blocked",
) {
  ok(
    await db
      .from("study_buddy_requests")
      .update({ status: action, responded_at: new Date().toISOString() })
      .eq("id", request.id)
      .eq("status", "pending"),
  );
  if (action === "accepted") return startDirectConversation(request.sender_id);
  return null;
}

export async function dismissBuddy(userId: string, dismissedUserId: string) {
  ok(
    await db
      .from("study_buddy_dismissals")
      .upsert({ user_id: userId, dismissed_user_id: dismissedUserId }),
  );
}
