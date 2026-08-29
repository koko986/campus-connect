import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Bookmark,
  Camera,
  ChevronRight,
  ExternalLink,
  ImagePlus,
  Plus,
  Sparkles,
} from "lucide-react";
import { useDeferredValue, useEffect, useRef, useState, type ReactNode } from "react";
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
  listFieldOfStudyOptions,
  listFeedPosts,
  listQuestions,
  listRecommendedUniversities,
  listSavedPosts,
  listSavedUniversities,
  listUniversityFilters,
  listUniversitySummaries,
  listUniversities,
  setUniversitySaved,
  submitUniversityPhoto,
  UNIVERSITY_IMAGE_MAX_BYTES,
  universityImageUrl,
  updateProfile,
  updateProspectiveProfile,
  updateStudentProfile,
  uploadAvatar,
  validateImage,
} from "@/lib/data";
import type { Enums } from "@/lib/database.types";
import { useTheme, type Appearance } from "@/lib/theme";
import { supabase } from "@/lib/supabase";
import { accountTypeKey, formatDate, imageProblemMessage } from "@/lib/format";
import { languages, useLanguage, useT, type Language, type Translate } from "@/lib/i18n";

function SortControl({ value, onChange }: { value: FeedSort; onChange: (next: FeedSort) => void }) {
  const t = useT();
  return (
    <Select value={value} onValueChange={(next) => onChange(next as FeedSort)}>
      <SelectTrigger className="w-32" aria-label={t("feed.sortLabel")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="newest">{t("common.newest")}</SelectItem>
        <SelectItem value="best">{t("common.best")}</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function DashboardPage({ universityId }: { universityId?: string | undefined }) {
  const { profile, user } = useAuth();
  const t = useT();
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
        <h3 className="font-semibold">{t("feed.savedPosts")}</h3>
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
            <p className="text-sm text-muted-foreground">{t("feed.nothingSaved")}</p>
          ) : null}
        </div>
      </div>
      <div className="card-soft p-5">
        <h3 className="font-semibold">{t("feed.savedUniversities")}</h3>
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
            <p className="text-sm text-muted-foreground">{t("feed.noSavedUniversities")}</p>
          ) : null}
        </div>
      </div>
    </>
  );

  return (
    <AppShell title={t("nav.home")} right={side}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {t("feed.welcome", { name: profile?.full_name.split(" ")[0] ?? "" })}
          </p>
          <h2 className="mt-1 text-2xl font-bold">{t("feed.heading")}</h2>
        </div>
        <PostComposer defaultUniversityId={universityId} />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <SortControl value={sort} onChange={setSort} />
        {universityId ? (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{filter.data?.name ?? t("feed.filtered")}</Badge>
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard">{t("feed.clearFilter")}</Link>
            </Button>
          </div>
        ) : null}
      </div>

      <div className="mt-5 space-y-4">
        {feed.isLoading ? <Loading label={t("feed.loadingPosts")} /> : null}
        {feed.error ? <Failure error={feed.error} onRetry={() => void feed.refetch()} /> : null}

        {posts.map((post) => (
          <PostCard key={post.id} post={post} userId={user!.id} />
        ))}

        {feed.isSuccess && !posts.length ? (
          <Empty title={t("feed.empty.title")} text={t("feed.empty.text")} />
        ) : null}

        {feed.hasNextPage ? (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              className="h-11"
              disabled={feed.isFetchingNextPage}
              onClick={() => void feed.fetchNextPage()}
            >
              {feed.isFetchingNextPage ? t("common.loading") : t("feed.loadMore")}
            </Button>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

function recommendationReason(t: Translate, reason: string) {
  if (reason === "Offers a related field of study") return t("universities.reason.field");
  if (reason === "Matches your preferred city or region") return t("universities.reason.city");
  if (reason === "Offers your preferred degree level") return t("universities.reason.degree");
  return reason;
}

export function UniversitiesPage() {
  const { profile, user } = useAuth();
  const t = useT();
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("all");
  const [type, setType] = useState<"all" | Enums<"university_type">>("all");
  const deferredSearch = useDeferredValue(search.trim());
  const filters = useQuery({
    queryKey: ["university-filters"],
    queryFn: listUniversityFilters,
  });
  const query = useInfiniteQuery({
    queryKey: ["university-summaries", deferredSearch, region, type],
    queryFn: ({ pageParam }) =>
      listUniversitySummaries({
        page: pageParam,
        region: region === "all" ? undefined : region,
        search: deferredSearch || undefined,
        type: type === "all" ? undefined : type,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
  });
  const recommendations = useQuery({
    queryKey: ["university-recommendations", user!.id],
    queryFn: () => listRecommendedUniversities(user!.id),
    enabled: profile?.account_type === "prospective_student",
  });
  const results = query.data?.pages.flatMap((page) => page.universities) ?? [];

  return (
    <AppShell title={t("nav.universities")}>
      <p className="text-sm text-muted-foreground">{t("universities.note")}</p>
      <h2 className="mt-1 text-2xl font-bold">{t("universities.heading")}</h2>

      {recommendations.data?.length ? (
        <section className="mt-7">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <h3 className="text-lg font-bold">{t("universities.recommended")}</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t("universities.recommendedNote")}</p>
          <div className="scroll-rail mt-4 md:grid md:grid-cols-2 md:overflow-visible xl:grid-cols-3">
            {recommendations.data.map((university) => (
              <div key={university.id} className="w-72 shrink-0 md:w-auto">
                <UniversityCard university={university} />
                <div className="mt-2 flex flex-wrap gap-1">
                  {university.matchReasons.map((reason) => (
                    <Badge key={reason} variant="secondary" className="font-normal">
                      {recommendationReason(t, reason)}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-7 grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem_11rem]">
        <Input
          className="h-11"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("universities.searchPlaceholder")}
        />
        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger className="h-11" aria-label={t("universities.regionFilter")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("universities.allRegions")}</SelectItem>
            {filters.data?.regions.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={type}
          onValueChange={(value) => setType(value as "all" | Enums<"university_type">)}
        >
          <SelectTrigger className="h-11" aria-label={t("universities.typeFilter")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("universities.allTypes")}</SelectItem>
            {filters.data?.types.map((item) => (
              <SelectItem key={item} value={item}>
                {t(`universities.type.${item}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {query.isLoading ? <Loading label={t("universities.loading")} /> : null}
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
      {query.hasNextPage ? (
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            className="h-11"
            disabled={query.isFetchingNextPage}
            onClick={() => void query.fetchNextPage()}
          >
            {query.isFetchingNextPage ? t("common.loading") : t("feed.loadMore")}
          </Button>
        </div>
      ) : null}
      {query.isSuccess && !results.length ? (
        <div className="mt-6">
          <Empty title={t("universities.empty.title")} text={t("universities.empty.text")} />
        </div>
      ) : null}
    </AppShell>
  );
}

function PostPreview({ post }: { post: FeedPost }) {
  const t = useT();
  return (
    <Link
      to="/posts/$id"
      params={{ id: post.id }}
      className="card-soft block w-64 shrink-0 p-4 transition-shadow hover:shadow-[var(--shadow-lift)] md:w-auto"
    >
      <p className="line-clamp-4 text-sm leading-relaxed">{post.body}</p>
      <p className="mt-3 text-xs text-muted-foreground">
        {post.author?.full_name ?? t("community.member")} ·{" "}
        {t("post.upvotes", { count: post.like_count })} ·{" "}
        {t("post.comments", { count: post.comment_count })}
      </p>
    </Link>
  );
}

function QuestionPreview({ question }: { question: CommunityQuestion }) {
  const t = useT();
  return (
    <div className="card-soft w-64 shrink-0 p-4 md:w-auto">
      <h4 className="line-clamp-2 text-sm font-semibold">{question.title}</h4>
      <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{question.body}</p>
      <p className="mt-3 text-xs font-semibold text-primary">
        {t("questions.answers", { count: question.answers[0]?.count ?? 0 })}
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
  const t = useT();
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold">{title}</h3>
        {seeAll}
      </div>
      {isEmpty ? (
        <div className="mt-4">
          <Empty title={t("common.nothingYet")} text={emptyText} />
        </div>
      ) : (
        <div className="scroll-rail mt-4 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible xl:grid-cols-3">
          {children}
        </div>
      )}
    </section>
  );
}

function UniversityPhotoUpload({ universityId }: { universityId: string }) {
  const { user } = useAuth();
  const t = useT();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const submit = useMutation({
    mutationFn: () =>
      submitUniversityPhoto({
        caption,
        file: file!,
        universityId,
        userId: user!.id,
      }),
    onSuccess: () => {
      setOpen(false);
      setFile(null);
      setCaption("");
      toast.success(t("university.photoSubmitted"));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-11">
          <Camera className="size-4" />
          {t("university.addPhoto")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("university.addPhoto")}</DialogTitle>
          <DialogDescription>{t("university.photoReviewNote")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <input
            ref={input}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            className="sr-only"
            onChange={(event) => {
              const selected = event.target.files?.[0] ?? null;
              if (!selected) return;
              const problem = validateImage(selected, UNIVERSITY_IMAGE_MAX_BYTES);
              if (problem) {
                toast.error(imageProblemMessage(t, problem));
                event.target.value = "";
                return;
              }
              setFile(selected);
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full"
            onClick={() => input.current?.click()}
          >
            <ImagePlus className="size-4" />
            {file?.name ?? t("university.choosePhoto")}
          </Button>
          <div>
            <Label htmlFor="university-photo-caption">{t("university.photoCaption")}</Label>
            <Textarea
              id="university-photo-caption"
              className="mt-1"
              maxLength={280}
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder={t("university.photoCaptionPlaceholder")}
            />
          </div>
          <Button
            className="h-11"
            disabled={!file || submit.isPending}
            onClick={() => submit.mutate()}
          >
            {submit.isPending ? t("university.uploadingPhoto") : t("university.submitPhoto")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function UniversityDetailPage({ id }: { id: string }) {
  const { user } = useAuth();
  const client = useQueryClient();
  const t = useT();

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
  const member = useQuery({
    queryKey: ["member-profile", user!.id],
    queryFn: () => getMemberProfile(user!.id),
  });

  const isSaved = saved.data?.some((item) => item.id === id) ?? false;
  const save = useMutation({
    mutationFn: () => setUniversitySaved(id, user!.id, !isSaved),
    onSuccess: () => client.invalidateQueries({ queryKey: ["saved-universities", user!.id] }),
  });

  if (university.isLoading) {
    return (
      <AppShell title={t("university.title")}>
        <Loading label={t("university.loading")} />
      </AppShell>
    );
  }
  if (university.error) {
    return (
      <AppShell title={t("university.title")}>
        <Failure error={university.error} onRetry={() => void university.refetch()} />
      </AppShell>
    );
  }

  const record = university.data!;
  const coverImage = universityImageUrl(record.cover_image_path);
  const canSubmitPhoto =
    member.data?.student?.verification_status === "verified" &&
    member.data.student.university_id === id;
  return (
    <AppShell title={t("university.title")}>
      <section className="border-b pb-8">
        {coverImage ? (
          <figure className="mb-6 overflow-hidden rounded-2xl border bg-muted">
            <img
              src={coverImage}
              alt={record.name}
              className="max-h-[28rem] aspect-[16/7] w-full object-cover"
            />
            {record.cover_image_credit ? (
              <figcaption className="px-3 py-2 text-xs text-muted-foreground">
                {record.cover_image_source_url ? (
                  <a
                    href={record.cover_image_source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-foreground hover:underline"
                  >
                    {record.cover_image_credit}
                  </a>
                ) : (
                  record.cover_image_credit
                )}
              </figcaption>
            ) : null}
          </figure>
        ) : null}
        <div className="flex flex-wrap items-start gap-4">
          {!coverImage ? (
            <span className="flex size-16 items-center justify-center rounded-lg bg-primary-soft text-xl font-bold">
              {record.short_name}
            </span>
          ) : null}
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
                {t("university.officialWebsite")}
                <ExternalLink className="size-4" />
              </a>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              {record.founded_year ? (
                <span>{t("university.founded", { year: record.founded_year })}</span>
              ) : null}
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
            aria-label={isSaved ? t("university.removeSaved") : t("university.save")}
          >
            <Bookmark className={isSaved ? "size-4 fill-current" : "size-4"} />
          </Button>
          {canSubmitPhoto ? <UniversityPhotoUpload universityId={id} /> : null}
        </div>
        <div className="mt-7 grid gap-6 border-t pt-6 md:grid-cols-3">
          <Details
            title={t("university.departments")}
            values={record.departments.map((item) => item.name)}
          />
          <Details
            title={t("university.programs")}
            values={record.programs.map((item) => item.name)}
          />
          <Details
            title={t("university.campuses")}
            values={record.campuses.map((item) => item.name)}
          />
        </div>
      </section>

      <PreviewSection
        title={t("university.studentPosts")}
        isEmpty={posts.isSuccess && !posts.data.posts.length}
        emptyText={t("university.noPosts")}
        seeAll={
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link to="/dashboard" search={{ university: id }}>
              {t("common.seeAll")}
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
        title={t("university.questions")}
        isEmpty={questions.isSuccess && !questions.data.length}
        emptyText={t("university.noQuestions")}
        seeAll={
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link to="/questions" search={{ university: id }}>
              {t("common.seeAll")}
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
  const t = useT();
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
          <p className="text-sm text-muted-foreground">{t("university.noRecords")}</p>
        ) : null}
      </div>
    </div>
  );
}

function QuestionComposer() {
  const { user } = useAuth();
  const client = useQueryClient();
  const t = useT();
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
          {t("questions.ask")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("questions.composer.title")}</DialogTitle>
          <DialogDescription>{t("questions.composer.description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            minLength={8}
            maxLength={240}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t("questions.titlePlaceholder")}
          />
          <Textarea
            maxLength={4000}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={t("questions.bodyPlaceholder")}
          />
          <Select value={universityId} onValueChange={setUniversityId}>
            <SelectTrigger>
              <SelectValue placeholder={t("questions.universityOptional")} />
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
            placeholder={t("questions.tagsPlaceholder")}
          />
          {mutation.error ? <Failure error={mutation.error} /> : null}
          <Button
            className="h-11"
            disabled={title.trim().length < 8 || !body.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? t("questions.posting") : t("questions.post")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function QuestionsPage({ universityId }: { universityId?: string | undefined }) {
  const t = useT();
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
    <AppShell title={t("questions.title")}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{t("questions.note")}</p>
          <h2 className="mt-1 text-2xl font-bold">{t("questions.heading")}</h2>
        </div>
        <QuestionComposer />
      </div>

      {universityId ? (
        <div className="mt-4 flex items-center gap-2">
          <Badge variant="secondary">{filter.data?.name ?? t("feed.filtered")}</Badge>
          <Button asChild variant="ghost" size="sm">
            <Link to="/questions">{t("feed.clearFilter")}</Link>
          </Button>
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        {query.isLoading ? <Loading label={t("questions.loading")} /> : null}
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
                {t("questions.answers", { count: question.answers[0]?.count ?? 0 })}
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
          <Empty title={t("questions.empty.title")} text={t("questions.empty.text")} />
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
  const t = useT();
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
              toast.error(imageProblemMessage(t, problem));
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
          {upload.isPending ? t("profile.uploading") : t("profile.changePhoto")}
        </Button>
        <p className="mt-1.5 text-xs text-muted-foreground">{t("profile.imageNote")}</p>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { refreshProfile, user } = useAuth();
  const client = useQueryClient();
  const { language, t } = useLanguage();
  const query = useQuery({
    queryKey: ["member-profile", user!.id],
    queryFn: () => getMemberProfile(user!.id),
  });
  const universities = useQuery({ queryKey: ["universities"], queryFn: listUniversities });
  const fieldOptions = useQuery({
    queryKey: ["field-of-study-options"],
    queryFn: listFieldOfStudyOptions,
  });

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
        if (!universityId) throw new Error(t("profile.chooseUniversityError"));
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
      toast.success(t("profile.updated"));
      await Promise.all([
        refreshProfile(),
        client.invalidateQueries({ queryKey: ["member-profile", user!.id] }),
      ]);
    },
  });

  if (query.isLoading) {
    return (
      <AppShell title={t("profile.title")}>
        <Loading label={t("profile.loading")} />
      </AppShell>
    );
  }
  if (query.error) {
    return (
      <AppShell title={t("profile.title")}>
        <Failure error={query.error} onRetry={() => void query.refetch()} />
      </AppShell>
    );
  }

  const { profile, student, prospective } = query.data!;

  return (
    <AppShell title={t("profile.title")}>
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
              <Label htmlFor="profile-name">{t("field.fullName")}</Label>
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
              <Label htmlFor="profile-bio">{t("field.bio")}</Label>
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
                <h3 className="font-semibold">{t("profile.studyDetails")}</h3>
                <div>
                  <Label htmlFor="profile-university">{t("field.university")}</Label>
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
                      <SelectValue placeholder={t("profile.chooseUniversity")} />
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
                    <Label htmlFor="profile-campus">{t("field.campus")}</Label>
                    <Select value={campusId} onValueChange={setCampusId}>
                      <SelectTrigger id="profile-campus" className="mt-1 h-11">
                        <SelectValue placeholder={t("common.optional")} />
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
                    <Label htmlFor="profile-department">{t("field.department")}</Label>
                    <Select
                      value={departmentId}
                      onValueChange={(next) => {
                        setDepartmentId(next);
                        setProgramId("");
                      }}
                    >
                      <SelectTrigger id="profile-department" className="mt-1 h-11">
                        <SelectValue placeholder={t("common.optional")} />
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
                    <Label htmlFor="profile-program">{t("field.program")}</Label>
                    <Select value={programId} onValueChange={setProgramId}>
                      <SelectTrigger id="profile-program" className="mt-1 h-11">
                        <SelectValue placeholder={t("common.optional")} />
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
                    <Label htmlFor="profile-year">{t("field.academicYear")}</Label>
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
                <h3 className="font-semibold">{t("profile.lookingFor")}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="profile-field">{t("field.preferredField")}</Label>
                    <Input
                      id="profile-field"
                      list="field-of-study-options"
                      className="mt-1 h-11"
                      maxLength={120}
                      value={preferredField}
                      onChange={(event) => setPreferredField(event.target.value)}
                    />
                    <datalist id="field-of-study-options">
                      {fieldOptions.data?.map((option) => (
                        <option key={option} value={option} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <Label htmlFor="profile-city">{t("field.preferredCity")}</Label>
                    <Input
                      id="profile-city"
                      className="mt-1 h-11"
                      maxLength={120}
                      value={preferredCity}
                      onChange={(event) => setPreferredCity(event.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile-degree">{t("field.degreeLevel")}</Label>
                    <Select value={degreeLevel} onValueChange={setDegreeLevel}>
                      <SelectTrigger id="profile-degree" className="mt-1 h-11">
                        <SelectValue placeholder={t("common.optional")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Diploma">{t("profile.degree.Diploma")}</SelectItem>
                        <SelectItem value="Bachelor">{t("profile.degree.Bachelor")}</SelectItem>
                        <SelectItem value="Master">{t("profile.degree.Master")}</SelectItem>
                        <SelectItem value="Doctorate">{t("profile.degree.Doctorate")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="profile-interests">{t("field.interests")}</Label>
                  <Textarea
                    id="profile-interests"
                    className="mt-1"
                    maxLength={500}
                    value={interests}
                    onChange={(event) => setInterests(event.target.value)}
                    placeholder={t("profile.interestsPlaceholder")}
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
                {save.isPending ? t("common.saving") : t("common.save")}
              </Button>
              <Button variant="outline" className="h-11" onClick={() => setEditing(false)}>
                {t("common.cancel")}
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
                  {t(accountTypeKey(profile.account_type))} ·{" "}
                  {t("profile.joined", { date: formatDate(profile.created_at, language) })}
                </p>
              </div>
              <div className="ml-auto flex gap-2">
                <Button asChild variant="ghost" className="h-11">
                  <Link to="/profiles/$id" params={{ id: user!.id }}>
                    {t("profile.publicView")}
                  </Link>
                </Button>
                <Button variant="outline" className="h-11" onClick={() => setEditing(true)}>
                  {t("profile.edit")}
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
              <p className="mt-6 text-sm text-muted-foreground">{t("profile.noBio")}</p>
            )}

            <dl className="mt-6 grid grid-cols-1 gap-4 border-t pt-6 sm:grid-cols-2">
              {isCurrentStudent ? (
                <>
                  <Field label={t("field.campus")} value={student?.campus?.name} />
                  <Field label={t("field.department")} value={student?.department?.name} />
                  <Field label={t("field.program")} value={student?.program?.name} />
                  <Field
                    label={t("field.academicYear")}
                    value={
                      student?.academic_year
                        ? t("profile.year", { year: student.academic_year })
                        : null
                    }
                  />
                </>
              ) : (
                <>
                  <Field label={t("field.preferredField")} value={prospective?.preferred_field} />
                  <Field label={t("field.preferredCity")} value={prospective?.preferred_city} />
                  <Field
                    label={t("field.degreeLevel")}
                    value={prospective?.preferred_degree_level}
                  />
                  <Field label={t("field.interests")} value={prospective?.preferences} />
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
  const t = useT();
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value || t("common.notAdded")}</dd>
    </div>
  );
}

export function SettingsPage() {
  const { profile, refreshProfile, signOut, user } = useAuth();
  const { appearance, setAppearance } = useTheme();
  const { language, setLanguage, t } = useLanguage();
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
    setResetMessage(error?.message ?? t("settings.resetSent"));
  }

  return (
    <AppShell title={t("settings.title")}>
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold">{t("settings.heading")}</h2>
        <div className="mt-6 divide-y border-y">
          <div className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div className="min-w-0">
              <h3 className="font-semibold">{t("language.label")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("language.note")}</p>
            </div>
            <Select value={language} onValueChange={(next) => setLanguage(next as Language)}>
              <SelectTrigger className="h-11 w-36" aria-label={t("language.label")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((option) => (
                  <SelectItem key={option.code} value={option.code} lang={option.code}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div className="min-w-0">
              <h3 className="font-semibold">{t("settings.appearance")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("settings.appearanceNote")}</p>
            </div>
            <Select value={appearance} onValueChange={(next) => setAppearance(next as Appearance)}>
              <SelectTrigger className="h-11 w-36" aria-label={t("settings.appearance")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">{t("settings.appearance.system")}</SelectItem>
                <SelectItem value="light">{t("settings.appearance.light")}</SelectItem>
                <SelectItem value="dark">{t("settings.appearance.dark")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Setting
            title={t("settings.visibility")}
            text={
              profile?.is_public
                ? t("settings.visibility.public")
                : t("settings.visibility.private")
            }
            action={profile?.is_public ? t("settings.makePrivate") : t("settings.makePublic")}
            run={() => visibility.mutate()}
          />
          <Setting
            title={t("settings.password")}
            text={resetMessage || t("settings.passwordNote")}
            action={t("settings.resetPassword")}
            run={() => void resetPassword()}
          />
          <Setting
            title={t("settings.session")}
            text={user?.email ?? ""}
            action={t("shell.logOut")}
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
