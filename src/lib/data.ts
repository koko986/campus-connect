import type { Tables } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

export type University = Tables<"universities"> & {
  campuses: Pick<Tables<"campuses">, "id" | "name" | "city" | "address">[];
  departments: (Pick<Tables<"departments">, "id" | "name"> & {
    programs: Pick<Tables<"programs">, "id" | "name" | "degree_level">[];
  })[];
  programs: Pick<Tables<"programs">, "id" | "name" | "degree_level">[];
};

export type CommunityProfile = Pick<
  Tables<"profiles">,
  "id" | "full_name" | "avatar_path" | "account_type"
>;

export type FeedPost = Tables<"posts"> & {
  author: CommunityProfile | null;
  comments: { id: string }[];
  post_likes: { user_id: string }[];
  university: Pick<Tables<"universities">, "id" | "name" | "short_name"> | null;
};

export type CommunityQuestion = Tables<"questions"> & {
  answers: { count: number }[];
  author: CommunityProfile | null;
  question_tags: Pick<Tables<"question_tags">, "tag">[];
  university: Pick<Tables<"universities">, "id" | "name" | "short_name"> | null;
};

export type Conversation = {
  id: string;
  lastMessageAt: string;
  lastReadAt: string | null;
  members: CommunityProfile[];
  messages: Tables<"messages">[];
};

export type StudentContact = {
  department: string | null;
  profile: CommunityProfile;
  university: string;
};

function unwrap<T>(result: { data: T | null; error: { message: string } | null }) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export async function listUniversities(): Promise<University[]> {
  const result = await supabase
    .from("universities")
    .select(
      "*, departments(id,name,programs(id,name,degree_level)), campuses(id,name,city,address), programs(id,name,degree_level)",
    )
    .eq("is_published", true)
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
    .single();
  return unwrap(result) as University;
}

export async function listPosts(universityId?: string): Promise<FeedPost[]> {
  let query = supabase
    .from("posts")
    .select(
      "*, author:profiles!posts_author_id_fkey(id,full_name,avatar_path,account_type), university:universities(id,name,short_name), post_likes(user_id), comments(id)",
    )
    .order("created_at", { ascending: false })
    .limit(50);
  if (universityId) query = query.eq("university_id", universityId);
  const result = await query;
  return (unwrap(result) ?? []) as unknown as FeedPost[];
}

export async function createPost(input: {
  authorId: string;
  body: string;
  topic?: string;
  universityId?: string;
}) {
  return unwrap(
    await supabase
      .from("posts")
      .insert({
        author_id: input.authorId,
        body: input.body.trim(),
        topic: input.topic?.trim() || null,
        university_id: input.universityId || null,
      })
      .select()
      .single(),
  );
}

export async function setPostLiked(postId: string, userId: string, liked: boolean) {
  const result = liked
    ? await supabase.from("post_likes").insert({ post_id: postId, user_id: userId })
    : await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
  if (result.error) throw result.error;
}

export async function listQuestions(): Promise<CommunityQuestion[]> {
  const result = await supabase
    .from("questions")
    .select(
      "*, author:profiles!questions_author_id_fkey(id,full_name,avatar_path,account_type), university:universities(id,name,short_name), question_tags(tag), answers(count)",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  return (unwrap(result) ?? []) as unknown as CommunityQuestion[];
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
    const { error } = await supabase
      .from("question_tags")
      .insert(input.tags.map((tag) => ({ question_id: question.id, tag })));
    if (error) throw error;
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
  const result = saved
    ? await supabase
        .from("saved_universities")
        .insert({ university_id: universityId, user_id: userId })
    : await supabase
        .from("saved_universities")
        .delete()
        .eq("university_id", universityId)
        .eq("user_id", userId);
  if (result.error) throw result.error;
}

export async function getProfileDetails(userId: string) {
  const [profileResult, studentResult, prospectiveResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase
      .from("student_profiles")
      .select("*, universities(name), departments(name), programs(name)")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("prospective_profiles").select("*").eq("user_id", userId).maybeSingle(),
  ]);
  if (profileResult.error) throw profileResult.error;
  if (studentResult.error) throw studentResult.error;
  if (prospectiveResult.error) throw prospectiveResult.error;
  return {
    profile: profileResult.data,
    student: studentResult.data,
    prospective: prospectiveResult.data,
  };
}

export async function updateProfile(
  userId: string,
  changes: Pick<Tables<"profiles">, "full_name" | "bio" | "is_public">,
) {
  return unwrap(await supabase.from("profiles").update(changes).eq("id", userId).select().single());
}

export async function listConversations(userId: string): Promise<Conversation[]> {
  const membershipResult = await supabase
    .from("conversation_members")
    .select("conversation_id,last_read_at")
    .eq("user_id", userId);
  const memberships = unwrap(membershipResult) ?? [];
  if (!memberships.length) return [];
  const ids = memberships.map((item) => item.conversation_id);

  const [conversationResult, memberResult, messageResult] = await Promise.all([
    supabase.from("conversations").select("id,last_message_at").in("id", ids),
    supabase
      .from("conversation_members")
      .select("conversation_id,profiles(id,full_name,avatar_path,account_type)")
      .in("conversation_id", ids),
    supabase
      .from("messages")
      .select("*")
      .in("conversation_id", ids)
      .order("created_at", { ascending: true }),
  ]);
  if (conversationResult.error) throw conversationResult.error;
  if (memberResult.error) throw memberResult.error;
  if (messageResult.error) throw messageResult.error;

  const memberRows = memberResult.data as unknown as {
    conversation_id: string;
    profiles: CommunityProfile | null;
  }[];
  return conversationResult.data
    .map((conversation) => ({
      id: conversation.id,
      lastMessageAt: conversation.last_message_at,
      lastReadAt:
        memberships.find((item) => item.conversation_id === conversation.id)?.last_read_at ?? null,
      members: memberRows.flatMap((item) =>
        item.conversation_id === conversation.id && item.profiles ? [item.profiles] : [],
      ),
      messages: messageResult.data.filter((message) => message.conversation_id === conversation.id),
    }))
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
}

export async function sendMessage(conversationId: string, senderId: string, body: string) {
  return unwrap(
    await supabase
      .from("messages")
      .insert({ body: body.trim(), conversation_id: conversationId, sender_id: senderId })
      .select()
      .single(),
  );
}

export async function listStudentContacts(currentUserId: string): Promise<StudentContact[]> {
  const result = await supabase
    .from("student_profiles")
    .select(
      "profiles(id,full_name,avatar_path,account_type,is_public), universities(name), departments(name)",
    )
    .neq("user_id", currentUserId)
    .eq("profiles.is_public", true)
    .order("verified_at", { ascending: false, nullsFirst: false });
  if (result.error) throw result.error;
  const rows = result.data as unknown as {
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
  const { data, error } = await supabase.rpc("start_direct_conversation", {
    other_user_id: otherUserId,
  });
  if (error) throw error;
  return data;
}
