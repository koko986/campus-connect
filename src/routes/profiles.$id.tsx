import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth-guard";
import { MemberProfilePage } from "@/components/member-profile";
export const Route = createFileRoute("/profiles/$id")({ component: MemberProfileRoute });
function MemberProfileRoute() {
  return (
    <AuthGuard>
      <MemberProfilePage profileId={Route.useParams().id} />
    </AuthGuard>
  );
}
