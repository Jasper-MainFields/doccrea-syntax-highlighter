/// <reference types="office-js" />
import { buildDefaultSettings, BUILTIN_PRESETS, type AppSettings, type ColorPreset } from "../core/defaults.js";

const SETTINGS_KEY = "doccrea.settings.v1";

export function loadSettings(): AppSettings {
  const raw = Office.context.roamingSettings?.get(SETTINGS_KEY);
  if (!raw) return buildDefaultSettings();
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : (raw as AppSettings);
    return migrateSettings(parsed);
  } catch {
    return buildDefaultSettings();
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  Office.context.roamingSettings.set(SETTINGS_KEY, JSON.stringify(settings));
  return new Promise((resolve, reject) => {
    Office.context.roamingSettings.saveAsync((asyncResult) => {
      if (asyncResult.status === Office.AsyncResultStatus.Succeeded) resolve();
      else reject(asyncResult.error);
    });
  });
}

export function resolvePreset(settings: AppSettings): ColorPreset {
  const combined = [...BUILTIN_PRESETS, ...settings.customPresets];
  return combined.find((p) => p.id === settings.presetId) ?? BUILTIN_PRESETS[0];
}

function migrateSettings(raw: unknown): AppSettings {
  // Voor nu alleen schemaVersion 1 → 1. Bij volgende breaking change hier
  // een migratie-stap toevoegen.
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
