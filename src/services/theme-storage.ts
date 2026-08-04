import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "stockflow.themeMode";

export type StoredThemeMode = "light" | "dark" | "system";

export async function loadThemeMode(): Promise<StoredThemeMode | null> {
  try {
    const value = await AsyncStorage.getItem(KEY);
    if (value === "light" || value === "dark" || value === "system") {
      return value;
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveThemeMode(mode: StoredThemeMode): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, mode);
  } catch {
    // ignore write failures
  }
}
