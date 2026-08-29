import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardPage } from "@/components/live-app-pages";
export const Route = createFileRoute("/dashboard")({
  component: DashboardRoute,
  validateSearch: (search: Record<string, unknown>): { university?: string | undefined } => ({
    university: typeof search["university"] === "string" ? search["university"] : undefined,
  }),
});
function DashboardRoute() {
  const { university } = Route.useSearch();
  return (
    <AuthGuard>
      <DashboardPage universityId={university} />
    </AuthGuard>
  );
}
