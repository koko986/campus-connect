import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth-guard";
import { QuestionsPage } from "@/components/live-app-pages";
export const Route = createFileRoute("/questions")({
  component: QuestionsRoute,
  validateSearch: (search: Record<string, unknown>): { university?: string | undefined } => ({
    university: typeof search["university"] === "string" ? search["university"] : undefined,
  }),
});
function QuestionsRoute() {
  const { university } = Route.useSearch();
  return (
    <AuthGuard>
      <QuestionsPage universityId={university} />
    </AuthGuard>
  );
}
