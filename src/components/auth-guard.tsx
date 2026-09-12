import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, LoaderCircle, RefreshCw, ShieldCheck, ShieldBan } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { useAuth } from "@/lib/auth";
import { ApiRequestError, adminConsoleUrl, getAccountStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { initialized, signOut, user } = useAuth();
  const navigate = useNavigate();
  const t = useT();
  const [statusGraceExpired, setStatusGraceExpired] = useState(false);
  const status = useQuery({
    queryKey: ["account-status", user?.id],
    queryFn: getAccountStatus,
    enabled: Boolean(user),
    retry: false,
    staleTime: 30_000,
  });
  const allowLocalStatusBypass =
    import.meta.env.DEV &&
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname);

  function renderAccountStatusError() {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-md border bg-background p-8 text-center">
          <ShieldBan className="mx-auto size-10 text-destructive" />
          <h1 className="mt-4 text-2xl font-bold">{t("guard.error.title")}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{t("guard.error.text")}</p>
          <Button className="mt-6 gap-2" variant="outline" onClick={() => void status.refetch()}>
            <RefreshCw aria-hidden="true" className="size-4" />
            {t("common.tryAgain")}
          </Button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (initialized && !user) navigate({ to: "/login", replace: true });
  }, [initialized, navigate, user]);

  useEffect(() => {
    setStatusGraceExpired(false);
    if (!user || !status.isPending) return;
    const timeout = window.setTimeout(() => setStatusGraceExpired(true), 7_000);
    return () => window.clearTimeout(timeout);
  }, [status.isPending, user]);

  if (!initialized || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoaderCircle
          className="size-6 animate-spin text-primary"
          aria-label={t("guard.loadingAccount")}
        />
      </div>
    );
  }

  if (status.isPending && !statusGraceExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoaderCircle
          className="size-6 animate-spin text-primary"
          aria-label={t("guard.loadingAccount")}
        />
      </div>
    );
  }

  if (status.isPending && statusGraceExpired) {
    return allowLocalStatusBypass ? children : renderAccountStatusError();
  }

  if (status.data?.status === "BLOCKED") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-md border bg-background p-8 text-center">
          <ShieldBan className="mx-auto size-10 text-destructive" />
          <h1 className="mt-4 text-2xl font-bold">{t("guard.suspended.title")}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {status.data.reason || t("guard.suspended.text")}
          </p>
          <Button className="mt-6" variant="outline" onClick={() => void signOut()}>
            {t("shell.logOut")}
          </Button>
        </div>
      </div>
    );
  }

  const statusError = status.error;
  const accountServiceUnavailable =
    statusError instanceof ApiRequestError &&
    (statusError.status === 0 || statusError.status >= 500);

  if (accountServiceUnavailable) {
    return allowLocalStatusBypass ? children : renderAccountStatusError();
  }

  if (status.isError) {
    return renderAccountStatusError();
  }

  const statusEmailMatchesSession =
    Boolean(status.data?.email && user.email) &&
    status.data.email.trim().toLowerCase() === user.email.trim().toLowerCase();
  if (status.data?.administrator && statusEmailMatchesSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-md border bg-background p-8 text-center">
          <ShieldCheck className="mx-auto size-11 text-primary" />
          <p className="mt-4 text-xs font-bold uppercase text-primary">
            {status.data.adminRole === "SUPER_ADMIN"
              ? t("guard.admin.superAdmin")
              : t("guard.admin.moderator")}
          </p>
          <h1 className="mt-2 text-2xl font-bold">{t("guard.admin.title")}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("guard.admin.text", { email: user.email ?? t("notifications.takka") })}
          </p>
          <Button className="mt-6 gap-2" asChild>
            <a href={adminConsoleUrl}>
              {t("guard.admin.openConsole")}
              <ExternalLink aria-hidden="true" className="size-4" />
            </a>
          </Button>
          <Button className="mt-3 w-full" variant="ghost" onClick={() => void signOut()}>
            {t("shell.logOut")}
          </Button>
        </div>
      </div>
    );
  }

  return children;
}
