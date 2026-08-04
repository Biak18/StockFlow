import { saveThemeMode, type StoredThemeMode } from "@/services/theme-storage";
import { AppTheme, darkTheme, lightTheme } from "@/theme";
import { Appearance, ColorSchemeName } from "react-native";
import { create } from "zustand";

type ThemeMode = StoredThemeMode;

function resolveTheme(
  mode: ThemeMode,
  scheme?: ColorSchemeName | null,
): AppTheme {
  if (mode === "light") return lightTheme;
  if (mode === "dark") return darkTheme;
  const system = scheme ?? Appearance.getColorScheme();
  return system === "dark" ? darkTheme : lightTheme;
}

interface UIState {
  themeMode: ThemeMode;
  theme: AppTheme;
  isOnline: boolean;
  isSyncing: boolean;
  themeHydrated: boolean;
  inventoryRevision: number;

  bumpInventoryRevision: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  hydrateThemeMode: (mode: ThemeMode) => void;
  syncSystemScheme: (scheme: ColorSchemeName) => void;
  setOnline: (value: boolean) => void;
  setSyncing: (value: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  themeMode: "system",
  theme: resolveTheme("system"),
  isOnline: true,
  isSyncing: false,
  themeHydrated: false,

  inventoryRevision: 0,
  bumpInventoryRevision: () =>
    set((s) => ({ inventoryRevision: s.inventoryRevision + 1 })),

  setThemeMode: (mode) => {
    set({
      themeMode: mode,
      theme: resolveTheme(mode),
    });
    void saveThemeMode(mode);
  },

  /** Used only on app start — does not write storage again */
  hydrateThemeMode: (mode) => {
    set({
      themeMode: mode,
      theme: resolveTheme(mode),
      themeHydrated: true,
    });
  },

  syncSystemScheme: (scheme) => {
    const { themeMode } = get();
    if (themeMode !== "system") return;
    set({ theme: resolveTheme("system", scheme) });
  },

  setOnline: (value) => set({ isOnline: value }),
  setSyncing: (value) => set({ isSyncing: value }),
}));
