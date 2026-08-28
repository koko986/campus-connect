import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth-guard";
import { UniversityDetailPage } from "@/components/live-app-pages";
export const Route = createFileRoute("/universities/$id")({ component: UniversityRoute });
function UniversityRoute() {
  return (
    <AuthGuard>
      <UniversityDetailPage id={Route.useParams().id} />
    </AuthGuard>
  );
}
