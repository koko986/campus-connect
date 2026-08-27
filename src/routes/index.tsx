import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, MessagesSquare, Search, Sparkle } from "lucide-react";

import heroImg from "@/assets/hero-students.jpg";
import { Logo } from "@/components/app-shell";
import { UniversityCard } from "@/components/community";
import { Button } from "@/components/ui/button";
import { universities } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UniVoice — Choose a university with help from real students" },
      {
        name: "description",
        content:
          "UniVoice connects high school graduates with current university students. Explore universities, read honest posts, ask questions and chat.",
      },
      { property: "og:title", content: "UniVoice — Choose a university with help from real students" },
      {
        property: "og:description",
        content: "Explore universities through the experiences of the people who actually study there.",
      },
    ],
  }),
  component: Landing,
});

const steps = [
  {
    icon: Search,
    title: "Explore universities",
    text: "Browse clean profiles with departments, campuses, facilities and student ratings.",
  },
  {
    icon: MessagesSquare,
    title: "Ask real students",
    text: "Post a question and get answers from people currently studying in that department.",
  },
  {
    icon: BadgeCheck,
    title: "Decide with confidence",
    text: "Compare honest experiences instead of brochures, then chat one-to-one before you apply.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="rounded-full">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link to="/get-started">Get started</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-2 lg:py-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-soft-foreground">
            <Sparkle className="size-3" /> Student community · Myanmar universities
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">
            Choose your university through the students who study there.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            Rankings and brochures won't tell you what first year really feels like. UniVoice connects you
            with verified current students — read their posts, ask questions, and chat before you decide.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link to="/get-started">
                Get started <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link to="/universities">Browse universities</Link>
            </Button>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
            {[
              ["6", "Universities"],
              ["500+", "Student posts"],
              ["1.2k", "Answers"],
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
            alt="Students talking on a university campus lawn"
            width={1280}
            height={960}
            className="w-full rounded-2xl object-cover"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold">How it works</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.title} className="card-soft p-6">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-soft text-primary-soft-foreground">
                <s.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold">Popular universities</h2>
          <Button asChild variant="ghost" className="rounded-full">
            <Link to="/universities">See all</Link>
          </Button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {universities.slice(0, 3).map((u) => (
            <UniversityCard key={u.id} university={u} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 pt-6">
        <div className="rounded-3xl bg-primary-soft px-6 py-12 text-center">
          <h2 className="text-2xl font-bold text-primary-soft-foreground sm:text-3xl">
            From "I don't know which university to choose" to a confident decision.
          </h2>
          <Button asChild size="lg" className="mt-6 rounded-full">
            <Link to="/get-started">Create your free account</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        UniVoice · A student community for university discovery
      </footer>
    </div>
  );
}
