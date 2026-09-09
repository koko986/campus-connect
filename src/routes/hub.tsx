import { createFileRoute } from "@tanstack/react-router";

import { StudentHubPage } from "@/components/student-hub";

type HubTab = "decide" | "opportunities" | "buddies";

export const Route = createFileRoute("/hub")({
  validateSearch: (search: Record<string, unknown>): { tab?: HubTab; compare?: string } => ({
    tab:
      search.tab === "opportunities" || search.tab === "buddies" || search.tab === "decide"
        ? search.tab
        : undefined,
    compare: typeof search.compare === "string" ? search.compare : undefined,
  }),
  component: HubRoute,
});

function HubRoute() {
  const { tab, compare } = Route.useSearch();
  const compareIds = (compare ?? "")
    .split(",")
    .filter((id) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id),
    )
    .slice(0, 3);
  return <StudentHubPage initialTab={tab} initialCompareIds={compareIds} />;
}
