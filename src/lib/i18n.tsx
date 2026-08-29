/*
 * This module is one provider plus the pure helpers that read the same catalogs, and the server
 * entry points need the helpers without pulling in a component, so they live together.
 */
/* eslint-disable react-refresh/only-export-components */
import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import en from "@/locales/en.json";
import my from "@/locales/my.json";

export type Language = "en" | "my";

/** Each language names itself in its own script, which is how a reader recognises it. */
export const languages: ReadonlyArray<{ code: Language; name: string }> = [
  { code: "en", name: "English" },
  { code: "my", name: "မြန်မာ" },
];

const STORAGE_KEY = "takka-language";

/** A year, so a returning visitor gets their language on the first server-rendered paint. */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type TranslationKey = keyof typeof en;

/**
 * English is the reference catalog. Typing the Burmese one against it turns a missing translation
 * into a compile error rather than an English sentence inside a Burmese page.
 */
const catalogs: Record<Language, Record<TranslationKey, string>> = { en, my };

export type Replacements = Record<string, string | number>;

export type Translate = (key: TranslationKey, values?: Replacements) => string;

/**
 * The tag handed to {@link Intl}. Burmese asks for Latin digits explicitly, because Myanmar apps
 * and websites use them and the Myanmar digits Intl would otherwise pick read as archaic.
 */
export function localeTag(language: Language) {
  return language === "my" ? "my-MM-u-nu-latn" : "en";
}

function isLanguage(value: string | null | undefined): value is Language {
  return value === "en" || value === "my";
}

/** Reads the preference out of a raw Cookie header, for code that has a request but no context. */
export function languageFromCookieHeader(header: string | null | undefined): Language {
  const match = header?.match(new RegExp(`(?:^|;\\s*)${STORAGE_KEY}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1] ?? "") : undefined;
  return isLanguage(value) ? value : "en";
}

/**
 * Read the same way on both sides of the render so the server and the first client render agree.
 * The cookie exists only for that: the member's actual choice lives in localStorage, mirrored into
 * a cookie because the server cannot read localStorage.
 */
const preferredLanguage = createIsomorphicFn()
  .server((): Language => {
    try {
      const stored = getCookie(STORAGE_KEY);
      return isLanguage(stored) ? stored : "en";
    } catch {
      // Rendered outside a request, as in a prerender pass.
      return "en";
    }
  })
  .client((): Language => languageFromCookieHeader(document.cookie));

function interpolate(template: string, values?: Replacements) {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in values ? String(values[name]) : placeholder,
  );
}

/** Falls back through English so an untranslated key still reads as words, never as a key. */
export function translate(language: Language, key: TranslationKey, values?: Replacements) {
  const template = catalogs[language][key] || catalogs.en[key] || key;
  return interpolate(template, values);
}

type LanguageContextValue = {
  language: Language;
  setLanguage: (next: Language) => void;
  t: Translate;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(preferredLanguage);

  // localStorage is the record of the choice; the cookie is only its shadow for the server.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLanguage(stored)) setLanguageState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.cookie = `${STORAGE_KEY}=${language};path=/;max-age=${COOKIE_MAX_AGE};samesite=lax`;
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key, values) => translate(language, key, values),
    }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}

/** The common case: a component that only reads copy. */
export function useT() {
  return useLanguage().t;
}

/**
 * Read outside React, for the document shell and for route heads, both of which run before any
 * provider exists.
 */
export function initialLanguage() {
  return preferredLanguage();
}
