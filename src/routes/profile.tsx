import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth-guard";
import { ProfilePage } from "@/components/live-app-pages";
export const Route = createFileRoute("/profile")({ component: ProfileRoute });
function ProfileRoute() {
  return (
    <AuthGuard>
      <ProfilePage />
    </AuthGuard>
  );
}
