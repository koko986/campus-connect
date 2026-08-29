import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  MessagesSquare,
  Plus,
  Search,
  Sparkle,
  UserCheck,
} from "lucide-react";

import heroImg from "@/assets/hero-students.jpg";
import { Logo } from "@/components/app-shell";
import { UniversityCard } from "@/components/community";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Marquee } from "@/components/marquee";
import { Tilt } from "@/components/tilt";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listUniversities } from "@/lib/data";
import { initialLanguage, translate, useT, type TranslationKey } from "@/lib/i18n";

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

type Step = { icon: typeof Search; title: TranslationKey; text: TranslationKey };

/** The journey for someone who has not picked a university yet. */
const choosing: Step[] = [
  { icon: Search, title: "landing.step.explore.title", text: "landing.step.explore.text" },
  { icon: MessagesSquare, title: "landing.step.ask.title", text: "landing.step.ask.text" },
  { icon: BadgeCheck, title: "landing.step.decide.title", text: "landing.step.decide.text" },
];

/** The journey for someone already enrolled, who is the source of everything above. */
const studying: Step[] = [
  { icon: UserCheck, title: "landing.student.verify.title", text: "landing.student.verify.text" },
  { icon: Sparkle, title: "landing.student.share.title", text: "landing.student.share.text" },
  {
    icon: MessagesSquare,
    title: "landing.student.answer.title",
    text: "landing.student.answer.text",
  },
];

const benefits = [
  {
    tone: "bg-blossom-wash",
    title: "landing.benefit.oneplace.title",
    text: "landing.benefit.oneplace.text",
  },
  {
    tone: "bg-mint-wash",
    title: "landing.benefit.honest.title",
    text: "landing.benefit.honest.text",
  },
  {
    tone: "bg-sky-wash",
    title: "landing.benefit.verified.title",
    text: "landing.benefit.verified.text",
  },
] as const;

const faqs = [
  { q: "landing.faq.free.q", a: "landing.faq.free.a" },
  { q: "landing.faq.who.q", a: "landing.faq.who.a" },
  { q: "landing.faq.verify.q", a: "landing.faq.verify.a" },
  { q: "landing.faq.join.q", a: "landing.faq.join.a" },
  { q: "landing.faq.language.q", a: "landing.faq.language.a" },
] as const satisfies readonly { q: TranslationKey; a: TranslationKey }[];

/**
 * A marquee row narrower than the viewport would leave a visible gap once the track scrolls, so
 * short lists are repeated until one pass is comfortably wider than any screen.
 */
function fill(items: string[], atLeast = 14) {
  if (items.length === 0) return items;
  const filled = [...items];
  while (filled.length < atLeast) filled.push(...items);
  return filled;
}

function StepGrid({ steps }: { steps: Step[] }) {
  const t = useT();
  return (
    <div className="grid gap-4 md:grid-cols-3">
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
  );
}

function Landing() {
  const t = useT();
  const universities = useQuery({ queryKey: ["universities"], queryFn: listUniversities });

  const departmentNames = [
    ...new Set(
      (universities.data ?? []).flatMap((university) =>
        university.departments.map((department) => department.name),
      ),
    ),
  ];
  const departmentCount = (universities.data ?? []).reduce(
    (total, university) => total + university.departments.length,
    0,
  );
  // Split so the two rows carry different names rather than the same list twice.
  const half = Math.ceil(departmentNames.length / 2);
  const topRow = fill(departmentNames.slice(0, half));
  const bottomRow = fill(departmentNames.slice(half));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
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
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 pt-14 pb-10 text-center lg:pt-24">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-soft-foreground">
          <Sparkle className="size-3" /> {t("landing.badge")}
        </span>
        {/* Instrument Serif ships at a single weight, so the size carries the emphasis, not bold. */}
        <h1 className="font-display mt-6 text-5xl leading-[1.05] font-normal tracking-tight sm:text-6xl lg:text-7xl">
          {t("landing.heading")}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {t("landing.subheading")}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="rounded-full">
            <Link to="/get-started">
              {t("auth.getStarted")} <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full">
            <Link to="/universities">{t("landing.browseUniversities")}</Link>
          </Button>
        </div>
        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <BadgeCheck className="size-4 text-primary" /> {t("landing.trust")}
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <Tilt degrees={4} lift={5} className="card-soft overflow-hidden p-2">
          <img
            src={heroImg}
            alt={t("landing.heroAlt")}
            width={1280}
            height={960}
            className="aspect-[16/9] w-full rounded-2xl object-cover"
          />
        </Tilt>
        <dl className="mx-auto mt-8 grid max-w-2xl grid-cols-3 gap-4 text-center">
          {[
            [String(universities.data?.length ?? 0), t("landing.stat.universities")],
            [String(departmentCount), t("landing.stat.departments")],
            [t("landing.stat.live"), t("landing.stat.database")],
          ].map(([value, label]) => (
            <div key={label}>
              <dt className="font-display text-3xl font-normal">{value}</dt>
              <dd className="text-xs text-muted-foreground">{label}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display max-w-2xl text-3xl leading-tight font-normal sm:text-4xl">
          {t("landing.benefits.heading")}
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {t("landing.benefits.text")}
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {benefits.map((benefit) => (
            <div key={benefit.title} className={`rounded-3xl p-7 ${benefit.tone}`}>
              <h3 className="font-display text-2xl font-normal">{t(benefit.title)}</h3>
              <p className="mt-3 text-sm leading-relaxed text-foreground/70">{t(benefit.text)}</p>
            </div>
          ))}
        </div>
      </section>

      {topRow.length > 0 ? (
        <section className="py-10">
          <h2 className="mx-auto mb-7 max-w-6xl px-4 text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t("landing.marquee.heading")}
          </h2>
          <div className="space-y-3">
            <Marquee items={topRow} seconds={52} />
            <Marquee items={bottomRow} seconds={64} reverse />
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {t("landing.howItWorks")}
        </p>
        <h2 className="font-display mt-3 max-w-2xl text-3xl leading-tight font-normal sm:text-4xl">
          {t("landing.walkthrough.heading")}
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {t("landing.walkthrough.text")}
        </p>
        <Tabs defaultValue="choosing" className="mt-8">
          <TabsList className="h-auto rounded-full p-1">
            <TabsTrigger value="choosing" className="rounded-full px-4 py-2">
              {t("landing.tab.prospective")}
            </TabsTrigger>
            <TabsTrigger value="studying" className="rounded-full px-4 py-2">
              {t("landing.tab.student")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="choosing" className="mt-6">
            <StepGrid steps={choosing} />
          </TabsContent>
          <TabsContent value="studying" className="mt-6">
            <StepGrid steps={studying} />
          </TabsContent>
        </Tabs>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-normal sm:text-4xl">{t("landing.popular")}</h2>
          <Button asChild variant="ghost" className="rounded-full">
            <Link to="/universities">{t("common.seeAll")}</Link>
          </Button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {universities.data?.slice(0, 3).map((university) => (
            <UniversityCard key={university.id} university={university} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="font-display text-3xl font-normal sm:text-4xl">
          {t("landing.faq.heading")}
        </h2>
        <div className="mt-8 divide-y divide-border border-y border-border">
          {faqs.map((faq) => (
            /* Native disclosure: keyboard accessible and open to in-page search without any JS. */
            <details key={faq.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold">
                {t(faq.q)}
                <Plus className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45" />
              </summary>
              <p className="mt-3 pr-8 text-sm leading-relaxed text-muted-foreground">{t(faq.a)}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-6 pb-20">
        <div className="rounded-[2.5rem] bg-mint px-6 py-16 text-center">
          <h2 className="font-display mx-auto max-w-2xl text-3xl leading-tight font-normal sm:text-4xl">
            {t("landing.cta.heading")}
          </h2>
          <Button asChild size="lg" className="mt-8 rounded-full">
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
