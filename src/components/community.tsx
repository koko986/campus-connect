import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUp,
  BadgeCheck,
  Bookmark,
  Flag,
  MapPin,
  MessageCircle,
  Share2,
  Trash2,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { submitReport } from "@/lib/api";
import type { CommunityProfile, FeedPost, University, UniversitySummary } from "@/lib/data";
import {
  avatarUrl,
  deletePost,
  isVerifiedStudent,
  postImageUrl,
  setPostLiked,
  setPostSaved,
  universityImageUrl,
} from "@/lib/data";
import { accountTypeKey, formatDate, initials } from "@/lib/format";
import { useLanguage, useT, type Translate } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function VerifiedBadge() {
  const t = useT();
  return (
    <span
      title={t("community.verifiedTitle")}
      className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary-soft-foreground"
    >
      <BadgeCheck className="size-3" /> {t("community.verified")}
    </span>
  );
}

export function UserAvatar({
  profile,
  className,
}: {
  profile: CommunityProfile;
  className?: string;
}) {
  const src = avatarUrl(profile.avatar_path);
  return (
    <Avatar className={cn("size-10 border border-border", className)}>
      {src ? <AvatarImage src={src} alt={profile.full_name} /> : null}
      <AvatarFallback className="bg-primary-soft text-xs font-semibold text-primary-soft-foreground">
        {initials(profile.full_name)}
      </AvatarFallback>
    </Avatar>
  );
}

/** Every name and avatar in the product routes to the member's public profile. */
export function ProfileLink({
  profile,
  children,
  className,
}: {
  profile: CommunityProfile;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to="/profiles/$id"
      params={{ id: profile.id }}
      className={cn(
        "rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function AuthorLine({
  profile,
  time,
  showReport = true,
}: {
  profile: CommunityProfile | null;
  time?: string;
  showReport?: boolean;
}) {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  if (!profile) {
    return (
      <div className="min-w-0">
        <span className="text-sm font-semibold">{t("community.member")}</span>
        {time ? (
          <p className="text-xs text-muted-foreground">{formatDate(time, language)}</p>
        ) : null}
      </div>
    );
  }
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <ProfileLink profile={profile} className="shrink-0">
        <UserAvatar profile={profile} />
      </ProfileLink>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <ProfileLink profile={profile}>
            <span className="text-sm font-semibold hover:underline">{profile.full_name}</span>
          </ProfileLink>
          {isVerifiedStudent(profile) ? <VerifiedBadge /> : null}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {t(accountTypeKey(profile.account_type))}
          {time ? ` · ${formatDate(time, language)}` : ""}
        </p>
      </div>
      {showReport && user?.id !== profile.id ? (
        <ReportButton targetType="ACCOUNT" targetId={profile.id} label={t("report.account")} />
      ) : null}
    </div>
  );
}

export function ReportButton({
  targetType,
  targetId,
  label,
}: {
  targetType: "ACCOUNT" | "POST";
  targetId: string;
  label: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const report = useMutation({
    mutationFn: () => submitReport({ targetType, targetId, reason, details }),
    onSuccess: () => {
      setOpen(false);
      setReason("");
      setDetails("");
      toast.success(t("report.sent"));
    },
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto size-9 shrink-0"
          aria-label={label}
          title={label}
        >
          <Flag className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>{t("report.description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger>
              <SelectValue placeholder={t("report.chooseReason")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SPAM">{t("report.reason.SPAM")}</SelectItem>
              <SelectItem value="HARASSMENT">{t("report.reason.HARASSMENT")}</SelectItem>
              <SelectItem value="IMPERSONATION">{t("report.reason.IMPERSONATION")}</SelectItem>
              <SelectItem value="MISINFORMATION">{t("report.reason.MISINFORMATION")}</SelectItem>
              <SelectItem value="INAPPROPRIATE">{t("report.reason.INAPPROPRIATE")}</SelectItem>
              <SelectItem value="OTHER">{t("report.reason.OTHER")}</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            maxLength={2000}
            placeholder={t("report.detailsPlaceholder")}
          />
          {report.error ? <p className="text-sm text-destructive">{report.error.message}</p> : null}
          <Button
            disabled={
              !reason || report.isPending || (details.length > 0 && details.trim().length < 10)
            }
            onClick={() => report.mutate()}
          >
            {report.isPending ? t("report.sending") : t("report.submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The device share sheet is only available over HTTPS on supported browsers, so
 * the clipboard is always kept as a fallback.
 */
async function sharePost(t: Translate, postId: string) {
  const url = `${window.location.origin}/posts/${postId}`;
  const payload = { title: t("post.share.title"), text: t("post.share.text"), url };
  if (navigator.share && navigator.canShare?.(payload) !== false) {
    try {
      await navigator.share(payload);
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success(t("post.linkCopied"));
  } catch {
    toast.error(t("post.copyLink", { url }));
  }
}

export function UniversityTagLink({
  university,
}: {
  university: NonNullable<FeedPost["university"]>;
}) {
  return (
    <Link to="/universities/$id" params={{ id: university.id }}>
      <Badge variant="secondary" className="font-normal hover:bg-primary-soft">
        {university.short_name ?? university.name}
      </Badge>
    </Link>
  );
}

export function PostCard({
  post,
  userId,
  linkToThread = true,
}: {
  post: FeedPost;
  userId: string;
  linkToThread?: boolean;
}) {
  const queryClient = useQueryClient();
  const t = useT();
  const owned = post.author_id === userId;

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["feed"] }),
      queryClient.invalidateQueries({ queryKey: ["post", post.id] }),
      queryClient.invalidateQueries({ queryKey: ["profile-posts"] }),
      queryClient.invalidateQueries({ queryKey: ["saved-posts"] }),
    ]);

  const like = useMutation({
    mutationFn: () => setPostLiked(post.id, userId, !post.liked),
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });
  const save = useMutation({
    mutationFn: () => setPostSaved(post.id, userId, !post.saved),
    onSuccess: async () => {
      await refresh();
      toast.success(post.saved ? t("post.unsavedToast") : t("post.savedToast"));
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: () => deletePost(post.id),
    onSuccess: async () => {
      await refresh();
      toast.success(t("post.deletedToast"));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const image = postImageUrl(post.image_path);

  return (
    <article className="card-soft overflow-hidden p-4 sm:p-5">
      <div className="flex items-start gap-2">
        <AuthorLine profile={post.author} time={post.created_at} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {post.university ? <UniversityTagLink university={post.university} /> : null}
        {post.topic ? <Badge variant="secondary">{post.topic}</Badge> : null}
        {post.scope === "PROFILE_ONLY" ? (
          <Badge variant="outline">{t("post.profileOnly")}</Badge>
        ) : null}
      </div>

      <p className="mt-3 break-words whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
        {post.body}
      </p>

      {image ? (
        <img
          src={image}
          alt={t("post.imageAlt")}
          loading="lazy"
          className="mt-4 max-h-[70vh] w-full rounded-lg object-cover"
        />
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-border pt-3">
        <Button
          variant="ghost"
          size="sm"
          disabled={like.isPending}
          onClick={() => like.mutate()}
          aria-pressed={post.liked}
          className={cn("h-9 gap-2 rounded-full", post.liked && "text-primary")}
        >
          <ArrowUp className={cn("size-4", post.liked && "stroke-[3]")} />
          {post.like_count}
        </Button>

        {linkToThread ? (
          <Button asChild variant="ghost" size="sm" className="h-9 gap-2 rounded-full">
            <Link to="/posts/$id" params={{ id: post.id }}>
              <MessageCircle className="size-4" />
              {post.comment_count}
            </Link>
          </Button>
        ) : (
          <span className="inline-flex h-9 items-center gap-2 px-3 text-sm text-muted-foreground">
            <MessageCircle className="size-4" />
            {post.comment_count}
          </span>
        )}

        <Button
          variant="ghost"
          size="sm"
          disabled={save.isPending}
          onClick={() => save.mutate()}
          aria-pressed={post.saved}
          aria-label={post.saved ? t("post.removeFromSaved") : t("post.savePost")}
          className={cn("h-9 gap-2 rounded-full", post.saved && "text-primary")}
        >
          <Bookmark className={cn("size-4", post.saved && "fill-current")} />
          <span className="hidden sm:inline">{post.saved ? t("post.saved") : t("post.save")}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-2 rounded-full"
          onClick={() => void sharePost(t, post.id)}
        >
          <Share2 className="size-4" />
          <span className="hidden sm:inline">{t("post.share")}</span>
        </Button>

        <div className="ml-auto flex items-center">
          {owned ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 text-muted-foreground hover:text-destructive"
                  aria-label={t("post.delete")}
                >
                  <Trash2 className="size-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("post.delete.title")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("post.delete.text")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("post.delete.keep")}</AlertDialogCancel>
                  <AlertDialogAction disabled={remove.isPending} onClick={() => remove.mutate()}>
                    {t("common.delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <ReportButton targetType="POST" targetId={post.id} label={t("report.post")} />
          )}
        </div>
      </div>
    </article>
  );
}

function departmentCount(university: University | UniversitySummary) {
  const first = university.departments[0];
  return first && "count" in first ? first.count : university.departments.length;
}

function hasDetailedDepartments(
  university: University | UniversitySummary,
): university is University {
  const first = university.departments[0];
  return Boolean(first && "name" in first);
}

export function UniversityCard({ university }: { university: University | UniversitySummary }) {
  const t = useT();
  const image = universityImageUrl(university.cover_image_path);
  const count = departmentCount(university);
  return (
    <article className="card-soft flex flex-col overflow-hidden transition-shadow hover:shadow-[var(--shadow-lift)]">
      {image ? (
        <img
          src={image}
          alt=""
          loading="lazy"
          className="aspect-video w-full bg-muted object-cover"
        />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-primary-soft text-2xl font-bold text-primary-soft-foreground">
          {university.short_name}
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="min-w-0">
          <h3 className="text-base font-semibold">{university.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" /> {university.city}
          </p>
        </div>
        <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{university.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {count > 0 && hasDetailedDepartments(university)
            ? university.departments.slice(0, 3).map((department) => (
                <Badge key={department.id} variant="secondary" className="font-normal">
                  {department.name}
                </Badge>
              ))
            : null}
          {count === 0 ? (
            <>
              {university.region ? <Badge variant="secondary">{university.region}</Badge> : null}
              <Badge variant="outline">{university.university_type}</Badge>
            </>
          ) : null}
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            {count > 0
              ? t("university.departmentCount", { count })
              : t("university.directoryListing")}
          </p>
          <Button asChild size="sm">
            <Link to="/universities/$id" params={{ id: university.id }}>
              {t("common.view")}
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
