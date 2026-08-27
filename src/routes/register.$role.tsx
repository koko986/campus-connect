import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import type { FormEvent } from "react";

import { Logo } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { universities } from "@/lib/mock-data";

export const Route = createFileRoute("/register/$role")({
  head: () => ({
    meta: [
      { title: "Create your account — UniVoice" },
      { name: "description", content: "Set up your UniVoice profile as a student or a future student." },
      { property: "og:title", content: "Create your account — UniVoice" },
      { property: "og:description", content: "Join the UniVoice student community in under a minute." },
    ],
  }),
  component: RegisterPage,
});

function Field({
  id,
  label,
  ...props
}: { id: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} className="rounded-xl" {...props} />
    </div>
  );
}

function RegisterPage() {
  const { role } = Route.useParams();
  const navigate = useNavigate();
  const isStudent = role === "student";

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
        <Logo />
        <Link to="/get-started" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Change account type
        </Link>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <span className="inline-flex rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-soft-foreground">
          {isStudent ? "🎓 University student" : "🎒 Looking for a university"}
        </span>
        <h1 className="mt-4 text-3xl font-extrabold">
          {isStudent ? "Tell us about your university" : "Tell us what you're looking for"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isStudent
            ? "Your details appear on your profile so prospective students know who they're talking to."
            : "We use your preferences to highlight universities and questions that match your plans."}
        </p>

        <form onSubmit={onSubmit} className="card-soft mt-7 space-y-5 p-6">
          <div className="flex items-center gap-4">
            <span className="flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground">
              <Camera className="size-6" />
            </span>
            <div>
              <p className="text-sm font-semibold">Profile picture</p>
              <p className="text-xs text-muted-foreground">PNG or JPG, up to 2 MB.</p>
            </div>
            <Button type="button" variant="outline" size="sm" className="ml-auto rounded-full">
              Upload
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="name" label="Full name" required placeholder="John Doe" />
            <Field id="email" label="Email" type="email" required placeholder="you@example.com" />
            <Field id="password" label="Password" type="password" required placeholder="••••••••" />
            <Field id="confirm" label="Confirm password" type="password" required placeholder="••••••••" />
          </div>

          {isStudent ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="university">University</Label>
                <Select>
                  <SelectTrigger id="university" className="rounded-xl">
                    <SelectValue placeholder="Select your university" />
                  </SelectTrigger>
                  <SelectContent>
                    {universities.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Field id="faculty" label="Faculty / Department" placeholder="Faculty of Computing" />
              <Field id="major" label="Major" placeholder="Computer Science" />
              <div className="space-y-1.5">
                <Label htmlFor="year">Academic year</Label>
                <Select>
                  <SelectTrigger id="year" className="rounded-xl">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Postgraduate"].map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Field id="campus" label="Campus" placeholder="Main campus" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="field" label="Preferred field of study" placeholder="Computing" />
              <div className="space-y-1.5">
                <Label htmlFor="location">Preferred location</Label>
                <Select>
                  <SelectTrigger id="location" className="rounded-xl">
                    <SelectValue placeholder="Any location" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Yangon", "Mandalay", "Nay Pyi Taw", "Taunggyi", "Any"].map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Field id="majors" label="Interested majors" placeholder="Software Engineering, Design" />
              <Field id="prefs" label="Other preferences" placeholder="Hostel, small class sizes…" />
            </div>
          )}

          <Button type="submit" size="lg" className="w-full rounded-full">
            Create account
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            By continuing you agree to our community guidelines.
          </p>
        </form>
      </main>
    </div>
  );
}
