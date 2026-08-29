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
import { submitReport } from "@/lib/admin-api";
import type { CommunityProfile, FeedPost, University } from "@/lib/data";
import {
  avatarUrl,
  deletePost,
  isVerifiedStudent,
  postImageUrl,
  setPostLiked,
  setPostSaved,
} from "@/lib/data";
import { accountTypeLabel, formatDate, initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export function VerifiedBadge() {
  return (
    <span
      title="Verified current student"
      className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary-soft-foreground"
    >
      <BadgeCheck className="size-3" /> Verified
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
  if (!profile) {
    return (
      <div className="min-w-0">
        <span className="text-sm font-semibold">TAKKA member</span>
        {time ? <p className="text-xs text-muted-foreground">{formatDate(time)}</p> : null}
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
          {accountTypeLabel(profile.account_type)}
          {time ? ` · ${formatDate(time)}` : ""}
        </p>
      </div>
      {showReport && user?.id !== profile.id ? (
        <ReportButton targetType="ACCOUNT" targetId={profile.id} label="Report account" />
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
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const report = useMutation({
    mutationFn: () => submitReport({ targetType, targetId, reason, details }),
    onSuccess: () => {
      setOpen(false);
      setReason("");
      setDetails("");
      toast.success("Report sent to TAKKA moderators");
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
          <DialogDescription>
            Reports are private and reviewed by TAKKA administrators.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a reason" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SPAM">Spam</SelectItem>
              <SelectItem value="HARASSMENT">Harassment</SelectItem>
              <SelectItem value="IMPERSONATION">Impersonation</SelectItem>
              <SelectItem value="MISINFORMATION">Misinformation</SelectItem>
              <SelectItem value="INAPPROPRIATE">Inappropriate content</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            maxLength={2000}
            placeholder="Add details (optional)"
          />
          {report.error ? <p className="text-sm text-destructive">{report.error.message}</p> : null}
          <Button
            disabled={
              !reason || report.isPending || (details.length > 0 && details.trim().length < 10)
            }
            onClick={() => report.mutate()}
          >
            {report.isPending ? "Sending..." : "Submit report"}
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
async function sharePost(postId: string) {
  const url = `${window.location.origin}/posts/${postId}`;
  const payload = { title: "TAKKA post", text: "Read this on TAKKA", url };
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
    toast.success("Link copied");
  } catch {
    toast.error("Copy this link: " + url);
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
      toast.success(post.saved ? "Removed from saved" : "Saved");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: () => deletePost(post.id),
    onSuccess: async () => {
      await refresh();
      toast.success("Post deleted");
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
        {post.scope === "PROFILE_ONLY" ? <Badge variant="outline">Profile only</Badge> : null}
      </div>

      <p className="mt-3 break-words whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
        {post.body}
      </p>

      {image ? (
        <img
          src={image}
          alt="Post attachment"
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
          aria-label={post.saved ? "Remove from saved" : "Save post"}
          className={cn("h-9 gap-2 rounded-full", post.saved && "text-primary")}
        >
          <Bookmark className={cn("size-4", post.saved && "fill-current")} />
          <span className="hidden sm:inline">{post.saved ? "Saved" : "Save"}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-2 rounded-full"
          onClick={() => void sharePost(post.id)}
        >
          <Share2 className="size-4" />
          <span className="hidden sm:inline">Share</span>
        </Button>

        <div className="ml-auto flex items-center">
          {owned ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 text-muted-foreground hover:text-destructive"
                  aria-label="Delete post"
                >
                  <Trash2 className="size-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                  <AlertDialogDescription>
                    It disappears from every feed and thread. TAKKA administrators keep a copy for
                    moderation records.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep post</AlertDialogCancel>
                  <AlertDialogAction disabled={remove.isPending} onClick={() => remove.mutate()}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <ReportButton targetType="POST" targetId={post.id} label="Report post" />
          )}
        </div>
      </div>
    </article>
  );
}

export function UniversityCard({ university }: { university: University }) {
  return (
    <article className="card-soft flex flex-col p-5 transition-shadow hover:shadow-[var(--shadow-lift)]">
      <div className="flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-sm font-bold text-primary-soft-foreground">
          {university.short_name}
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-semibold">{university.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" /> {university.city} · {university.university_type}
          </p>
        </div>
      </div>
      <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{university.description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {university.departments.slice(0, 3).map((department) => (
          <Badge key={department.id} variant="secondary" className="font-normal">
            {department.name}
          </Badge>
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">{university.departments.length} departments</p>
        <Button asChild size="sm">
          <Link to="/universities/$id" params={{ id: university.id }}>
            View
          </Link>
        </Button>
      </div>
    </article>
  );
}
