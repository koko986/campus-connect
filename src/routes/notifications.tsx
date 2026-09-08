import { createFileRoute } from "@tanstack/react-router";

import { AuthGuard } from "@/components/auth-guard";
import { NotificationsPage } from "@/components/notifications";

export const Route = createFileRoute("/notifications")({ component: NotificationsRoute });

function NotificationsRoute() {
  return (
    <AuthGuard>
      <NotificationsPage />
    </AuthGuard>
  );
}
