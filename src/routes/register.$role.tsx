import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";

import { Logo } from "@/components/app-shell";
import { LanguageSwitcher } from "@/components/language-switcher";
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
import { initialLanguage, translate, useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/register/$role")({
  head: () => {
    const language = initialLanguage();
    return {
      meta: [
        { title: translate(language, "register.meta.title") },
        { name: "description", content: translate(language, "register.meta.description") },
      ],
    };
  },
  component: RegisterPage,
});

/** The stored value stays English because it is written to the profile row. */
const cities = [
  { value: "Yangon", label: "register.city.Yangon" },
  { value: "Mandalay", label: "register.city.Mandalay" },
  { value: "Nay Pyi Taw", label: "register.city.NayPyiTaw" },
  { value: "Taunggyi", label: "register.city.Taunggyi" },
  { value: "Any", label: "register.city.Any" },
] as const;

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
  const t = useT();
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
    if (password.length < 8) return setError(t("register.error.password"));
    if (password !== confirm) return setError(t("register.error.mismatch"));
    if (isStudent && !universityId) return setError(t("register.error.university"));

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
      setError(t("register.error.confirmEmail"));
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="pt-safe mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-5">
        <Logo className="shrink-0 [&>span:last-child]:hidden sm:[&>span:last-child]:inline" />
        <div className="flex min-w-0 items-center justify-end gap-2">
          <LanguageSwitcher />
          <Link
            to="/get-started"
            className="text-right text-xs font-medium text-muted-foreground hover:text-foreground sm:text-sm"
          >
            {t("register.changeType")}
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <p className="text-sm font-semibold text-primary">
          {isStudent ? t("register.role.student") : t("register.role.prospective")}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold">{t("register.heading")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("register.text")}</p>
        <form onSubmit={onSubmit} className="card-soft mt-7 space-y-5 p-6">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="name"
              label={t("field.fullName")}
              minLength={2}
              maxLength={120}
              required
              autoComplete="name"
            />
            <Field
              id="email"
              label={t("field.email")}
              type="email"
              required
              autoComplete="email"
              placeholder={t("login.emailPlaceholder")}
            />
            <Field
              id="password"
              label={t("field.password")}
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
            />
            <Field
              id="confirm"
              label={t("field.confirmPassword")}
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
            />
          </div>
          {isStudent ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t("field.university")}</Label>
                <select
                  aria-label={t("field.university")}
                  value={universityId}
                  disabled={universitiesQuery.isLoading || universitiesQuery.isError}
                  onChange={(event) => {
                    setUniversityId(event.target.value);
                    setDepartmentId("");
                  }}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:hidden"
                >
                  <option value="">
                    {universitiesQuery.isLoading
                      ? t("register.loadingUniversities")
                      : t("register.selectUniversity")}
                  </option>
                  {universitiesQuery.data?.map((university) => (
                    <option key={university.id} value={university.id}>
                      {university.name}
                    </option>
                  ))}
                </select>
                <div className="hidden md:block">
                  <Select
                    value={universityId}
                    onValueChange={(value) => {
                      setUniversityId(value);
                      setDepartmentId("");
                    }}
                    disabled={universitiesQuery.isLoading || universitiesQuery.isError}
                  >
                    <SelectTrigger aria-label={t("field.university")}>
                      <SelectValue
                        placeholder={
                          universitiesQuery.isLoading
                            ? t("register.loadingUniversities")
                            : t("register.selectUniversity")
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
              </div>
              <div className="space-y-1.5">
                <Label>{t("field.department")}</Label>
                <select
                  aria-label={t("field.department")}
                  value={departmentId}
                  disabled={!universityId}
                  onChange={(event) => setDepartmentId(event.target.value)}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:hidden"
                >
                  <option value="">{t("register.selectDepartment")}</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
                <div className="hidden md:block">
                  <Select
                    value={departmentId}
                    onValueChange={setDepartmentId}
                    disabled={!universityId}
                  >
                    <SelectTrigger aria-label={t("field.department")}>
                      <SelectValue placeholder={t("register.selectDepartment")} />
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
              </div>
              <div className="space-y-1.5">
                <Label>{t("field.academicYear")}</Label>
                <select
                  aria-label={t("field.academicYear")}
                  value={academicYear}
                  onChange={(event) => setAcademicYear(event.target.value)}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:hidden"
                >
                  <option value="">{t("register.selectYear")}</option>
                  {Array.from({ length: 6 }, (_, index) => String(index + 1)).map((year) => (
                    <option key={year} value={year}>
                      {t("register.year", { year })}
                    </option>
                  ))}
                </select>
                <div className="hidden md:block">
                  <Select value={academicYear} onValueChange={setAcademicYear}>
                    <SelectTrigger aria-label={t("field.academicYear")}>
                      <SelectValue placeholder={t("register.selectYear")} />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 6 }, (_, index) => String(index + 1)).map((year) => (
                        <SelectItem key={year} value={year}>
                          {t("register.year", { year })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="field" label={t("field.preferredField")} maxLength={160} />
              <Field id="degree" label={t("field.preferredDegreeLevel")} maxLength={120} />
              <div className="space-y-1.5">
                <Label>{t("field.preferredCity")}</Label>
                <Select value={preferredCity} onValueChange={setPreferredCity}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("register.anyCity")} />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.value} value={city.value}>
                        {t(city.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Field id="preferences" label={t("field.otherPreferences")} maxLength={1000} />
            </div>
          )}
          <Button
            type="submit"
            size="lg"
            disabled={pending || universitiesQuery.isError}
            className="w-full rounded-full"
          >
            {pending ? t("register.submitting") : t("register.submit")}
          </Button>
          <p className="text-center text-xs text-muted-foreground">{t("register.demoNote")}</p>
        </form>
      </main>
    </div>
  );
}
