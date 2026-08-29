import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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
 * translated into something a member can act on.
 */
function readableMessage(error: Error) {
  const message = error.message || "Something went wrong.";
  if (/row-level security|permission denied|not authorized/i.test(message)) {
    return "You do not have access to this content.";
  }
  if (/fetch|network|failed to fetch/i.test(message)) {
    return "You appear to be offline. Check your connection and try again.";
  }
  return message;
}

export function Failure({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
        <span>{readableMessage(error)}</span>
        {onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
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
