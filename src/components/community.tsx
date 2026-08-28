import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Flag, Heart, MapPin, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { setPostLiked } from "@/lib/data";
import { formatDate, initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary-soft-foreground">
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
  return (
    <Avatar className={cn("size-10 border border-border", className)}>
      {profile.avatar_path ? (
        <AvatarImage src={profile.avatar_path} alt={profile.full_name} />
      ) : null}
      <AvatarFallback className="bg-primary-soft text-xs font-semibold text-primary-soft-foreground">
        {initials(profile.full_name)}
      </AvatarFallback>
    </Avatar>
  );
}

export function AuthorLine({ profile, time }: { profile: CommunityProfile | null; time?: string }) {
  const { user } = useAuth();
  if (!profile) {
    return (
      <div>
        <span className="text-sm font-semibold">Deleted user</span>
        {time ? <p className="text-xs text-muted-foreground">{formatDate(time)}</p> : null}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <UserAvatar profile={profile} />
      <div className="min-w-0">
        <span className="text-sm font-semibold">{profile.full_name}</span>
        <p className="truncate text-xs text-muted-foreground">
          {profile.account_type === "current_student" ? "Current student" : "Prospective student"}
          {time ? ` · ${formatDate(time)}` : ""}
        </p>
      </div>
      {user?.id !== profile.id ? (
        <ReportButton targetType="ACCOUNT" targetId={profile.id} label="Report account" />
      ) : null}
    </div>
  );
}

function ReportButton({
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
          className="ml-auto size-8"
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

export function PostCard({ post, userId }: { post: FeedPost; userId: string }) {
  const queryClient = useQueryClient();
  const liked = post.post_likes.some((like) => like.user_id === userId);
  const likeMutation = useMutation({
    mutationFn: () => setPostLiked(post.id, userId, !liked),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });

  return (
    <article className="card-soft overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <AuthorLine profile={post.author} time={post.created_at} />
        <div className="flex items-center gap-2">
          {post.topic ? <Badge variant="secondary">{post.topic}</Badge> : null}
          <ReportButton targetType="POST" targetId={post.id} label="Report post" />
        </div>
      </div>
      <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
        {post.body}
      </p>
      {post.image_path ? (
        <img
          src={post.image_path}
          alt="Post attachment"
          loading="lazy"
          className="mt-4 aspect-[5/3] w-full rounded-lg object-cover"
        />
      ) : null}
      <div className="mt-4 flex items-center gap-1 border-t border-border pt-3">
        <Button
          variant="ghost"
          size="sm"
          disabled={likeMutation.isPending}
          onClick={() => likeMutation.mutate()}
          className={cn("gap-2 rounded-full", liked && "text-primary")}
        >
          <Heart className={cn("size-4", liked && "fill-current")} /> {post.post_likes.length}
        </Button>
        <Button variant="ghost" size="sm" className="gap-2 rounded-full">
          <MessageCircle className="size-4" /> {post.comments.length}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto gap-2 rounded-full"
          onClick={() => navigator.share?.({ title: "TAKKA post", url: window.location.href })}
        >
          <Share2 className="size-4" /> Share
        </Button>
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
