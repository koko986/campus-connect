import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, MessagesSquare, Search, Sparkle } from "lucide-react";

import heroImg from "@/assets/hero-students.jpg";
import { Logo } from "@/components/app-shell";
import { UniversityCard } from "@/components/community";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { listUniversities } from "@/lib/data";
import { initialLanguage, translate, useT } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => {
    const language = initialLanguage();
    return {
      meta: [
        { title: translate(language, "landing.meta.title") },
        { name: "description", content: translate(language, "landing.meta.description") },
        { property: "og:title", content: translate(language, "landing.meta.ogTitle") },
        { property: "og:description", content: translate(language, "landing.meta.ogDescription") },
      ],
    };
  },
  component: Landing,
});

const steps = [
  { icon: Search, title: "landing.step.explore.title", text: "landing.step.explore.text" },
  { icon: MessagesSquare, title: "landing.step.ask.title", text: "landing.step.ask.text" },
  { icon: BadgeCheck, title: "landing.step.decide.title", text: "landing.step.decide.text" },
] as const;

function Landing() {
  const t = useT();
  const universities = useQuery({ queryKey: ["universities"], queryFn: listUniversities });
  const departmentCount =
    universities.data?.reduce((total, university) => total + university.departments.length, 0) ?? 0;
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <LanguageSwitcher className="mr-1" />
          <Button asChild variant="ghost" className="rounded-full">
            <Link to="/login">{t("auth.logIn")}</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link to="/get-started">{t("auth.getStarted")}</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-2 lg:py-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-soft-foreground">
            <Sparkle className="size-3" /> {t("landing.badge")}
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">
            {t("landing.heading")}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            {t("landing.subheading")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link to="/get-started">
                {t("auth.getStarted")} <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link to="/universities">{t("landing.browseUniversities")}</Link>
            </Button>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
            {[
              [String(universities.data?.length ?? 0), t("landing.stat.universities")],
              [String(departmentCount), t("landing.stat.departments")],
              [t("landing.stat.live"), t("landing.stat.database")],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="text-2xl font-bold">{value}</dt>
                <dd className="text-xs text-muted-foreground">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="card-soft overflow-hidden p-2">
          <img
            src={heroImg}
            alt={t("landing.heroAlt")}
            width={1280}
            height={960}
            className="w-full rounded-2xl object-cover"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold">{t("landing.howItWorks")}</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.title} className="card-soft p-6">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-soft text-primary-soft-foreground">
                <step.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{t(step.title)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(step.text)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold">{t("landing.popular")}</h2>
          <Button asChild variant="ghost" className="rounded-full">
            <Link to="/universities">{t("common.seeAll")}</Link>
          </Button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {universities.data?.slice(0, 3).map((u) => (
            <UniversityCard key={u.id} university={u} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 pt-6">
        <div className="rounded-3xl bg-primary-soft px-6 py-12 text-center">
          <h2 className="text-2xl font-bold text-primary-soft-foreground sm:text-3xl">
            {t("landing.cta.heading")}
          </h2>
          <Button asChild size="lg" className="mt-6 rounded-full">
            <Link to="/get-started">{t("landing.cta.button")}</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        {t("landing.footer")}
      </footer>
    </div>
  );
}
