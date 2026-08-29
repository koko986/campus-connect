import type { RealtimeChannel } from "@supabase/supabase-js";

import type { Enums, Tables } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

/**
 * The email column is revoked for signed-in members, so every profile read has
 * to name its columns. Selecting "*" would fail the column grant.
 */
const PROFILE_COLUMNS = "id,full_name,avatar_path,account_type,bio,is_public,created_at";
const PROFILE_BASIC = "id,full_name,avatar_path,account_type";
const PROFILE_SUMMARY = `${PROFILE_BASIC},student_profiles(verification_status)`;

const POST_COLUMNS =
  "id,author_id,university_id,body,topic,image_path,scope,like_count,comment_count,created_at,updated_at";
const POST_RELATIONS = `author:profiles!posts_author_id_fkey(${PROFILE_SUMMARY}),university:universities(id,name,short_name)`;

export const FEED_PAGE_SIZE = 10;
export const MESSAGE_PAGE_SIZE = 30;
export const UNIVERSITY_PAGE_SIZE = 18;
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const POST_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const UNIVERSITY_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type FeedSort = "best" | "newest";
export type PostScope = Enums<"post_scope">;

export type University = Tables<"universities"> & {
  campuses: Pick<Tables<"campuses">, "id" | "name" | "city" | "address">[];
  departments: (Pick<Tables<"departments">, "id" | "name"> & {
    programs: Pick<Tables<"programs">, "id" | "name" | "degree_level">[];
  })[];
  programs: Pick<Tables<"programs">, "id" | "name" | "degree_level">[];
};

export type UniversitySummary = Pick<
  Tables<"universities">,
  | "id"
  | "name"
  | "short_name"
  | "city"
  | "region"
  | "university_type"
  | "description"
  | "cover_image_path"
  | "cover_image_credit"
  | "cover_image_source_url"
  | "cover_image_license"
> & {
  departments: { count: number }[];
};

export type UniversitySummaryPage = {
  nextPage: number | null;
  universities: UniversitySummary[];
};

export type UniversityFilters = {
  regions: string[];
  types: Enums<"university_type">[];
};

export type RecommendedUniversity = UniversitySummary & {
  matchReasons: string[];
  score: number;
};

type VerificationEmbed = Pick<Tables<"student_profiles">, "verification_status">;

export type CommunityProfile = Pick<
  Tables<"profiles">,
  "id" | "full_name" | "avatar_path" | "account_type"
> & {
  // PostgREST returns this one-to-one embed as an object, but older rows with
  // no student record come back null.
  student_profiles?: VerificationEmbed | VerificationEmbed[] | null;
};

export function isVerifiedStudent(profile: CommunityProfile | null | undefined) {
  const embed = profile?.student_profiles;
  const record = Array.isArray(embed) ? embed[0] : embed;
  return record?.verification_status === "verified";
}

export type UniversityTag = Pick<Tables<"universities">, "id" | "name" | "short_name">;

export type FeedPost = Pick<
  Tables<"posts">,
  | "id"
  | "author_id"
  | "university_id"
  | "body"
  | "topic"
  | "image_path"
  | "scope"
  | "like_count"
  | "comment_count"
  | "created_at"
  | "updated_at"
> & {
  author: CommunityProfile | null;
  liked: boolean;
  saved: boolean;
  university: UniversityTag | null;
};

export type FeedPage = { nextPage: number | null; posts: FeedPost[] };

export type PostComment = Pick<
  Tables<"comments">,
  | "id"
  | "post_id"
  | "author_id"
  | "parent_comment_id"
  | "body"
  | "vote_count"
  | "reply_count"
  | "deleted_at"
  | "created_at"
> & {
  author: CommunityProfile | null;
  voted: boolean;
};

export type CommentNode = PostComment & { replies: CommentNode[] };

export type CommunityQuestion = Tables<"questions"> & {
  answers: { count: number }[];
  author: CommunityProfile | null;
  question_tags: Pick<Tables<"question_tags">, "tag">[];
  university: UniversityTag | null;
};

export type MemberProfile = {
  profile: Pick<
    Tables<"profiles">,
    "id" | "full_name" | "avatar_path" | "account_type" | "bio" | "is_public" | "created_at"
  >;
  prospective: Tables<"prospective_profiles"> | null;
  student:
    | (Tables<"student_profiles"> & {
        campus: { name: string } | null;
        department: { name: string } | null;
        program: { name: string } | null;
        university: UniversityTag | null;
      })
    | null;
};

export type ConversationSummary = {
  id: string;
  conversationType: Enums<"conversation_type">;
  lastMessageAt: string;
  lastReadAt: string | null;
  memberCount: number;
  members: CommunityProfile[];
  title: string | null;
  universityId: string | null;
  unreadCount: number;
};

export type DiscoverableGroup = {
  conversationId: string | null;
  joined: boolean;
  memberCount: number;
  university: UniversityTag;
};

export type ConversationMessage = Tables<"messages"> & { sender: CommunityProfile | null };

export type StudentContact = {
  department: string | null;
  profile: CommunityProfile;
  university: string;
};

function unwrap<T>(result: { data: T | null; error: { message: string } | null }) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

function assertOk(result: { error: { message: string } | null }) {
  if (result.error) throw new Error(result.error.message);
}

/**
 * Storage columns hold bucket relative paths, but older rows and seed data hold
 * absolute URLs. Both have to render.
 */
function publicUrl(bucket: "avatars" | "post-media" | "university-media", path: string | null) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export function avatarUrl(path: string | null) {
  return publicUrl("avatars", path);
}

export function postImageUrl(path: string | null) {
  return publicUrl("post-media", path);
}

export function universityImageUrl(path: string | null) {
  return publicUrl("university-media", path);
}

/** Named rather than worded, so the caller can report it in the member's language. */
export type ImageProblem = { reason: "type" } | { reason: "size"; megabytes: number };

export function validateImage(file: File, maxBytes: number): ImageProblem | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return { reason: "type" };
  }
  if (file.size > maxBytes) {
    return { reason: "size", megabytes: Math.round(maxBytes / (1024 * 1024)) };
  }
  return null;
}

function fileExtension(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

async function uploadImage(
  bucket: "avatars" | "post-media" | "university-media",
  userId: string,
  file: File,
) {
  const path = `${userId}/${crypto.randomUUID()}.${fileExtension(file)}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

export function uploadAvatar(userId: string, file: File) {
  return uploadImage("avatars", userId, file);
}

export function uploadPostImage(userId: string, file: File) {
  return uploadImage("post-media", userId, file);
}

export async function submitUniversityPhoto(options: {
  caption: string;
  file: File;
  universityId: string;
  userId: string;
}) {
  const path = await uploadImage("university-media", options.userId, options.file);
  const result = await supabase.from("university_photos").insert({
    caption: options.caption.trim() || null,
    image_path: path,
    status: "PENDING",
    university_id: options.universityId,
    uploader_id: options.userId,
  });
  if (result.error) {
    await supabase.storage.from("university-media").remove([path]);
    throw new Error(result.error.message);
  }
}

export async function listUniversities(): Promise<University[]> {
  const result = await supabase
    .from("universities")
    .select(
      "*, departments(id,name,programs(id,name,degree_level)), campuses(id,name,city,address), programs(id,name,degree_level)",
    )
    .eq("is_published", true)
    .is("archived_at", null)
    .order("name");
  return (unwrap(result) ?? []) as University[];
}

export async function getUniversity(id: string): Promise<University> {
  const result = await supabase
    .from("universities")
    .select(
      "*, departments(id,name,programs(id,name,degree_level)), campuses(id,name,city,address), programs(id,name,degree_level)",
    )
    .eq("id", id)
    .eq("is_published", true)
    .is("archived_at", null)
    .single();
  return unwrap(result) as University;
}

const UNIVERSITY_SUMMARY_COLUMNS =
  "id,name,short_name,city,region,university_type,description,cover_image_path,cover_image_credit,cover_image_source_url,cover_image_license,departments(count)";

export async function listUniversitySummaries(options: {
  page: number;
  region?: string | undefined;
  search?: string | undefined;
  type?: Enums<"university_type"> | undefined;
}): Promise<UniversitySummaryPage> {
  const from = options.page * UNIVERSITY_PAGE_SIZE;
  const to = from + UNIVERSITY_PAGE_SIZE - 1;
  let query = supabase
    .from("universities")
    .select(UNIVERSITY_SUMMARY_COLUMNS, { count: "exact" })
    .eq("is_published", true)
    .is("archived_at", null)
    .order("name")
    .range(from, to);

  if (options.region) query = query.eq("region", options.region);
  if (options.type) query = query.eq("university_type", options.type);
  const search = options.search?.trim().replace(/[,%()]/g, " ");
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,short_name.ilike.%${search}%,city.ilike.%${search}%,region.ilike.%${search}%`,
    );
  }

  const result = await query;
  const universities = (unwrap(result) ?? []) as unknown as UniversitySummary[];
  return {
    universities,
    nextPage: from + universities.length < (result.count ?? 0) ? options.page + 1 : null,
  };
}

export async function listUniversityFilters(): Promise<UniversityFilters> {
  const result = await supabase
    .from("universities")
    .select("region,university_type")
    .eq("is_published", true)
    .is("archived_at", null);
  const rows = unwrap(result) ?? [];
  return {
    regions: [...new Set(rows.flatMap((row) => (row.region ? [row.region] : [])))].sort(),
    types: [...new Set(rows.map((row) => row.university_type))].sort(),
  };
}

export async function listFieldOfStudyOptions() {
  const [departments, programs] = await Promise.all([
    supabase.from("departments").select("name").order("name"),
    supabase.from("programs").select("name").order("name"),
  ]);
  assertOk(departments);
  assertOk(programs);
  return [
    ...new Set(
      [...(departments.data ?? []), ...(programs.data ?? [])]
        .map((row) => row.name.trim())
        .filter(Boolean),
    ),
  ].sort((left, right) => left.localeCompare(right));
}

export async function listRecommendedUniversities(
  userId: string,
): Promise<RecommendedUniversity[]> {
  const preferences = unwrap(
    await supabase
      .from("prospective_profiles")
      .select("preferred_field,preferred_city,preferred_degree_level")
      .eq("user_id", userId)
      .maybeSingle(),
  ) as Pick<
    Tables<"prospective_profiles">,
    "preferred_city" | "preferred_degree_level" | "preferred_field"
  > | null;
  if (
    !preferences?.preferred_field &&
    !preferences?.preferred_city &&
    !preferences?.preferred_degree_level
  ) {
    return [];
  }

  const ranked = unwrap(
    await supabase.rpc("recommend_universities", {
      p_limit: 6,
      ...(preferences.preferred_city ? { p_preferred_city: preferences.preferred_city } : {}),
      ...(preferences.preferred_degree_level
        ? { p_preferred_degree_level: preferences.preferred_degree_level }
        : {}),
      ...(preferences.preferred_field ? { p_preferred_field: preferences.preferred_field } : {}),
    }),
  );
  if (!ranked?.length) return [];

  const summaries = unwrap(
    await supabase
      .from("universities")
      .select(UNIVERSITY_SUMMARY_COLUMNS)
      .in(
        "id",
        ranked.map((item) => item.university_id),
      ),
  ) as unknown as UniversitySummary[] | null;
  const byId = new Map((summaries ?? []).map((university) => [university.id, university]));
  return ranked.flatMap((item) => {
    const university = byId.get(item.university_id);
    return university
      ? [
          {
            ...university,
            matchReasons: item.match_reasons,
            score: item.score,
          },
        ]
      : [];
  });
}

/**
 * Likes and saves are private to each member, so they are read separately for
 * the signed-in viewer instead of embedding every other member's rows.
 */
async function attachViewerState(
  rows: Omit<FeedPost, "liked" | "saved">[],
  viewerId: string,
): Promise<FeedPost[]> {
  if (!rows.length) return [];
  const ids = rows.map((row) => row.id);
  const [likes, saves] = await Promise.all([
    supabase.from("post_likes").select("post_id").eq("user_id", viewerId).in("post_id", ids),
    supabase.from("saved_posts").select("post_id").eq("user_id", viewerId).in("post_id", ids),
  ]);
  assertOk(likes);
  assertOk(saves);
  const liked = new Set((likes.data ?? []).map((row) => row.post_id));
  const saved = new Set((saves.data ?? []).map((row) => row.post_id));
  return rows.map((row) => ({ ...row, liked: liked.has(row.id), saved: saved.has(row.id) }));
}

export async function listFeedPosts(options: {
  page: number;
  sort: FeedSort;
  universityId?: string | undefined;
  viewerId: string;
}): Promise<FeedPage> {
  const from = options.page * FEED_PAGE_SIZE;
  let query = supabase
    .from("posts")
    .select(`${POST_COLUMNS},${POST_RELATIONS}`)
    .eq("scope", "COMMUNITY")
    .range(from, from + FEED_PAGE_SIZE);
  query =
    options.sort === "best"
      ? query.order("like_count", { ascending: false }).order("created_at", { ascending: false })
      : query.order("created_at", { ascending: false });
  if (options.universityId) query = query.eq("university_id", options.universityId);

  const rows = (unwrap(await query) ?? []) as unknown as Omit<FeedPost, "liked" | "saved">[];
  const hasMore = rows.length > FEED_PAGE_SIZE;
  const posts = await attachViewerState(rows.slice(0, FEED_PAGE_SIZE), options.viewerId);
  return { nextPage: hasMore ? options.page + 1 : null, posts };
}

export async function getPost(postId: string, viewerId: string): Promise<FeedPost> {
  const row = unwrap(
    await supabase
      .from("posts")
      .select(`${POST_COLUMNS},${POST_RELATIONS}`)
      .eq("id", postId)
      .single(),
  ) as unknown as Omit<FeedPost, "liked" | "saved">;
  const [post] = await attachViewerState([row], viewerId);
  if (!post) throw new Error("Post not found.");
  return post;
}

/**
 * Profile-only posts are hidden from the home and university feeds, so an
 * author's own page is the one place they surface.
 */
export async function listProfilePosts(authorId: string, viewerId: string): Promise<FeedPost[]> {
  const rows = (unwrap(
    await supabase
      .from("posts")
      .select(`${POST_COLUMNS},${POST_RELATIONS}`)
      .eq("author_id", authorId)
      .order("created_at", { ascending: false })
      .limit(50),
  ) ?? []) as unknown as Omit<FeedPost, "liked" | "saved">[];
  return attachViewerState(rows, viewerId);
}

export async function listSavedPosts(viewerId: string): Promise<FeedPost[]> {
  const saved = unwrap(
    await supabase
      .from("saved_posts")
      .select("post_id")
      .eq("user_id", viewerId)
      .order("created_at", { ascending: false })
      .limit(50),
  );
  const ids = (saved ?? []).map((row) => row.post_id);
  if (!ids.length) return [];
  const rows = (unwrap(
    await supabase
      .from("posts")
      .select(`${POST_COLUMNS},${POST_RELATIONS}`)
      .in("id", ids)
      .order("created_at", { ascending: false }),
  ) ?? []) as unknown as Omit<FeedPost, "liked" | "saved">[];
  return attachViewerState(rows, viewerId);
}

export async function createPost(input: {
  authorId: string;
  body: string;
  imagePath?: string | null | undefined;
  scope: PostScope;
  topic?: string | undefined;
  universityId?: string | undefined;
}) {
  if (input.scope === "COMMUNITY" && !input.universityId) {
    throw new Error("Community posts need one university tag.");
  }
  return unwrap(
    await supabase
      .from("posts")
      .insert({
        author_id: input.authorId,
        body: input.body.trim(),
        image_path: input.imagePath ?? null,
        scope: input.scope,
        topic: input.topic?.trim() || null,
        university_id: input.universityId || null,
      })
      .select("id")
      .single(),
  );
}

export async function deletePost(postId: string) {
  const deleted = unwrap(await supabase.rpc("soft_delete_post", { target_post_id: postId }));
  if (!deleted) throw new Error("This post could not be deleted.");
}

export async function setPostLiked(postId: string, userId: string, liked: boolean) {
  assertOk(
    liked
      ? await supabase.from("post_likes").insert({ post_id: postId, user_id: userId })
      : await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId),
  );
}

export async function setPostSaved(postId: string, userId: string, saved: boolean) {
  assertOk(
    saved
      ? await supabase.from("saved_posts").insert({ post_id: postId, user_id: userId })
      : await supabase.from("saved_posts").delete().eq("post_id", postId).eq("user_id", userId),
  );
}

export async function listComments(
  postId: string,
  viewerId: string,
  sort: FeedSort,
): Promise<CommentNode[]> {
  let query = supabase
    .from("comments")
    .select(
      `id,post_id,author_id,parent_comment_id,body,vote_count,reply_count,deleted_at,created_at,author:profiles!comments_author_id_fkey(${PROFILE_SUMMARY})`,
    )
    .eq("post_id", postId)
    .limit(500);
  query =
    sort === "best"
      ? query.order("vote_count", { ascending: false }).order("created_at")
      : query.order("created_at");

  const rows = (unwrap(await query) ?? []) as unknown as Omit<PostComment, "voted">[];
  if (!rows.length) return [];

  const votes = await supabase
    .from("comment_votes")
    .select("comment_id")
    .eq("user_id", viewerId)
    .in(
      "comment_id",
      rows.map((row) => row.id),
    );
  assertOk(votes);
  const voted = new Set((votes.data ?? []).map((row) => row.comment_id));

  const nodes = new Map<string, CommentNode>();
  for (const row of rows) {
    nodes.set(row.id, { ...row, voted: voted.has(row.id), replies: [] });
  }
  const roots: CommentNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parent_comment_id ? nodes.get(node.parent_comment_id) : null;
    if (parent) parent.replies.push(node);
    else roots.push(node);
  }
  return roots;
}

export async function createComment(input: {
  authorId: string;
  body: string;
  parentCommentId?: string | null | undefined;
  postId: string;
}) {
  return unwrap(
    await supabase
      .from("comments")
      .insert({
        author_id: input.authorId,
        body: input.body.trim(),
        parent_comment_id: input.parentCommentId ?? null,
        post_id: input.postId,
      })
      .select("id")
      .single(),
  );
}

export async function deleteComment(commentId: string) {
  const deleted = unwrap(
    await supabase.rpc("soft_delete_comment", { target_comment_id: commentId }),
  );
  if (!deleted) throw new Error("This comment could not be deleted.");
}

export async function setCommentVoted(commentId: string, userId: string, voted: boolean) {
  assertOk(
    voted
      ? await supabase.from("comment_votes").insert({ comment_id: commentId, user_id: userId })
      : await supabase
          .from("comment_votes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", userId),
  );
}

export async function listQuestions(
  universityId?: string | undefined,
): Promise<CommunityQuestion[]> {
  let query = supabase
    .from("questions")
    .select(
      `*, author:profiles!questions_author_id_fkey(${PROFILE_SUMMARY}), university:universities(id,name,short_name), question_tags(tag), answers(count)`,
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (universityId) query = query.eq("university_id", universityId);
  return (unwrap(await query) ?? []) as unknown as CommunityQuestion[];
}

export async function createQuestion(input: {
  authorId: string;
  body: string;
  tags: string[];
  title: string;
  universityId?: string;
}) {
  const question = unwrap(
    await supabase
      .from("questions")
      .insert({
        author_id: input.authorId,
        body: input.body.trim(),
        title: input.title.trim(),
        university_id: input.universityId || null,
      })
      .select()
      .single(),
  ) as Tables<"questions"> | null;
  if (!question) throw new Error("The question was not created.");
  if (input.tags.length) {
    assertOk(
      await supabase
        .from("question_tags")
        .insert(input.tags.map((tag) => ({ question_id: question.id, tag }))),
    );
  }
  return question;
}

export async function listSavedUniversities(userId: string): Promise<University[]> {
  const result = await supabase
    .from("saved_universities")
    .select(
      "universities(*, departments(id,name,programs(id,name,degree_level)), campuses(id,name,city,address), programs(id,name,degree_level))",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  const rows = (unwrap(result) ?? []) as unknown as { universities: University | null }[];
  return rows.flatMap((row) => (row.universities ? [row.universities] : []));
}

export async function setUniversitySaved(universityId: string, userId: string, saved: boolean) {
  assertOk(
    saved
      ? await supabase
          .from("saved_universities")
          .insert({ university_id: universityId, user_id: userId })
      : await supabase
          .from("saved_universities")
          .delete()
          .eq("university_id", universityId)
          .eq("user_id", userId),
  );
}

export async function getMemberProfile(userId: string): Promise<MemberProfile> {
  const [profileResult, studentResult, prospectiveResult] = await Promise.all([
    supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", userId).single(),
    supabase
      .from("student_profiles")
      .select(
        "*, university:universities(id,name,short_name), campus:campuses(name), department:departments(name), program:programs(name)",
      )
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("prospective_profiles").select("*").eq("user_id", userId).maybeSingle(),
  ]);
  assertOk(profileResult);
  assertOk(studentResult);
  assertOk(prospectiveResult);
  return {
    profile: profileResult.data as MemberProfile["profile"],
    student: studentResult.data as MemberProfile["student"],
    prospective: prospectiveResult.data as MemberProfile["prospective"],
  };
}

export async function updateProfile(
  userId: string,
  changes: Partial<Pick<Tables<"profiles">, "avatar_path" | "bio" | "full_name" | "is_public">>,
) {
  return unwrap(
    await supabase
      .from("profiles")
      .update(changes)
      .eq("id", userId)
      .select(PROFILE_COLUMNS)
      .single(),
  );
}

// university_id is required on the row, so it is required here too.
export async function updateStudentProfile(
  userId: string,
  changes: Pick<
    Tables<"student_profiles">,
    "academic_year" | "campus_id" | "department_id" | "program_id" | "university_id"
  >,
) {
  assertOk(
    await supabase
      .from("student_profiles")
      .upsert({ user_id: userId, ...changes }, { onConflict: "user_id" }),
  );
}

export async function updateProspectiveProfile(
  userId: string,
  changes: Partial<
    Pick<
      Tables<"prospective_profiles">,
      "preferences" | "preferred_city" | "preferred_degree_level" | "preferred_field"
    >
  >,
) {
  assertOk(
    await supabase
      .from("prospective_profiles")
      .upsert({ user_id: userId, ...changes }, { onConflict: "user_id" }),
  );
}

async function listMemberships(userId: string) {
  const rows = unwrap(
    await supabase
      .from("conversation_members")
      .select("conversation_id,last_read_at")
      .eq("user_id", userId),
  );
  return rows ?? [];
}

/**
 * PostgREST cannot correlate a count per conversation, so unread totals are
 * requested as one filter group and tallied here.
 */
async function countUnread(
  memberships: { conversation_id: string; last_read_at: string | null }[],
  userId: string,
) {
  const unread = new Map<string, number>();
  if (!memberships.length) return unread;
  const groups = memberships
    .slice(0, 50)
    .map(
      (item) =>
        `and(conversation_id.eq.${item.conversation_id},created_at.gt."${item.last_read_at ?? new Date(0).toISOString()}")`,
    );
  const rows = unwrap(
    await supabase
      .from("messages")
      .select("conversation_id")
      .neq("sender_id", userId)
      .or(groups.join(",")),
  );
  for (const row of rows ?? []) {
    unread.set(row.conversation_id, (unread.get(row.conversation_id) ?? 0) + 1);
  }
  return unread;
}

export async function listConversations(userId: string): Promise<ConversationSummary[]> {
  const memberships = await listMemberships(userId);
  if (!memberships.length) return [];
  const ids = memberships.map((item) => item.conversation_id);

  const [conversationResult, memberResult, unread] = await Promise.all([
    supabase
      .from("conversations")
      .select("id,conversation_type,last_message_at,title,university_id,member_count")
      .in("id", ids),
    supabase
      .from("conversation_members")
      .select(`conversation_id,profiles(${PROFILE_SUMMARY})`)
      .in("conversation_id", ids)
      .limit(200),
    countUnread(memberships, userId),
  ]);
  assertOk(conversationResult);
  assertOk(memberResult);

  const memberRows = (memberResult.data ?? []) as unknown as {
    conversation_id: string;
    profiles: CommunityProfile | null;
  }[];

  return (conversationResult.data ?? [])
    .map((conversation) => ({
      id: conversation.id,
      conversationType: conversation.conversation_type,
      lastMessageAt: conversation.last_message_at,
      lastReadAt:
        memberships.find((item) => item.conversation_id === conversation.id)?.last_read_at ?? null,
      memberCount: conversation.member_count,
      members: memberRows.flatMap((item) =>
        item.conversation_id === conversation.id && item.profiles ? [item.profiles] : [],
      ),
      title: conversation.title,
      universityId: conversation.university_id,
      unreadCount: unread.get(conversation.id) ?? 0,
    }))
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
}

/**
 * Older pages are requested with a "created before" cursor so new arrivals at
 * the bottom never shift the window.
 */
export async function listMessages(
  conversationId: string,
  before?: string,
): Promise<{ messages: ConversationMessage[]; olderCursor: string | null }> {
  let query = supabase
    .from("messages")
    .select(`*, sender:profiles!messages_sender_id_fkey(${PROFILE_SUMMARY})`)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(MESSAGE_PAGE_SIZE + 1);
  if (before) query = query.lt("created_at", before);

  const rows = (unwrap(await query) ?? []) as unknown as ConversationMessage[];
  const hasOlder = rows.length > MESSAGE_PAGE_SIZE;
  const page = rows.slice(0, MESSAGE_PAGE_SIZE).reverse();
  return { messages: page, olderCursor: hasOlder ? (page[0]?.created_at ?? null) : null };
}

export async function sendMessage(conversationId: string, senderId: string, body: string) {
  return unwrap(
    await supabase
      .from("messages")
      .insert({ body: body.trim(), conversation_id: conversationId, sender_id: senderId })
      .select(`*, sender:profiles!messages_sender_id_fkey(${PROFILE_SUMMARY})`)
      .single(),
  ) as unknown as ConversationMessage;
}

export async function markConversationRead(conversationId: string, userId: string) {
  assertOk(
    await supabase
      .from("conversation_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId),
  );
}

export async function listUniversityGroups(userId: string): Promise<DiscoverableGroup[]> {
  const [universityResult, groupResult, membershipResult] = await Promise.all([
    supabase
      .from("universities")
      .select("id,name,short_name")
      .eq("is_published", true)
      .is("archived_at", null)
      .order("name"),
    supabase
      .from("conversations")
      .select("id,university_id,member_count")
      .eq("conversation_type", "UNIVERSITY_GROUP"),
    supabase.from("conversation_members").select("conversation_id").eq("user_id", userId),
  ]);
  assertOk(universityResult);
  assertOk(groupResult);
  assertOk(membershipResult);

  const groups = new Map(
    (groupResult.data ?? []).flatMap((row) =>
      row.university_id ? [[row.university_id, row] as const] : [],
    ),
  );
  const joined = new Set((membershipResult.data ?? []).map((row) => row.conversation_id));

  return (universityResult.data ?? []).map((university) => {
    const group = groups.get(university.id);
    return {
      conversationId: group?.id ?? null,
      joined: group ? joined.has(group.id) : false,
      memberCount: group?.member_count ?? 0,
      university,
    };
  });
}

export async function joinUniversityGroup(universityId: string) {
  return unwrap(
    await supabase.rpc("join_university_group", { target_university_id: universityId }),
  );
}

export async function leaveConversation(conversationId: string, userId: string) {
  assertOk(
    await supabase
      .from("conversation_members")
      .delete()
      .eq("conversation_id", conversationId)
      .eq("user_id", userId),
  );
}

export async function listStudentContacts(currentUserId: string): Promise<StudentContact[]> {
  const result = await supabase
    .from("student_profiles")
    .select(`profiles(${PROFILE_BASIC},is_public), universities(name), departments(name)`)
    .neq("user_id", currentUserId)
    .eq("profiles.is_public", true)
    .order("verified_at", { ascending: false, nullsFirst: false });
  assertOk(result);
  const rows = (result.data ?? []) as unknown as {
    departments: { name: string } | null;
    profiles: (CommunityProfile & { is_public: boolean }) | null;
    universities: { name: string } | null;
  }[];
  return rows.flatMap((row) =>
    row.profiles && row.universities
      ? [
          {
            profile: row.profiles,
            university: row.universities.name,
            department: row.departments?.name ?? null,
          },
        ]
      : [],
  );
}

export async function startDirectConversation(otherUserId: string) {
  return unwrap(await supabase.rpc("start_direct_conversation", { other_user_id: otherUserId }));
}

export function subscribeToConversation(
  conversationId: string,
  onMessage: (message: Tables<"messages">) => void,
): RealtimeChannel {
  return supabase
    .channel(`conversation:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onMessage(payload.new as Tables<"messages">),
    )
    .subscribe();
}

export function subscribeToConversationList(userId: string, onChange: () => void): RealtimeChannel {
  return supabase
    .channel(`conversation-list:${userId}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, onChange)
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "conversations" }, onChange)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "conversation_members",
        filter: `user_id=eq.${userId}`,
      },
      onChange,
    )
    .subscribe();
}

export function unsubscribe(channel: RealtimeChannel) {
  void supabase.removeChannel(channel);
}
