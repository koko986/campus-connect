import { createFileRoute } from "@tanstack/react-router";

import { AuthGuard } from "@/components/auth-guard";
import { SavedPage } from "@/components/live-app-pages";

export const Route = createFileRoute("/saved")({
  component: SavedRoute,
});

function SavedRoute() {
  return (
    <AuthGuard>
      <SavedPage />
    </AuthGuard>
  );
}
