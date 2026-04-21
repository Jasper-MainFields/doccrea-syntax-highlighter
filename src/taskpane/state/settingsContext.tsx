import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loadSettings, saveSettings } from "../../word/settings.js";
import { buildDefaultSettings, type AppSettings } from "../../core/defaults.js";

interface SettingsContextValue {
  settings: AppSettings;
  setSettings: (updater: (prev: AppSettings) => AppSettings) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }): JSX.Element {
  const [settings, setSettingsState] = useState<AppSettings>(() => buildDefaultSettings());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setSettingsState(loadSettings());
    setIsHydrated(true);
  }, []);

  const update = useCallback(
    async (updater: (prev: AppSettings) => AppSettings) => {
      let next: AppSettings = settings;
      setSettingsState((prev) => {
        next = updater(prev);
        return next;
      });
      await saveSettings(next);
    },
    [settings],
  );

  const resetToDefaults = useCallback(async () => {
    const defaults = buildDefaultSettings();
    setSettingsState(defaults);
    await saveSettings(defaults);
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, setSettings: update, resetToDefaults }),
    [settings, update, resetToDefaults],
  );

  if (!isHydrated) return <>{children}</>;
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    // Fallback tijdens eerste render vóór hydrate — geef een no-op terug
    // zodat panelen niet crashen.
    const defaults = buildDefaultSettings();
    return {
      settings: defaults,
      setSettings: async () => {},
      resetToDefaults: async () => {},
    };
  }
  return ctx;
}
