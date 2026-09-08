import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth-guard";
import { MessagesPage } from "@/components/messages";
export const Route = createFileRoute("/messages")({
  component: MessagesRoute,
  validateSearch: (search: Record<string, unknown>): { conversation?: string | undefined } => ({
    conversation: typeof search["conversation"] === "string" ? search["conversation"] : undefined,
  }),
});
function MessagesRoute() {
  const { conversation } = Route.useSearch();
  return (
    <AuthGuard>
      <MessagesPage initialConversationId={conversation} />
    </AuthGuard>
  );
}
