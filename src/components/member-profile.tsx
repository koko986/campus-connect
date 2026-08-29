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
import { accountTypeLabel, formatDate } from "@/lib/format";

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
  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Detail label="Campus" value={student.campus?.name} />
      <Detail label="Department" value={student.department?.name} />
      <Detail label="Program" value={student.program?.name} />
      <Detail
        label="Academic year"
        value={student.academic_year ? `Year ${student.academic_year}` : null}
      />
    </dl>
  );
}

function ProspectiveDetails({
  prospective,
}: {
  prospective: NonNullable<MemberProfile["prospective"]>;
}) {
  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Detail label="Preferred field" value={prospective.preferred_field} />
      <Detail label="Preferred city" value={prospective.preferred_city} />
      <Detail label="Degree level" value={prospective.preferred_degree_level} />
      <Detail label="Interests" value={prospective.preferences} />
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
      <AppShell title="Profile">
        <Loading label="Loading profile" />
      </AppShell>
    );
  }

  if (member.error) {
    return (
      <AppShell title="Profile">
        <Failure error={member.error} onRetry={() => void member.refetch()} />
        <div className="mt-6">
          <Empty
            title="Profile unavailable"
            text="This member keeps their profile private, or the account no longer exists."
          />
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
    <AppShell title="Profile">
      <div className="card-soft p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <UserAvatar profile={profile} className="size-20 sm:size-24" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold break-words">{profile.full_name}</h2>
              {verified ? <VerifiedBadge /> : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {accountTypeLabel(profile.account_type)} · Joined {formatDate(profile.created_at)}
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
                Exploring universities
              </Badge>
            ) : null}
          </div>

          <div className="flex gap-2 sm:flex-col">
            {isSelf ? (
              <Button asChild variant="outline" className="h-11">
                <Link to="/profile">Edit profile</Link>
              </Button>
            ) : (
              <Button
                className="h-11"
                disabled={message.isPending}
                onClick={() => message.mutate()}
              >
                <MessageSquare className="size-4" />
                Message
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

      {posts.isLoading ? <Loading label="Loading posts" /> : null}
      {posts.error ? <Failure error={posts.error} onRetry={() => void posts.refetch()} /> : null}

      <PostSection
        title="Profile posts"
        description="Shared only on this profile."
        posts={profileOnly}
        viewerId={user!.id}
      />
      <PostSection
        title="Community posts"
        description="Also visible in Home and university feeds."
        posts={community}
        viewerId={user!.id}
      />

      {posts.isSuccess && !posts.data.length ? (
        <div className="mt-8">
          <Empty
            title="No posts yet"
            text={isSelf ? "Share your first post from Home." : "This member has not posted yet."}
          />
        </div>
      ) : null}
    </AppShell>
  );
}
