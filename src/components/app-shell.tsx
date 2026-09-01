import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  GraduationCap,
  MessagesSquare,
  HelpCircle,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { AuthGuard } from "@/components/auth-guard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { avatarUrl, getMemberProfile } from "@/lib/data";
import { initials } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "nav.home", icon: Home },
  { to: "/universities", label: "nav.universities", icon: GraduationCap },
  { to: "/questions", label: "nav.questions", icon: HelpCircle },
  { to: "/messages", label: "nav.messages", icon: MessagesSquare },
  { to: "/profile", label: "nav.profile", icon: User },
  { to: "/settings", label: "nav.settings", icon: Settings },
] as const;

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2", className)}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <GraduationCap className="size-5" />
      </span>
      <span className="text-lg font-bold tracking-tight">TAKKA</span>
    </Link>
  );
}

export function AppShell({
  children,
  right,
  title,
}: {
  children: ReactNode;
  right?: ReactNode;
  title?: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { profile, signOut, user } = useAuth();
  const t = useT();

  const member = useQuery({
    queryKey: ["member-profile", user?.id],
    queryFn: () => getMemberProfile(user!.id),
    enabled: Boolean(user),
  });
  const verified = member.data?.student?.verification_status === "verified";

  // "/profile" must not light up while viewing another member at "/profiles/:id".
  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-sidebar px-4 py-6 lg:flex">
          <Logo className="px-2" />
          <nav className="mt-8 flex flex-1 flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive(item.to)
                    ? "bg-primary-soft text-primary-soft-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="size-[18px]" />
                {t(item.label)}
              </Link>
            ))}
          </nav>
          {verified ? (
            <div className="rounded-lg bg-primary-soft p-4">
              <p className="text-sm font-semibold text-primary-soft-foreground">
                {t("shell.verified.title")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{t("shell.verified.text")}</p>
            </div>
          ) : null}
        </aside>

        <div className="lg:pl-64">
          <header className="pt-safe sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
              <div className="lg:hidden">
                <Logo />
              </div>
              <h1 className="hidden text-base font-semibold lg:block">{title ?? t("nav.home")}</h1>
              <div className="ml-auto" />
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("shell.logOut")}
                onClick={() => void signOut()}
                className="rounded-full"
              >
                <LogOut className="size-[18px]" />
              </Button>
              <Link to="/profile" aria-label={t("shell.openProfile")}>
                <Avatar className="size-9 border border-border">
                  {profile?.avatar_path ? (
                    <AvatarImage
                      src={avatarUrl(profile.avatar_path) ?? undefined}
                      alt={profile.full_name}
                    />
                  ) : null}
                  <AvatarFallback className="bg-primary-soft text-xs font-semibold text-primary-soft-foreground">
                    {profile ? initials(profile.full_name) : "?"}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </header>

          <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 lg:pb-12">
            <div className={cn("gap-6", right && "xl:grid xl:grid-cols-[minmax(0,1fr)_320px]")}>
              <main className="min-w-0">{children}</main>
              {right ? <aside className="mt-6 space-y-4 xl:mt-0">{right}</aside> : null}
            </div>
          </div>
        </div>

        <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur lg:hidden">
          <div className="flex items-center justify-around px-1 pt-1">
            {nav.slice(0, 5).map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors",
                  isActive(item.to) ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-5" />
                <span className="max-w-full truncate px-0.5">{t(item.label)}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </AuthGuard>
  );
}
