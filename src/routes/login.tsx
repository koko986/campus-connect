import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

import { Logo } from "@/components/app-shell";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { initialLanguage, translate, useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  head: () => {
    const language = initialLanguage();
    return {
      meta: [
        { title: translate(language, "login.meta.title") },
        { name: "description", content: translate(language, "login.meta.description") },
      ],
    };
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { initialized, user } = useAuth();
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (initialized && user) navigate({ to: "/dashboard", replace: true });
  }, [initialized, navigate, user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setPending(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    await navigate({ to: "/dashboard", replace: true });
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
            {t("login.createAccount")}
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <div className="card-soft p-7">
          <h1 className="text-2xl font-bold">{t("login.heading")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("login.text")}</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("field.email")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("login.emailPlaceholder")}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t("field.password")}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t("login.passwordPlaceholder")}
                className="rounded-xl"
              />
            </div>
            <Button type="submit" disabled={pending} className="w-full rounded-full" size="lg">
              {pending ? t("login.submitting") : t("auth.logIn")}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("login.newHere")}{" "}
            <Link to="/get-started" className="font-semibold text-primary">
              {t("login.createAnAccount")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
