import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth-guard";
import { PostThreadPage } from "@/components/post-thread";
export const Route = createFileRoute("/posts/$id")({ component: PostRoute });
function PostRoute() {
  return (
    <AuthGuard>
      <PostThreadPage postId={Route.useParams().id} />
    </AuthGuard>
  );
}
