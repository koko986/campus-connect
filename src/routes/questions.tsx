import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth-guard";
import { QuestionsPage } from "@/components/live-app-pages";
export const Route = createFileRoute("/questions")({ component: QuestionsRoute });
function QuestionsRoute() {
  return (
    <AuthGuard>
      <QuestionsPage />
    </AuthGuard>
  );
}
