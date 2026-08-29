import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Appearance = "dark" | "light" | "system";

const STORAGE_KEY = "takka-appearance";

type ThemeContextValue = {
  appearance: Appearance;
  resolved: "dark" | "light";
  setAppearance: (next: Appearance) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Runs before paint so a stored dark preference never flashes a light screen.
 * Kept in sync with the provider below.
 */
export const themeBootstrapScript = `(function(){try{var s=localStorage.getItem("${STORAGE_KEY}");var d=s==="dark"||((!s||s==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

function isAppearance(value: string | null): value is Appearance {
  return value === "dark" || value === "light" || value === "system";
}

function readStored(): Appearance {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isAppearance(stored) ? stored : "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearanceState] = useState<Appearance>("system");
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    setAppearanceState(readStored());
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(media.matches);
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const resolved = appearance === "system" ? (systemDark ? "dark" : "light") : appearance;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.style.colorScheme = resolved;
  }, [resolved]);

  const setAppearance = useCallback((next: Appearance) => {
    setAppearanceState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo(
    () => ({ appearance, resolved, setAppearance }),
    [appearance, resolved, setAppearance],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}
