import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, LoaderCircle, RefreshCw, ShieldCheck, ShieldBan } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/lib/auth";
import { adminConsoleUrl, getAccountStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { initialized, signOut, user } = useAuth();
  const navigate = useNavigate();
  const t = useT();
  const status = useQuery({
    queryKey: ["account-status", user?.id],
    queryFn: getAccountStatus,
    enabled: Boolean(user),
    retry: false,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (initialized && !user) navigate({ to: "/login", replace: true });
  }, [initialized, navigate, user]);

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

  if (status.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoaderCircle
          className="size-6 animate-spin text-primary"
          aria-label={t("guard.loadingAccount")}
        />
      </div>
    );
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

  if (status.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-md border bg-background p-8 text-center">
          <ShieldBan className="mx-auto size-10 text-destructive" />
          <h1 className="mt-4 text-2xl font-bold">{t("guard.error.title")}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{t("guard.error.text")}</p>
          <Button className="mt-6 gap-2" variant="outline" onClick={() => void status.refetch()}>
            <RefreshCw aria-hidden="true" className="size-4" />
            {t("common.retry")}
          </Button>
        </div>
      </div>
    );
  }

  if (status.data?.administrator) {
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
          <p className="mt-3 text-sm text-muted-foreground">{t("guard.admin.text")}</p>
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
