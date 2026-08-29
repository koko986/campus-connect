import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth-guard";
import { MessagesPage } from "@/components/messages";
export const Route = createFileRoute("/messages")({ component: MessagesRoute });
function MessagesRoute() {
  return (
    <AuthGuard>
      <MessagesPage />
    </AuthGuard>
  );
}
