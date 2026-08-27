import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Backpack, GraduationCap } from "lucide-react";

import { Logo } from "@/components/app-shell";

export const Route = createFileRoute("/get-started")({
  head: () => ({
    meta: [
      { title: "Get started — UniVoice" },
      {
        name: "description",
        content: "Tell us whether you're a current university student or looking for a university.",
      },
      { property: "og:title", content: "Get started — UniVoice" },
      { property: "og:description", content: "Choose your account type and join the student community." },
    ],
  }),
  component: GetStarted,
});

const options = [
  {
    role: "student",
    icon: GraduationCap,
    emoji: "🎓",
    title: "I'm a University Student",
    text: "I am currently studying at a university and want to share my experience.",
  },
  {
    role: "prospective",
    icon: Backpack,
    emoji: "🎒",
    title: "I'm Looking for a University",
    text: "I want to explore universities and learn from current students.",
  },
] as const;

function GetStarted() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
        <Logo />
        <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Log in
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-12">
        <h1 className="text-center text-3xl font-extrabold sm:text-4xl">What brings you here?</h1>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Pick the option that fits you — you can change details later in settings.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {options.map((o) => (
            <Link
              key={o.role}
              to="/register/$role"
              params={{ role: o.role }}
              className="card-soft group flex flex-col p-7 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-[var(--shadow-lift)]"
            >
              <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary-soft-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <o.icon className="size-7" />
              </span>
              <h2 className="mt-5 text-lg font-bold">
                <span aria-hidden className="mr-1">
                  {o.emoji}
                </span>
                {o.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{o.text}</p>
              <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Continue <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
