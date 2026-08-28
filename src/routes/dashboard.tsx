import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardPage } from "@/components/live-app-pages";
export const Route = createFileRoute("/dashboard")({ component: DashboardRoute });
function DashboardRoute() {
  return (
    <AuthGuard>
      <DashboardPage />
    </AuthGuard>
  );
}
