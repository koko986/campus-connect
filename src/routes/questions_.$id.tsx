import { createFileRoute } from "@tanstack/react-router";

import { AuthGuard } from "@/components/auth-guard";
import { QuestionThreadPage } from "@/components/question-thread";

export const Route = createFileRoute("/questions_/$id")({ component: QuestionRoute });

function QuestionRoute() {
  return (
    <AuthGuard>
      <QuestionThreadPage questionId={Route.useParams().id} />
    </AuthGuard>
  );
}
