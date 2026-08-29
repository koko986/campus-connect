import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircle, ShieldBan } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/lib/auth";
import { getAccountStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { initialized, signOut, user } = useAuth();
  const navigate = useNavigate();
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
        <LoaderCircle className="size-6 animate-spin text-primary" aria-label="Loading account" />
      </div>
    );
  }

  if (status.data?.status === "BLOCKED") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-md border bg-background p-8 text-center">
          <ShieldBan className="mx-auto size-10 text-destructive" />
          <h1 className="mt-4 text-2xl font-bold">Account suspended</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {status.data.reason || "This account has been suspended by a TAKKA administrator."}
          </p>
          <Button className="mt-6" variant="outline" onClick={() => void signOut()}>
            Log out
          </Button>
        </div>
      </div>
    );
  }

  return children;
}
