import { useQuery } from "@tanstack/react-query";
import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { adminApi } from "@/lib/admin-api";

// eslint-disable-next-line react-refresh/only-export-components
export function useAdminIdentity() {
  return useQuery({
    queryKey: ["admin-identity"],
    queryFn: adminApi.me,
    retry: false,
    staleTime: 60_000,
  });
}

export function AdminGuard({ children }: { children: ReactNode }) {
  const admin = useAdminIdentity();
  if (admin.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        Checking administrator access...
      </div>
    );
  }
  if (admin.isError) return <Navigate to="/dashboard" />;
  return children;
}
