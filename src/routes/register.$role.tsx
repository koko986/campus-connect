import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";

import { Logo } from "@/components/app-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { listUniversities } from "@/lib/data";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/register/$role")({
  head: () => ({
    meta: [
      { title: "Create your account - TAKKA" },
      {
        name: "description",
        content: "Create a current-student or prospective-student TAKKA account.",
      },
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
      <Input id={id} name={id} className="rounded-xl" {...props} />
    </div>
  );
}

function RegisterPage() {
  const { role } = Route.useParams();
  const navigate = useNavigate();
  const isStudent = role === "student";
  const universitiesQuery = useQuery({ queryKey: ["universities"], queryFn: listUniversities });
  const [universityId, setUniversityId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [preferredCity, setPreferredCity] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const departments = useMemo(
    () =>
      universitiesQuery.data?.find((university) => university.id === universityId)?.departments ??
      [],
    [universitiesQuery.data, universityId],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (password.length < 8) return setError("Use a password with at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    if (isStudent && !universityId) return setError("Select your university.");

    setError("");
    setPending(true);
    const metadata = isStudent
      ? {
          account_type: "current_student",
          full_name: String(form.get("name") ?? "").trim(),
          university_id: universityId,
          department_id: departmentId || null,
          academic_year: academicYear || null,
        }
      : {
          account_type: "prospective_student",
          full_name: String(form.get("name") ?? "").trim(),
          preferred_city: preferredCity || null,
          preferred_field: String(form.get("field") ?? "").trim() || null,
          preferred_degree_level: String(form.get("degree") ?? "").trim() || null,
          preferences: String(form.get("preferences") ?? "").trim() || null,
        };
    const result = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    setPending(false);
    if (result.error) return setError(result.error.message);
    if (result.data.session) await navigate({ to: "/dashboard", replace: true });
    else {
      setError(
        "Instant signup is not enabled in Supabase yet. Turn off Confirm email in Authentication > Sign In / Providers > Email, then try again.",
      );
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
        <Logo />
        <Link
          to="/get-started"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Change account type
        </Link>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <p className="text-sm font-semibold text-primary">
          {isStudent ? "University student" : "Looking for a university"}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold">Create your TAKKA account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use accurate details. They shape your profile and what the community can see.
        </p>
        <form onSubmit={onSubmit} className="card-soft mt-7 space-y-5 p-6">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="name"
              label="Full name"
              minLength={2}
              maxLength={120}
              required
              autoComplete="name"
            />
            <Field
              id="email"
              label="Email"
              type="email"
              required
              autoComplete="email"
              placeholder="student@demo.test"
            />
            <Field
              id="password"
              label="Password"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
            />
            <Field
              id="confirm"
              label="Confirm password"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
            />
          </div>
          {isStudent ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>University</Label>
                <Select
                  value={universityId}
                  onValueChange={(value) => {
                    setUniversityId(value);
                    setDepartmentId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        universitiesQuery.isLoading
                          ? "Loading universities..."
                          : "Select university"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {universitiesQuery.data?.map((university) => (
                      <SelectItem key={university.id} value={university.id}>
                        {university.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select
                  value={departmentId}
                  onValueChange={setDepartmentId}
                  disabled={!universityId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Academic year</Label>
                <Select value={academicYear} onValueChange={setAcademicYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 6 }, (_, index) => String(index + 1)).map((year) => (
                      <SelectItem key={year} value={year}>
                        Year {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="field" label="Preferred field" maxLength={160} />
              <Field id="degree" label="Preferred degree level" maxLength={120} />
              <div className="space-y-1.5">
                <Label>Preferred city</Label>
                <Select value={preferredCity} onValueChange={setPreferredCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any city" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Yangon", "Mandalay", "Nay Pyi Taw", "Taunggyi", "Any"].map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Field id="preferences" label="Other preferences" maxLength={1000} />
            </div>
          )}
          <Button
            type="submit"
            size="lg"
            disabled={pending || universitiesQuery.isError}
            className="w-full rounded-full"
          >
            {pending ? "Creating account..." : "Create account"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Demo mode accepts any valid email format and signs you in immediately.
          </p>
        </form>
      </main>
    </div>
  );
}
