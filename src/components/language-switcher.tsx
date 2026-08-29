import { languages, useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * The signed-out header switcher. Signed-out visitors have no settings page, so the choice has to
 * be reachable from the pages themselves.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <nav
      aria-label={t("language.label")}
      className={cn(
        "flex items-center rounded-full bg-muted p-0.5 text-xs font-semibold",
        className,
      )}
    >
      {languages.map((option) => (
        <button
          key={option.code}
          type="button"
          lang={option.code}
          aria-current={option.code === language}
          onClick={() => setLanguage(option.code)}
          className={cn(
            "rounded-full px-2.5 py-1 transition-colors",
            option.code === language
              ? "bg-background text-foreground shadow-[var(--shadow-soft)]"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.name}
        </button>
      ))}
    </nav>
  );
}
