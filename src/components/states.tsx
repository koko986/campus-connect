import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useT, type Translate } from "@/lib/i18n";

export function Loading({ label }: { label: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
      <LoaderCircle className="mr-2 size-5 animate-spin" />
      {label}
    </div>
  );
}

/**
 * Row level security denials arrive as ordinary Postgres errors, so they are
 * translated into something a member can act on. Anything else is a message from
 * Supabase, which only speaks English; it is shown as-is rather than hidden.
 */
function readableMessage(t: Translate, error: Error) {
  const message = error.message;
  if (!message) return t("states.error.unknown");
  if (/row-level security|permission denied|not authorized/i.test(message)) {
    return t("states.error.noAccess");
  }
  if (/fetch|network|failed to fetch/i.test(message)) {
    return t("states.error.offline");
  }
  return message;
}

export function Failure({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  const t = useT();
  return (
    <Alert variant="destructive">
      <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
        <span>{readableMessage(t, error)}</span>
        {onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            {t("common.tryAgain")}
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

export function Empty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center sm:p-10">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
