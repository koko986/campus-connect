import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap, MessageSquare } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { PostCard, UserAvatar, VerifiedBadge } from "@/components/community";
import { Empty, Failure, Loading } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import type { FeedPost, MemberProfile } from "@/lib/data";
import { getMemberProfile, listProfilePosts, startDirectConversation } from "@/lib/data";
import { accountTypeKey, formatDate } from "@/lib/format";
import { useLanguage, useT } from "@/lib/i18n";

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value}</dd>
    </div>
  );
}

function StudentDetails({ student }: { student: NonNullable<MemberProfile["student"]> }) {
  const t = useT();
  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Detail label={t("field.campus")} value={student.campus?.name} />
      <Detail label={t("field.department")} value={student.department?.name} />
      <Detail label={t("field.program")} value={student.program?.name} />
      <Detail
        label={t("field.academicYear")}
        value={student.academic_year ? t("profile.year", { year: student.academic_year }) : null}
      />
    </dl>
  );
}

function ProspectiveDetails({
  prospective,
}: {
  prospective: NonNullable<MemberProfile["prospective"]>;
}) {
  const t = useT();
  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Detail label={t("field.preferredField")} value={prospective.preferred_field} />
      <Detail label={t("field.preferredCity")} value={prospective.preferred_city} />
      <Detail label={t("field.degreeLevel")} value={prospective.preferred_degree_level} />
      <Detail label={t("field.interests")} value={prospective.preferences} />
    </dl>
  );
}

function PostSection({
  title,
  description,
  posts,
  viewerId,
}: {
  title: string;
  description: string;
  posts: FeedPost[];
  viewerId: string;
}) {
  if (!posts.length) return null;
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} userId={viewerId} />
        ))}
      </div>
    </section>
  );
}

export function MemberProfilePage({ profileId }: { profileId: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const isSelf = profileId === user!.id;

  const member = useQuery({
    queryKey: ["member-profile", profileId],
    queryFn: () => getMemberProfile(profileId),
    retry: false,
  });
  const posts = useQuery({
    queryKey: ["profile-posts", profileId],
    queryFn: () => listProfilePosts(profileId, user!.id),
    enabled: member.isSuccess,
  });

  const message = useMutation({
    mutationFn: () => startDirectConversation(profileId),
    onSuccess: () => void navigate({ to: "/messages" }),
    onError: (error: Error) => toast.error(error.message),
  });

  if (member.isLoading) {
    return (
      <AppShell title={t("profile.title")}>
        <Loading label={t("profile.loading")} />
      </AppShell>
    );
  }

  if (member.error) {
    return (
      <AppShell title={t("profile.title")}>
        <Failure error={member.error} onRetry={() => void member.refetch()} />
        <div className="mt-6">
          <Empty title={t("profile.unavailable.title")} text={t("profile.unavailable.text")} />
        </div>
      </AppShell>
    );
  }

  const { profile, student, prospective } = member.data!;
  const isCurrentStudent = profile.account_type === "current_student";
  const verified = student?.verification_status === "verified";
  const profileOnly = posts.data?.filter((post) => post.scope === "PROFILE_ONLY") ?? [];
  const community = posts.data?.filter((post) => post.scope === "COMMUNITY") ?? [];

  return (
    <AppShell title={t("profile.title")}>
      <div className="card-soft p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <UserAvatar profile={profile} className="size-20 sm:size-24" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold break-words">{profile.full_name}</h2>
              {verified ? <VerifiedBadge /> : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(accountTypeKey(profile.account_type))} ·{" "}
              {t("profile.joined", { date: formatDate(profile.created_at, language) })}
            </p>

            {isCurrentStudent && student?.university ? (
              <Link
                to="/universities/$id"
                params={{ id: student.university.id }}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary-soft px-3 py-2 text-sm font-semibold text-primary-soft-foreground"
              >
                <GraduationCap className="size-4" />
                {student.university.name}
              </Link>
            ) : null}

            {!isCurrentStudent ? (
              <Badge variant="secondary" className="mt-3 font-normal">
                {t("profile.exploring")}
              </Badge>
            ) : null}
          </div>

          <div className="flex gap-2 sm:flex-col">
            {isSelf ? (
              <Button asChild variant="outline" className="h-11">
                <Link to="/profile">{t("profile.edit")}</Link>
              </Button>
            ) : (
              <Button
                className="h-11"
                disabled={message.isPending}
                onClick={() => message.mutate()}
              >
                <MessageSquare className="size-4" />
                {t("profile.message")}
              </Button>
            )}
          </div>
        </div>

        {profile.bio ? (
          <p className="mt-6 max-w-2xl break-words whitespace-pre-wrap text-sm leading-relaxed">
            {profile.bio}
          </p>
        ) : null}

        {isCurrentStudent && student ? (
          <div className="mt-6 border-t pt-6">
            <StudentDetails student={student} />
          </div>
        ) : null}
        {!isCurrentStudent && prospective ? (
          <div className="mt-6 border-t pt-6">
            <ProspectiveDetails prospective={prospective} />
          </div>
        ) : null}
      </div>

      {posts.isLoading ? <Loading label={t("profile.loadingPosts")} /> : null}
      {posts.error ? <Failure error={posts.error} onRetry={() => void posts.refetch()} /> : null}

      <PostSection
        title={t("profile.profilePosts")}
        description={t("profile.profilePostsNote")}
        posts={profileOnly}
        viewerId={user!.id}
      />
      <PostSection
        title={t("profile.communityPosts")}
        description={t("profile.communityPostsNote")}
        posts={community}
        viewerId={user!.id}
      />

      {posts.isSuccess && !posts.data.length ? (
        <div className="mt-8">
          <Empty
            title={t("profile.noPosts.title")}
            text={isSelf ? t("profile.noPosts.self") : t("profile.noPosts.other")}
          />
        </div>
      ) : null}
    </AppShell>
  );
}
