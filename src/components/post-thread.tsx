import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUp, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { AuthorLine, PostCard } from "@/components/community";
import { Empty, Failure, Loading } from "@/components/states";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import type { CommentNode, FeedSort } from "@/lib/data";
import { createComment, deleteComment, getPost, listComments, setCommentVoted } from "@/lib/data";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const MAX_INDENT = 4;

function CommentComposer({
  postId,
  parentCommentId,
  autoFocus,
  placeholder,
  onDone,
}: {
  postId: string;
  parentCommentId?: string | null;
  autoFocus?: boolean;
  placeholder: string;
  onDone?: () => void;
}) {
  const { user } = useAuth();
  const client = useQueryClient();
  const t = useT();
  const [body, setBody] = useState("");

  const submit = useMutation({
    mutationFn: () => createComment({ authorId: user!.id, body, parentCommentId, postId }),
    onSuccess: async () => {
      setBody("");
      onDone?.();
      await Promise.all([
        client.invalidateQueries({ queryKey: ["comments", postId] }),
        client.invalidateQueries({ queryKey: ["post", postId] }),
      ]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-2">
      <Textarea
        autoFocus={autoFocus}
        value={body}
        maxLength={4000}
        onChange={(event) => setBody(event.target.value)}
        placeholder={placeholder}
        className="min-h-20"
      />
      <div className="flex justify-end gap-2">
        {onDone ? (
          <Button variant="ghost" size="sm" onClick={onDone}>
            {t("common.cancel")}
          </Button>
        ) : null}
        <Button
          size="sm"
          disabled={!body.trim() || submit.isPending}
          onClick={() => submit.mutate()}
        >
          {submit.isPending
            ? t("comment.posting")
            : parentCommentId
              ? t("comment.reply")
              : t("comment.comment")}
        </Button>
      </div>
    </div>
  );
}

function Comment({ comment, depth }: { comment: CommentNode; depth: number }) {
  const { user } = useAuth();
  const client = useQueryClient();
  const t = useT();
  const [replying, setReplying] = useState(false);
  const deleted = Boolean(comment.deleted_at);

  const refresh = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: ["comments", comment.post_id] }),
      client.invalidateQueries({ queryKey: ["post", comment.post_id] }),
    ]);

  const vote = useMutation({
    mutationFn: () => setCommentVoted(comment.id, user!.id, !comment.voted),
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: () => deleteComment(comment.id),
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className={cn(depth > 0 && "border-l border-border pl-3 sm:pl-4")}>
      <div className="py-3">
        {deleted ? (
          <p className="text-sm italic text-muted-foreground">{t("comment.deleted")}</p>
        ) : (
          <>
            <AuthorLine profile={comment.author} time={comment.created_at} />
            <p className="mt-2 break-words whitespace-pre-wrap text-sm leading-relaxed">
              {comment.body}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={vote.isPending}
                onClick={() => vote.mutate()}
                aria-pressed={comment.voted}
                aria-label={comment.voted ? t("comment.removeUpvote") : t("comment.upvote")}
                className={cn("h-9 gap-1.5 rounded-full", comment.voted && "text-primary")}
              >
                <ArrowUp className={cn("size-4", comment.voted && "stroke-[3]")} />
                {comment.vote_count}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-full"
                onClick={() => setReplying((value) => !value)}
              >
                {t("comment.reply")}
              </Button>
              {comment.author_id === user!.id ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 text-muted-foreground hover:text-destructive"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate()}
                  aria-label={t("comment.delete")}
                >
                  <Trash2 className="size-4" />
                </Button>
              ) : null}
            </div>
          </>
        )}

        {replying ? (
          <div className="mt-3">
            <CommentComposer
              autoFocus
              postId={comment.post_id}
              parentCommentId={comment.id}
              placeholder={t("comment.replyTo", {
                name: comment.author?.full_name ?? t("comment.thisComment"),
              })}
              onDone={() => setReplying(false)}
            />
          </div>
        ) : null}
      </div>

      {comment.replies.length ? (
        <div className={cn(depth < MAX_INDENT ? "ml-1 sm:ml-3" : undefined)}>
          {comment.replies.map((reply) => (
            <Comment key={reply.id} comment={reply} depth={Math.min(depth + 1, MAX_INDENT)} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PostThreadPage({ postId }: { postId: string }) {
  const { user } = useAuth();
  const t = useT();
  const [sort, setSort] = useState<FeedSort>("best");

  const post = useQuery({
    queryKey: ["post", postId],
    queryFn: () => getPost(postId, user!.id),
    retry: false,
  });
  const comments = useQuery({
    queryKey: ["comments", postId, sort],
    queryFn: () => listComments(postId, user!.id, sort),
    enabled: post.isSuccess,
  });

  return (
    <AppShell title={t("thread.title")}>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4 gap-2">
        <Link to="/dashboard">
          <ArrowLeft className="size-4" />
          {t("thread.backHome")}
        </Link>
      </Button>

      {post.isLoading ? <Loading label={t("thread.loadingPost")} /> : null}
      {post.error ? <Failure error={post.error} onRetry={() => void post.refetch()} /> : null}

      {post.data ? (
        <>
          <PostCard post={post.data} userId={user!.id} linkToThread={false} />

          <section className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold">
                {post.data.comment_count === 1
                  ? t("thread.commentsOne", { count: post.data.comment_count })
                  : t("thread.comments", { count: post.data.comment_count })}
              </h2>
              <Select value={sort} onValueChange={(next) => setSort(next as FeedSort)}>
                <SelectTrigger className="w-36" aria-label={t("thread.sortComments")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="best">{t("common.best")}</SelectItem>
                  <SelectItem value="newest">{t("common.newest")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="card-soft mt-4 p-4">
              <CommentComposer postId={postId} placeholder={t("thread.addComment")} />
            </div>

            <div className="mt-4">
              {comments.isLoading ? <Loading label={t("thread.loadingComments")} /> : null}
              {comments.error ? (
                <Failure error={comments.error} onRetry={() => void comments.refetch()} />
              ) : null}
              {comments.data?.map((comment) => (
                <Comment key={comment.id} comment={comment} depth={0} />
              ))}
              {comments.isSuccess && !comments.data.length ? (
                <Empty title={t("thread.noComments.title")} text={t("thread.noComments.text")} />
              ) : null}
            </div>
          </section>
        </>
      ) : null}

      {post.isSuccess && !post.data ? (
        <Empty
          title={t("thread.unavailable.title")}
          text={t("thread.unavailable.text")}
          action={
            <Button asChild variant="outline">
              <Link to="/dashboard">{t("thread.backHome")}</Link>
            </Button>
          }
        />
      ) : null}
    </AppShell>
  );
}
