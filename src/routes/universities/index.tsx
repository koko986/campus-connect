import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth-guard";
import { UniversitiesPage } from "@/components/live-app-pages";
export const Route = createFileRoute("/universities/")({ component: UniversitiesRoute });
function UniversitiesRoute() {
  return (
    <AuthGuard>
      <UniversitiesPage />
    </AuthGuard>
  );
}
