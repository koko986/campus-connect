import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Backpack, GraduationCap } from "lucide-react";

import { Logo } from "@/components/app-shell";
import { LanguageSwitcher } from "@/components/language-switcher";
import { initialLanguage, translate, useT } from "@/lib/i18n";

export const Route = createFileRoute("/get-started")({
  head: () => {
    const language = initialLanguage();
    return {
      meta: [
        { title: translate(language, "getStarted.meta.title") },
        { name: "description", content: translate(language, "getStarted.meta.description") },
        { property: "og:title", content: translate(language, "getStarted.meta.ogTitle") },
        {
          property: "og:description",
          content: translate(language, "getStarted.meta.ogDescription"),
        },
      ],
    };
  },
  component: GetStarted,
});

const options = [
  {
    role: "student",
    icon: GraduationCap,
    emoji: "🎓",
    title: "getStarted.student.title",
    text: "getStarted.student.text",
  },
  {
    role: "prospective",
    icon: Backpack,
    emoji: "🎒",
    title: "getStarted.prospective.title",
    text: "getStarted.prospective.text",
  },
] as const;

function GetStarted() {
  const t = useT();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
        <Logo />
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            to="/login"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {t("auth.logIn")}
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-12">
        <h1 className="text-center text-3xl font-extrabold sm:text-4xl">
          {t("getStarted.heading")}
        </h1>
        <p className="mt-3 text-center text-sm text-muted-foreground">{t("getStarted.text")}</p>

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
                {t(o.title)}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(o.text)}</p>
              <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                {t("common.continue")}{" "}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
