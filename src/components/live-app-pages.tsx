import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bookmark, ChevronRight, ExternalLink, ImagePlus, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import {
  AuthorLine,
  PostCard,
  UniversityCard,
  UserAvatar,
  VerifiedBadge,
} from "@/components/community";
import { PostComposer } from "@/components/post-composer";
import { Empty, Failure, Loading } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import type { CommunityProfile, CommunityQuestion, FeedPost, FeedSort } from "@/lib/data";
import {
  ACCEPTED_IMAGE_TYPES,
  AVATAR_MAX_BYTES,
  createQuestion,
  getMemberProfile,
  getUniversity,
  listFeedPosts,
  listQuestions,
  listSavedPosts,
  listSavedUniversities,
  listUniversities,
  setUniversitySaved,
  updateProfile,
  updateProspectiveProfile,
  updateStudentProfile,
  uploadAvatar,
  validateImage,
} from "@/lib/data";
import { useTheme, type Appearance } from "@/lib/theme";
import { supabase } from "@/lib/supabase";
import { accountTypeLabel, formatDate } from "@/lib/format";

function SortControl({ value, onChange }: { value: FeedSort; onChange: (next: FeedSort) => void }) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as FeedSort)}>
      <SelectTrigger className="w-32" aria-label="Sort posts">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="newest">Newest</SelectItem>
        <SelectItem value="best">Best</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function DashboardPage({ universityId }: { universityId?: string | undefined }) {
  const { profile, user } = useAuth();
  const [sort, setSort] = useState<FeedSort>("newest");

  const feed = useInfiniteQuery({
    queryKey: ["feed", sort, universityId ?? null, user!.id],
    queryFn: ({ pageParam }) =>
      listFeedPosts({ page: pageParam, sort, universityId, viewerId: user!.id }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
  });

  const savedUniversities = useQuery({
    queryKey: ["saved-universities", user!.id],
    queryFn: () => listSavedUniversities(user!.id),
  });
  const savedPosts = useQuery({
    queryKey: ["saved-posts", user!.id],
    queryFn: () => listSavedPosts(user!.id),
  });

  const filter = useQuery({
    queryKey: ["university", universityId],
    queryFn: () => getUniversity(universityId!),
    enabled: Boolean(universityId),
  });

  const posts = feed.data?.pages.flatMap((page) => page.posts) ?? [];

  const side = (
    <>
      <div className="card-soft p-5">
        <h3 className="font-semibold">Saved posts</h3>
        <div className="mt-3 space-y-3">
          {savedPosts.data?.slice(0, 5).map((post) => (
            <Link
              key={post.id}
              to="/posts/$id"
              params={{ id: post.id }}
              className="block text-sm hover:text-primary"
            >
              <span className="line-clamp-2">{post.body}</span>
            </Link>
          ))}
          {savedPosts.isSuccess && !savedPosts.data.length ? (
            <p className="text-sm text-muted-foreground">Nothing saved yet.</p>
          ) : null}
        </div>
      </div>
      <div className="card-soft p-5">
        <h3 className="font-semibold">Saved universities</h3>
        <div className="mt-3 space-y-3">
          {savedUniversities.data?.map((university) => (
            <Link
              key={university.id}
              to="/universities/$id"
              params={{ id: university.id }}
              className="flex items-center gap-3 text-sm hover:text-primary"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-xs font-bold">
                {university.short_name}
              </span>
              <span className="min-w-0 truncate">{university.name}</span>
            </Link>
          ))}
          {savedUniversities.isSuccess && !savedUniversities.data.length ? (
            <p className="text-sm text-muted-foreground">No saved universities.</p>
          ) : null}
        </div>
      </div>
    </>
  );

  return (
    <AppShell title="Home" right={side}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            Welcome, {profile?.full_name.split(" ")[0]}
          </p>
          <h2 className="mt-1 text-2xl font-bold">Student community</h2>
        </div>
        <PostComposer defaultUniversityId={universityId} />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <SortControl value={sort} onChange={setSort} />
        {universityId ? (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{filter.data?.name ?? "Filtered"}</Badge>
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard">Clear filter</Link>
            </Button>
          </div>
        ) : null}
      </div>

      <div className="mt-5 space-y-4">
        {feed.isLoading ? <Loading label="Loading posts" /> : null}
        {feed.error ? <Failure error={feed.error} onRetry={() => void feed.refetch()} /> : null}

        {posts.map((post) => (
          <PostCard key={post.id} post={post} userId={user!.id} />
        ))}

        {feed.isSuccess && !posts.length ? (
          <Empty title="No posts yet" text="Be the first to share something useful." />
        ) : null}

        {feed.hasNextPage ? (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              className="h-11"
              disabled={feed.isFetchingNextPage}
              onClick={() => void feed.fetchNextPage()}
            >
              {feed.isFetchingNextPage ? "Loading..." : "Load more posts"}
            </Button>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

export function UniversitiesPage() {
  const [search, setSearch] = useState("");
  const query = useQuery({ queryKey: ["universities"], queryFn: listUniversities });
  const results = useMemo(
    () =>
      query.data?.filter(
        (university) =>
          !search.trim() ||
          [university.name, university.short_name, university.city, university.region].some(
            (value) => value?.toLowerCase().includes(search.toLowerCase()),
          ),
      ) ?? [],
    [query.data, search],
  );
  return (
    <AppShell title="Universities">
      <p className="text-sm text-muted-foreground">
        Published university records from the TAKKA database.
      </p>
      <h2 className="mt-1 text-2xl font-bold">Explore universities</h2>
      <Input
        className="mt-6 h-11 max-w-xl"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search by university or city"
      />
      {query.isLoading ? <Loading label="Loading universities" /> : null}
      {query.error ? (
        <div className="mt-6">
          <Failure error={query.error} onRetry={() => void query.refetch()} />
        </div>
      ) : null}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.map((university) => (
          <UniversityCard key={university.id} university={university} />
        ))}
      </div>
      {query.isSuccess && !results.length ? (
        <div className="mt-6">
          <Empty title="No universities found" text="Try another name or city." />
        </div>
      ) : null}
    </AppShell>
  );
}

function PostPreview({ post }: { post: FeedPost }) {
  return (
    <Link
      to="/posts/$id"
      params={{ id: post.id }}
      className="card-soft block w-64 shrink-0 p-4 transition-shadow hover:shadow-[var(--shadow-lift)] md:w-auto"
    >
      <p className="line-clamp-4 text-sm leading-relaxed">{post.body}</p>
      <p className="mt-3 text-xs text-muted-foreground">
        {post.author?.full_name ?? "TAKKA member"} · {post.like_count} upvotes ·{" "}
        {post.comment_count} comments
      </p>
    </Link>
  );
}

function QuestionPreview({ question }: { question: CommunityQuestion }) {
  return (
    <div className="card-soft w-64 shrink-0 p-4 md:w-auto">
      <h4 className="line-clamp-2 text-sm font-semibold">{question.title}</h4>
      <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{question.body}</p>
      <p className="mt-3 text-xs font-semibold text-primary">
        {question.answers[0]?.count ?? 0} answers
      </p>
    </div>
  );
}

/** Phones scroll these previews sideways; wider screens get a short grid. */
function PreviewSection({
  title,
  seeAll,
  isEmpty,
  emptyText,
  children,
}: {
  title: string;
  seeAll: ReactNode;
  isEmpty: boolean;
  emptyText: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold">{title}</h3>
        {seeAll}
      </div>
      {isEmpty ? (
        <div className="mt-4">
          <Empty title="Nothing yet" text={emptyText} />
        </div>
      ) : (
        <div className="scroll-rail mt-4 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible xl:grid-cols-3">
          {children}
        </div>
      )}
    </section>
  );
}

export function UniversityDetailPage({ id }: { id: string }) {
  const { user } = useAuth();
  const client = useQueryClient();

  const university = useQuery({ queryKey: ["university", id], queryFn: () => getUniversity(id) });
  const posts = useQuery({
    queryKey: ["feed", "newest", id, user!.id, "preview"],
    queryFn: () => listFeedPosts({ page: 0, sort: "newest", universityId: id, viewerId: user!.id }),
  });
  const questions = useQuery({
    queryKey: ["questions", id],
    queryFn: () => listQuestions(id),
  });
  const saved = useQuery({
    queryKey: ["saved-universities", user!.id],
    queryFn: () => listSavedUniversities(user!.id),
  });

  const isSaved = saved.data?.some((item) => item.id === id) ?? false;
  const save = useMutation({
    mutationFn: () => setUniversitySaved(id, user!.id, !isSaved),
    onSuccess: () => client.invalidateQueries({ queryKey: ["saved-universities", user!.id] }),
  });

  if (university.isLoading) {
    return (
      <AppShell title="University">
        <Loading label="Loading university" />
      </AppShell>
    );
  }
  if (university.error) {
    return (
      <AppShell title="University">
        <Failure error={university.error} onRetry={() => void university.refetch()} />
      </AppShell>
    );
  }

  const record = university.data!;
  return (
    <AppShell title="University">
      <section className="border-b pb-8">
        <div className="flex flex-wrap items-start gap-4">
          <span className="flex size-16 items-center justify-center rounded-lg bg-primary-soft text-xl font-bold">
            {record.short_name}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">
              {record.city} · {record.university_type}
            </p>
            <h2 className="mt-1 text-2xl font-bold break-words">{record.name}</h2>
            <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {record.about || record.description}
            </p>
            {record.website_url ? (
              <a
                href={record.website_url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary"
              >
                Official website
                <ExternalLink className="size-4" />
              </a>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              {record.founded_year ? <span>Founded {record.founded_year}</span> : null}
              {record.contact_email ? (
                <a href={`mailto:${record.contact_email}`}>{record.contact_email}</a>
              ) : null}
              {record.contact_phone ? <span>{record.contact_phone}</span> : null}
            </div>
          </div>
          <Button
            variant={isSaved ? "default" : "outline"}
            size="icon"
            className="size-11"
            disabled={save.isPending}
            onClick={() => save.mutate()}
            aria-label={isSaved ? "Remove saved university" : "Save university"}
          >
            <Bookmark className={isSaved ? "size-4 fill-current" : "size-4"} />
          </Button>
        </div>
        <div className="mt-7 grid gap-6 border-t pt-6 md:grid-cols-3">
          <Details title="Departments" values={record.departments.map((item) => item.name)} />
          <Details title="Programs" values={record.programs.map((item) => item.name)} />
          <Details title="Campuses" values={record.campuses.map((item) => item.name)} />
        </div>
      </section>

      <PreviewSection
        title="Student posts"
        isEmpty={posts.isSuccess && !posts.data.posts.length}
        emptyText="Students have not posted about this university."
        seeAll={
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link to="/dashboard" search={{ university: id }}>
              See all
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        }
      >
        {posts.data?.posts.slice(0, 6).map((post) => (
          <PostPreview key={post.id} post={post} />
        ))}
      </PreviewSection>

      <PreviewSection
        title="Questions"
        isEmpty={questions.isSuccess && !questions.data.length}
        emptyText="No one has asked about this university yet."
        seeAll={
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link to="/questions" search={{ university: id }}>
              See all
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        }
      >
        {questions.data?.slice(0, 6).map((question) => (
          <QuestionPreview key={question.id} question={question} />
        ))}
      </PreviewSection>
    </AppShell>
  );
}

function Details({ title, values }: { title: string; values: string[] }) {
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {values.map((value) => (
          <Badge key={value} variant="secondary">
            {value}
          </Badge>
        ))}
        {!values.length ? (
          <p className="text-sm text-muted-foreground">No published records.</p>
        ) : null}
      </div>
    </div>
  );
}

function QuestionComposer() {
  const { user } = useAuth();
  const client = useQueryClient();
  const universities = useQuery({ queryKey: ["universities"], queryFn: listUniversities });
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [universityId, setUniversityId] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createQuestion({
        authorId: user!.id,
        title,
        body,
        universityId,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
          .slice(0, 5),
      }),
    onSuccess: async () => {
      setOpen(false);
      setTitle("");
      setBody("");
      setTags("");
      setUniversityId("");
      await client.invalidateQueries({ queryKey: ["questions"] });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-11">
          <Plus className="size-4" />
          Ask a question
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ask the community</DialogTitle>
          <DialogDescription>
            Use a specific title so the right students can answer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            minLength={8}
            maxLength={240}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Question title"
          />
          <Textarea
            maxLength={4000}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Add useful context"
          />
          <Select value={universityId} onValueChange={setUniversityId}>
            <SelectTrigger>
              <SelectValue placeholder="University (optional)" />
            </SelectTrigger>
            <SelectContent>
              {universities.data?.map((university) => (
                <SelectItem key={university.id} value={university.id}>
                  {university.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="Tags separated by commas"
          />
          {mutation.error ? <Failure error={mutation.error} /> : null}
          <Button
            className="h-11"
            disabled={title.trim().length < 8 || !body.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Posting..." : "Post question"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function QuestionsPage({ universityId }: { universityId?: string | undefined }) {
  const query = useQuery({
    queryKey: ["questions", universityId ?? null],
    queryFn: () => listQuestions(universityId),
  });
  const filter = useQuery({
    queryKey: ["university", universityId],
    queryFn: () => getUniversity(universityId!),
    enabled: Boolean(universityId),
  });

  return (
    <AppShell title="Questions">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            Get answers from students with direct experience.
          </p>
          <h2 className="mt-1 text-2xl font-bold">Questions and answers</h2>
        </div>
        <QuestionComposer />
      </div>

      {universityId ? (
        <div className="mt-4 flex items-center gap-2">
          <Badge variant="secondary">{filter.data?.name ?? "Filtered"}</Badge>
          <Button asChild variant="ghost" size="sm">
            <Link to="/questions">Clear filter</Link>
          </Button>
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        {query.isLoading ? <Loading label="Loading questions" /> : null}
        {query.error ? <Failure error={query.error} onRetry={() => void query.refetch()} /> : null}
        {query.data?.map((question) => (
          <article key={question.id} className="card-soft p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold break-words">{question.title}</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  {question.body}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-primary">
                {question.answers[0]?.count ?? 0} answers
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {question.university ? (
                <Link to="/universities/$id" params={{ id: question.university.id }}>
                  <Badge variant="secondary" className="hover:bg-primary-soft">
                    {question.university.short_name ?? question.university.name}
                  </Badge>
                </Link>
              ) : null}
              {question.question_tags.map(({ tag }) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="mt-4">
              <AuthorLine profile={question.author} time={question.created_at} />
            </div>
          </article>
        ))}
        {query.isSuccess && !query.data.length ? (
          <Empty title="No questions yet" text="Ask the first question." />
        ) : null}
      </div>
    </AppShell>
  );
}

function AvatarPicker({
  currentPath,
  fullName,
  accountType,
  onUploaded,
}: {
  currentPath: string | null;
  fullName: string;
  accountType: CommunityProfile["account_type"];
  onUploaded: (path: string) => void;
}) {
  const { user } = useAuth();
  const input = useRef<HTMLInputElement>(null);
  const upload = useMutation({
    mutationFn: (file: File) => uploadAvatar(user!.id, file),
    onSuccess: onUploaded,
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="flex items-center gap-4">
      <UserAvatar
        profile={{
          id: user!.id,
          full_name: fullName,
          avatar_path: currentPath,
          account_type: accountType,
        }}
        className="size-20"
      />
      <div>
        <input
          ref={input}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const problem = validateImage(file, AVATAR_MAX_BYTES);
            if (problem) {
              toast.error(problem);
              event.target.value = "";
              return;
            }
            upload.mutate(file);
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="h-11"
          disabled={upload.isPending}
          onClick={() => input.current?.click()}
        >
          <ImagePlus className="size-4" />
          {upload.isPending ? "Uploading..." : "Change photo"}
        </Button>
        <p className="mt-1.5 text-xs text-muted-foreground">JPG, PNG or WebP up to 2 MB.</p>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { refreshProfile, user } = useAuth();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["member-profile", user!.id],
    queryFn: () => getMemberProfile(user!.id),
  });
  const universities = useQuery({ queryKey: ["universities"], queryFn: listUniversities });

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [universityId, setUniversityId] = useState("");
  const [campusId, setCampusId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [programId, setProgramId] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [preferredField, setPreferredField] = useState("");
  const [preferredCity, setPreferredCity] = useState("");
  const [degreeLevel, setDegreeLevel] = useState("");
  const [interests, setInterests] = useState("");

  useEffect(() => {
    if (!query.data) return;
    const { profile, student, prospective } = query.data;
    setName(profile.full_name);
    setBio(profile.bio ?? "");
    setAvatarPath(profile.avatar_path);
    setUniversityId(student?.university_id ?? "");
    setCampusId(student?.campus_id ?? "");
    setDepartmentId(student?.department_id ?? "");
    setProgramId(student?.program_id ?? "");
    setAcademicYear(student?.academic_year ? String(student.academic_year) : "");
    setPreferredField(prospective?.preferred_field ?? "");
    setPreferredCity(prospective?.preferred_city ?? "");
    setDegreeLevel(prospective?.preferred_degree_level ?? "");
    setInterests(prospective?.preferences ?? "");
  }, [query.data]);

  const chosenUniversity = universities.data?.find((item) => item.id === universityId);
  const isCurrentStudent = query.data?.profile.account_type === "current_student";

  const save = useMutation({
    mutationFn: async () => {
      await updateProfile(user!.id, {
        full_name: name.trim(),
        bio: bio.trim() || null,
        avatar_path: avatarPath,
      });
      if (isCurrentStudent) {
        if (!universityId) throw new Error("Choose the university you attend.");
        await updateStudentProfile(user!.id, {
          university_id: universityId,
          campus_id: campusId || null,
          department_id: departmentId || null,
          program_id: programId || null,
          academic_year: academicYear ? Number(academicYear) : null,
        });
      } else {
        await updateProspectiveProfile(user!.id, {
          preferred_field: preferredField.trim() || null,
          preferred_city: preferredCity.trim() || null,
          preferred_degree_level: degreeLevel || null,
          preferences: interests.trim() || null,
        });
      }
    },
    onSuccess: async () => {
      setEditing(false);
      toast.success("Profile updated");
      await Promise.all([
        refreshProfile(),
        client.invalidateQueries({ queryKey: ["member-profile", user!.id] }),
      ]);
    },
  });

  if (query.isLoading) {
    return (
      <AppShell title="Profile">
        <Loading label="Loading profile" />
      </AppShell>
    );
  }
  if (query.error) {
    return (
      <AppShell title="Profile">
        <Failure error={query.error} onRetry={() => void query.refetch()} />
      </AppShell>
    );
  }

  const { profile, student, prospective } = query.data!;

  return (
    <AppShell title="Profile">
      <div className="card-soft p-5 sm:p-6">
        {editing ? (
          <div className="max-w-xl space-y-5">
            <AvatarPicker
              currentPath={avatarPath}
              fullName={name || profile.full_name}
              accountType={profile.account_type}
              onUploaded={setAvatarPath}
            />

            <div>
              <Label htmlFor="profile-name">Full name</Label>
              <Input
                id="profile-name"
                className="mt-1 h-11"
                minLength={2}
                maxLength={120}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="profile-bio">Bio</Label>
              <Textarea
                id="profile-bio"
                className="mt-1"
                maxLength={500}
                value={bio}
                onChange={(event) => setBio(event.target.value)}
              />
            </div>

            {isCurrentStudent ? (
              <div className="space-y-4 border-t pt-5">
                <h3 className="font-semibold">Study details</h3>
                <div>
                  <Label htmlFor="profile-university">University</Label>
                  <Select
                    value={universityId}
                    onValueChange={(next) => {
                      setUniversityId(next);
                      setCampusId("");
                      setDepartmentId("");
                      setProgramId("");
                    }}
                  >
                    <SelectTrigger id="profile-university" className="mt-1 h-11">
                      <SelectValue placeholder="Choose your university" />
                    </SelectTrigger>
                    <SelectContent>
                      {universities.data?.map((university) => (
                        <SelectItem key={university.id} value={university.id}>
                          {university.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="profile-campus">Campus</Label>
                    <Select value={campusId} onValueChange={setCampusId}>
                      <SelectTrigger id="profile-campus" className="mt-1 h-11">
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        {chosenUniversity?.campuses.map((campus) => (
                          <SelectItem key={campus.id} value={campus.id}>
                            {campus.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="profile-department">Department</Label>
                    <Select
                      value={departmentId}
                      onValueChange={(next) => {
                        setDepartmentId(next);
                        setProgramId("");
                      }}
                    >
                      <SelectTrigger id="profile-department" className="mt-1 h-11">
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        {chosenUniversity?.departments.map((department) => (
                          <SelectItem key={department.id} value={department.id}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="profile-program">Program</Label>
                    <Select value={programId} onValueChange={setProgramId}>
                      <SelectTrigger id="profile-program" className="mt-1 h-11">
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          chosenUniversity?.departments.find((item) => item.id === departmentId)
                            ?.programs ?? chosenUniversity?.programs
                        )?.map((program) => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="profile-year">Academic year</Label>
                    <Input
                      id="profile-year"
                      className="mt-1 h-11"
                      type="number"
                      min={1}
                      max={8}
                      value={academicYear}
                      onChange={(event) => setAcademicYear(event.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 border-t pt-5">
                <h3 className="font-semibold">What you are looking for</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="profile-field">Preferred field</Label>
                    <Input
                      id="profile-field"
                      className="mt-1 h-11"
                      maxLength={120}
                      value={preferredField}
                      onChange={(event) => setPreferredField(event.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile-city">Preferred city</Label>
                    <Input
                      id="profile-city"
                      className="mt-1 h-11"
                      maxLength={120}
                      value={preferredCity}
                      onChange={(event) => setPreferredCity(event.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile-degree">Degree level</Label>
                    <Select value={degreeLevel} onValueChange={setDegreeLevel}>
                      <SelectTrigger id="profile-degree" className="mt-1 h-11">
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Diploma">Diploma</SelectItem>
                        <SelectItem value="Bachelor">Bachelor</SelectItem>
                        <SelectItem value="Master">Master</SelectItem>
                        <SelectItem value="Doctorate">Doctorate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="profile-interests">Interests</Label>
                  <Textarea
                    id="profile-interests"
                    className="mt-1"
                    maxLength={500}
                    value={interests}
                    onChange={(event) => setInterests(event.target.value)}
                    placeholder="Subjects, activities or goals"
                  />
                </div>
              </div>
            )}

            {save.error ? <Failure error={save.error} /> : null}
            <div className="flex flex-wrap gap-2">
              <Button
                className="h-11"
                disabled={name.trim().length < 2 || save.isPending}
                onClick={() => save.mutate()}
              >
                {save.isPending ? "Saving..." : "Save"}
              </Button>
              <Button variant="outline" className="h-11" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center gap-4">
              <UserAvatar profile={profile} className="size-16" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold break-words">{profile.full_name}</h2>
                  {student?.verification_status === "verified" ? <VerifiedBadge /> : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {accountTypeLabel(profile.account_type)} · Joined {formatDate(profile.created_at)}
                </p>
              </div>
              <div className="ml-auto flex gap-2">
                <Button asChild variant="ghost" className="h-11">
                  <Link to="/profiles/$id" params={{ id: user!.id }}>
                    Public view
                  </Link>
                </Button>
                <Button variant="outline" className="h-11" onClick={() => setEditing(true)}>
                  Edit profile
                </Button>
              </div>
            </div>

            {student?.university ? (
              <Link
                to="/universities/$id"
                params={{ id: student.university.id }}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-soft px-3 py-2 text-sm font-semibold text-primary-soft-foreground"
              >
                {student.university.name}
              </Link>
            ) : null}

            {profile.bio ? (
              <p className="mt-6 max-w-2xl break-words whitespace-pre-wrap text-sm">
                {profile.bio}
              </p>
            ) : (
              <p className="mt-6 text-sm text-muted-foreground">No bio added.</p>
            )}

            <dl className="mt-6 grid grid-cols-1 gap-4 border-t pt-6 sm:grid-cols-2">
              {isCurrentStudent ? (
                <>
                  <Field label="Campus" value={student?.campus?.name} />
                  <Field label="Department" value={student?.department?.name} />
                  <Field label="Program" value={student?.program?.name} />
                  <Field
                    label="Academic year"
                    value={student?.academic_year ? `Year ${student.academic_year}` : null}
                  />
                </>
              ) : (
                <>
                  <Field label="Preferred field" value={prospective?.preferred_field} />
                  <Field label="Preferred city" value={prospective?.preferred_city} />
                  <Field label="Degree level" value={prospective?.preferred_degree_level} />
                  <Field label="Interests" value={prospective?.preferences} />
                </>
              )}
            </dl>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value || "Not added"}</dd>
    </div>
  );
}

export function SettingsPage() {
  const { profile, refreshProfile, signOut, user } = useAuth();
  const { appearance, setAppearance } = useTheme();
  const visibility = useMutation({
    mutationFn: () => updateProfile(user!.id, { is_public: !profile!.is_public }),
    onSuccess: refreshProfile,
    onError: (error: Error) => toast.error(error.message),
  });
  const [resetMessage, setResetMessage] = useState("");

  async function resetPassword() {
    const { error } = await supabase.auth.resetPasswordForEmail(user!.email!, {
      redirectTo: window.location.origin + "/settings",
    });
    setResetMessage(error?.message ?? "Password reset email sent.");
  }

  return (
    <AppShell title="Settings">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold">Account settings</h2>
        <div className="mt-6 divide-y border-y">
          <div className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div className="min-w-0">
              <h3 className="font-semibold">Appearance</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                System follows your device setting.
              </p>
            </div>
            <Select value={appearance} onValueChange={(next) => setAppearance(next as Appearance)}>
              <SelectTrigger className="h-11 w-36" aria-label="Appearance">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Setting
            title="Profile visibility"
            text={
              profile?.is_public
                ? "Other signed-in members can find your profile."
                : "Your profile is private."
            }
            action={profile?.is_public ? "Make private" : "Make public"}
            run={() => visibility.mutate()}
          />
          <Setting
            title="Password"
            text={resetMessage || "Send a secure password reset link to your email."}
            action="Reset password"
            run={() => void resetPassword()}
          />
          <Setting
            title="Session"
            text={user?.email ?? ""}
            action="Log out"
            run={() => void signOut()}
          />
        </div>
      </div>
    </AppShell>
  );
}

function Setting({
  title,
  text,
  action,
  run,
}: {
  title: string;
  text: string;
  action: string;
  run: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-5">
      <div className="min-w-0">
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 break-words text-sm text-muted-foreground">{text}</p>
      </div>
      <Button variant="outline" size="sm" className="h-11" onClick={run}>
        {action}
      </Button>
    </div>
  );
}
