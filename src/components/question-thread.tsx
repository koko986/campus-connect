import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUp, CheckCircle2, MessageSquareText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { AuthorLine } from "@/components/community";
import { Empty, Failure, Loading } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import type { QuestionAnswer } from "@/lib/data";
import {
  createAnswer,
  getQuestion,
  listAnswers,
  setAcceptedAnswer,
  setAnswerVoted,
} from "@/lib/data";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function AnswerComposer({ questionId }: { questionId: string }) {
  const { user } = useAuth();
  const client = useQueryClient();
  const t = useT();
  const [body, setBody] = useState("");
  const submit = useMutation({
    mutationFn: () => createAnswer(questionId, user!.id, body),
    onSuccess: async () => {
      setBody("");
      toast.success(t("questionThread.answerPosted"));
      await Promise.all([
        client.invalidateQueries({ queryKey: ["question", questionId] }),
        client.invalidateQueries({ queryKey: ["answers", questionId] }),
        client.invalidateQueries({ queryKey: ["questions"] }),
      ]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="card-soft p-4 sm:p-5">
      <label htmlFor="answer-body" className="text-sm font-semibold">
        {t("questionThread.yourAnswer")}
      </label>
      <Textarea
        id="answer-body"
        value={body}
        maxLength={4000}
        onChange={(event) => setBody(event.target.value)}
        placeholder={t("questionThread.answerPlaceholder")}
        className="mt-3 min-h-28 resize-y"
      />
      <div className="mt-3 flex justify-end">
        <Button disabled={!body.trim() || submit.isPending} onClick={() => submit.mutate()}>
          {submit.isPending ? t("questions.posting") : t("questionThread.postAnswer")}
        </Button>
      </div>
    </div>
  );
}

function AnswerRow({ answer, canAccept }: { answer: QuestionAnswer; canAccept: boolean }) {
  const { user } = useAuth();
  const client = useQueryClient();
  const t = useT();
  const refresh = () => client.invalidateQueries({ queryKey: ["answers", answer.question_id] });
  const vote = useMutation({
    mutationFn: () => setAnswerVoted(answer.id, user!.id, !answer.voted),
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });
  const accept = useMutation({
    mutationFn: () => setAcceptedAnswer(answer.id),
    onSuccess: async () => {
      toast.success(t("questionThread.acceptedToast"));
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <article
      className={cn(
        "border-b border-border py-5 last:border-b-0",
        answer.is_accepted && "rounded-lg border border-primary/30 bg-primary-soft/40 px-4",
      )}
    >
      <div className="flex items-start gap-3">
        <Button
          variant={answer.voted ? "secondary" : "outline"}
          size="sm"
          className={cn(
            "h-auto min-w-12 flex-col gap-0.5 px-2 py-2",
            answer.voted && "text-primary",
          )}
          disabled={vote.isPending}
          aria-pressed={answer.voted}
          aria-label={
            answer.voted ? t("questionThread.removeHelpful") : t("questionThread.helpful")
          }
          onClick={() => vote.mutate()}
        >
          <ArrowUp className={cn("size-4", answer.voted && "stroke-[3]")} />
          <span>{answer.vote_count}</span>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <AuthorLine profile={answer.author} time={answer.created_at} />
            {answer.is_accepted ? (
              <Badge className="gap-1 bg-success text-success-foreground">
                <CheckCircle2 className="size-3.5" />
                {t("questionThread.accepted")}
              </Badge>
            ) : null}
          </div>
          <p className="mt-3 break-words whitespace-pre-wrap text-sm leading-relaxed">
            {answer.body}
          </p>
          {canAccept && !answer.is_accepted ? (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 -ml-3 text-primary"
              disabled={accept.isPending}
              onClick={() => accept.mutate()}
            >
              <CheckCircle2 className="size-4" />
              {t("questionThread.acceptAnswer")}
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function QuestionThreadPage({ questionId }: { questionId: string }) {
  const { user } = useAuth();
  const t = useT();
  const question = useQuery({
    queryKey: ["question", questionId],
    queryFn: () => getQuestion(questionId),
    retry: false,
  });
  const answers = useQuery({
    queryKey: ["answers", questionId, user!.id],
    queryFn: () => listAnswers(questionId, user!.id),
    enabled: Boolean(question.data),
  });

  return (
    <AppShell title={t("questionThread.title")}>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
        <Link to="/questions">
          <ArrowLeft className="size-4" />
          {t("questionThread.back")}
        </Link>
      </Button>

      {question.isLoading ? <Loading label={t("questionThread.loading")} /> : null}
      {question.error ? (
        <Failure error={question.error} onRetry={() => void question.refetch()} />
      ) : null}

      {question.data ? (
        <div className="mx-auto max-w-3xl">
          <article className="card-soft p-5 sm:p-6">
            <div className="flex flex-wrap gap-2">
              {question.data.university ? (
                <Link to="/universities/$id" params={{ id: question.data.university.id }}>
                  <Badge variant="secondary" className="hover:bg-primary-soft">
                    {question.data.university.short_name ?? question.data.university.name}
                  </Badge>
                </Link>
              ) : null}
              {question.data.question_tags.map(({ tag }) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
            <h2 className="mt-4 text-xl font-bold leading-snug sm:text-2xl">
              {question.data.title}
            </h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground sm:text-base">
              {question.data.body}
            </p>
            <div className="mt-5 border-t border-border pt-4">
              <AuthorLine profile={question.data.author} time={question.data.created_at} />
            </div>
          </article>

          <section id="answers" className="mt-6 scroll-mt-24">
            <div className="mb-3 flex items-center gap-2">
              <MessageSquareText className="size-5 text-primary" />
              <h3 className="text-lg font-bold">
                {t("questions.answers", { count: answers.data?.length ?? 0 })}
              </h3>
            </div>
            <AnswerComposer questionId={questionId} />
            <div className="mt-5">
              {answers.isLoading ? <Loading label={t("questionThread.loadingAnswers")} /> : null}
              {answers.error ? (
                <Failure error={answers.error} onRetry={() => void answers.refetch()} />
              ) : null}
              {answers.data?.map((answer) => (
                <AnswerRow
                  key={answer.id}
                  answer={answer}
                  canAccept={question.data?.author_id === user!.id}
                />
              ))}
              {answers.isSuccess && !answers.data.length ? (
                <Empty
                  title={t("questionThread.noAnswers.title")}
                  text={t("questionThread.noAnswers.text")}
                />
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      {question.isSuccess && !question.data ? (
        <Empty
          title={t("questionThread.unavailable.title")}
          text={t("questionThread.unavailable.text")}
          action={
            <Button asChild variant="outline">
              <Link to="/questions">{t("questionThread.back")}</Link>
            </Button>
          }
        />
      ) : null}
    </AppShell>
  );
}
