import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  GraduationCap,
  MessagesSquare,
  HelpCircle,
  User,
  Settings,
  Bell,
  Search,
} from "lucide-react";
import type { ReactNode } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { currentUser } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/universities", label: "Universities", icon: GraduationCap },
  { to: "/questions", label: "Questions", icon: HelpCircle },
  { to: "/messages", label: "Messages", icon: MessagesSquare },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2", className)}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <GraduationCap className="size-5" />
      </span>
      <span className="text-lg font-bold tracking-tight">UniVoice</span>
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

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-sidebar px-4 py-6 lg:flex">
        <Logo className="px-2" />
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {nav.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-soft text-primary-soft-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="size-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="rounded-2xl bg-primary-soft p-4">
          <p className="text-sm font-semibold text-primary-soft-foreground">Verified student</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Your badge helps prospective students trust your answers.
          </p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
            <div className="lg:hidden">
              <Logo />
            </div>
            <h1 className="hidden text-base font-semibold lg:block">{title ?? "Home"}</h1>
            <div className="relative ml-auto hidden max-w-xs flex-1 md:block">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search universities, posts…" className="rounded-full pl-9" />
            </div>
            <button
              aria-label="Notifications"
              className="relative ml-auto flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:ml-0"
            >
              <Bell className="size-[18px]" />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-primary" />
            </button>
            <Link to="/profile">
              <Avatar className="size-9 border border-border">
                <AvatarFallback className="bg-primary-soft text-xs font-semibold text-primary-soft-foreground">
                  {currentUser.initials}
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

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {nav.slice(0, 5).map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
