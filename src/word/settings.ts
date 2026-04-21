import {
  buildDefaultSettings,
  BUILTIN_PRESETS,
  type AppSettings,
  type ColorPreset,
} from "../core/defaults.js";

const SETTINGS_KEY = "doccrea.settings.v1";

/**
 * Instellingen worden opgeslagen in localStorage van het task pane.
 *
 * Opmerking: we gebruiken bewust géén `Office.context.roamingSettings` — die
 * bestaat alleen voor Outlook. In Word zou dat runtime crashen met
 * 'undefined is not an object'. `Office.context.document.settings` bestaat wel
 * voor Word maar is per-document; we willen juist cross-document user prefs.
 * `localStorage` doet dat en werkt identiek op Windows, Mac en Word Online.
 */
export function loadSettings(): AppSettings {
  try {
    const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(SETTINGS_KEY);
    if (!raw) return buildDefaultSettings();
    return migrateSettings(JSON.parse(raw));
  } catch {
    return buildDefaultSettings();
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function resolvePreset(settings: AppSettings): ColorPreset {
  const combined = [...BUILTIN_PRESETS, ...settings.customPresets];
  return combined.find((p) => p.id === settings.presetId) ?? BUILTIN_PRESETS[0];
}

function migrateSettings(raw: unknown): AppSettings {
  const defaults = buildDefaultSettings();
  if (!raw || typeof raw !== "object") return defaults;
  const obj = raw as Partial<AppSettings>;
  return {
    ...defaults,
    ...obj,
    syntax: { ...defaults.syntax, ...(obj.syntax ?? {}) },
    validation: { ...defaults.validation, ...(obj.validation ?? {}) },
    snippets: obj.snippets?.length ? obj.snippets : defaults.snippets,
    customPresets: obj.customPresets ?? [],
    schemaVersion: 1,
  };
}
