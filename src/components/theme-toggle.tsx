import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, setAppearance } = useTheme();
  const t = useT();
  const next = resolved === "dark" ? "light" : "dark";
  const label = resolved === "dark" ? t("theme.switchToLight") : t("theme.switchToDark");

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      aria-label={label}
      title={label}
      onClick={() => setAppearance(next)}
    >
      {resolved === "dark" ? (
        <Sun aria-hidden="true" className="size-[18px]" />
      ) : (
        <Moon aria-hidden="true" className="size-[18px]" />
      )}
    </Button>
  );
}
