import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ============================================================
   BRAND COLORS
============================================================ */
const BRAND = {
  primary: "#0D4A8C",
  secondary: "#1565C0",
  accent: "#4FC3F7",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  backgroundDark: "#09090B",
  cardDark: "#111827",
  borderDark: "#1F2937",
  backgroundLight: "#FFFFFF",
  cardLight: "#F8FAFC",
  borderLight: "#E5E7EB",
  textDark: "#F9FAFB",
  textLight: "#111827",
  mutedDark: "#9CA3AF",
  mutedLight: "#6B7280",
};

export type ThemeMode = "light" | "dark" | "system";
export type Scheme = "light" | "dark";

export interface Palette {
  scheme: Scheme;
  background: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  pillBg: string;
  sidebarBg: string;
  sidebarActiveBg: string;
}

function buildPalette(scheme: Scheme): Palette {
  const isDark = scheme === "dark";
  return {
    scheme,
    background: isDark ? BRAND.backgroundDark : BRAND.backgroundLight,
    card: isDark ? BRAND.cardDark : BRAND.cardLight,
    border: isDark ? BRAND.borderDark : BRAND.borderLight,
    text: isDark ? BRAND.textDark : BRAND.textLight,
    muted: isDark ? BRAND.mutedDark : BRAND.mutedLight,
    primary: BRAND.primary,
    secondary: BRAND.secondary,
    accent: BRAND.accent,
    success: BRAND.success,
    warning: BRAND.warning,
    danger: BRAND.danger,
    pillBg: isDark ? "#1B2942" : "#EEF3FA",
    sidebarBg: isDark ? "#0C0C10" : "#FFFFFF",
    sidebarActiveBg: isDark ? "rgba(13,74,140,0.25)" : "rgba(13,74,140,0.1)",
  };
}

const THEME_STORAGE_KEY = "kayora_admin_theme_mode";

interface ThemeContextValue {
  themeMode: ThemeMode;
  scheme: Scheme;
  palette: Palette;
  setThemeMode: (mode: ThemeMode) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("dark");
  const [systemScheme, setSystemScheme] = useState<Scheme>(
    (Appearance.getColorScheme() as Scheme) || "dark"
  );

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved === "light" || saved === "dark" || saved === "system") {
          setThemeModeState(saved);
        }
      } catch (e) {
        // default remains "dark"
      }
    })();

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme((colorScheme as Scheme) || "dark");
    });
    return () => subscription.remove();
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => {
      // ignore persistence failure
    });
  }, []);

  const cycleTheme = useCallback(() => {
    const order: ThemeMode[] = ["light", "dark", "system"];
    setThemeMode(order[(order.indexOf(themeMode) + 1) % order.length]);
  }, [themeMode, setThemeMode]);

  const scheme: Scheme = themeMode === "system" ? systemScheme : themeMode;
  const palette = useMemo(() => buildPalette(scheme), [scheme]);

  const value = useMemo(
    () => ({ themeMode, scheme, palette, setThemeMode, cycleTheme }),
    [themeMode, scheme, palette, setThemeMode, cycleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}