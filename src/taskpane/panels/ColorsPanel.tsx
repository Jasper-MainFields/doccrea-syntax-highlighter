import { useCallback, useMemo, useRef } from "react";
import {
  Body1,
  Body1Strong,
  Button,
  Caption1,
  Dropdown,
  Field,
  makeStyles,
  Option,
  Switch,
  tokens,
} from "@fluentui/react-components";
import { useSettings } from "../state/settingsContext.js";
import {
  BUILTIN_PRESETS,
  type AppSettings,
  type ColorPreset,
  type StyleMap,
  type TagStyle,
} from "../../core/defaults.js";

type TagKey = keyof StyleMap;

const TAG_LABELS: Record<TagKey, string> = {
  placeholder: "Placeholder {var}",
  "section-open": "Sectie open {#items}",
  "section-close": "Sectie close {/items}",
  "inverted-open": "Inverted {^}",
  raw: "Raw XML {@}",
  partial: "Partial {>}",
  invalid: "Ongeldig / fout",
};

const TAG_ORDER: TagKey[] = [
  "placeholder",
  "section-open",
  "section-close",
  "inverted-open",
  "raw",
  "partial",
  "invalid",
];

const useStyles = makeStyles({
  wrap: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  preset: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    alignItems: "flex-end",
  },
  tagCard: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalS,
  },
  colorField: {
    width: "100%",
    height: "32px",
    padding: 0,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    cursor: "pointer",
  },
  exportRow: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
    alignItems: "center",
  },
  hiddenFile: {
    display: "none",
  },
});

export function ColorsPanel(): JSX.Element {
  const s = useStyles();
  const { settings, setSettings, resetToDefaults } = useSettings();

  const allPresets = useMemo(
    () => [...BUILTIN_PRESETS, ...settings.customPresets],
    [settings.customPresets],
  );
  const activePreset =
    allPresets.find((p) => p.id === settings.presetId) ?? BUILTIN_PRESETS[0];

  const updateStyle = useCallback(
    async (tagKey: TagKey, patch: Partial<TagStyle>) => {
      await setSettings((prev) => {
        const preset = mutableEditablePreset(prev, activePreset);
        preset.styles[tagKey] = { ...preset.styles[tagKey], ...patch };
        return writePreset(prev, preset);
      });
    },
    [setSettings, activePreset],
  );

  const changePreset = useCallback(
    async (id: string) => {
      await setSettings((prev) => ({ ...prev, presetId: id }));
    },
    [setSettings],
  );

  const duplicateAsCustom = useCallback(async () => {
    await setSettings((prev) => {
      const base = allPresets.find((p) => p.id === prev.presetId) ?? BUILTIN_PRESETS[0];
      const newId = `custom-${Date.now()}`;
      const newPreset: ColorPreset = {
        ...cloneStyles(base),
        id: newId,
        name: `${base.name} (kopie)`,
        description: "Eigen preset — pas de kleuren aan zoals je wilt.",
      };
      return {
        ...prev,
        customPresets: [...prev.customPresets, newPreset],
        presetId: newId,
      };
    });
  }, [setSettings, allPresets]);

  return (
    <div className={s.wrap}>
      <Body1Strong>Preset</Body1Strong>
      <Caption1>{activePreset.description ?? "Kies een preset of maak een eigen kopie."}</Caption1>

      <div className={s.preset}>
        <Field label="Huidig schema" style={{ flex: 1 }}>
          <Dropdown
            value={activePreset.name}
            selectedOptions={[activePreset.id]}
            onOptionSelect={(_, d) => d.optionValue && changePreset(d.optionValue)}
          >
            {allPresets.map((p) => (
              <Option key={p.id} value={p.id}>
                {p.name}
              </Option>
            ))}
          </Dropdown>
        </Field>
        <Button onClick={duplicateAsCustom}>Dupliceer als eigen preset</Button>
      </div>

      {TAG_ORDER.map((key) => (
        <TagEditor
          key={key}
          tagKey={key}
          style={activePreset.styles[key]}
          onChange={updateStyle}
          colorFieldClass={s.colorField}
        />
      ))}

      <ExportImportRow />

      <Button appearance="secondary" onClick={resetToDefaults}>
        Reset naar defaults
      </Button>
    </div>
  );
}

interface TagEditorProps {
  tagKey: TagKey;
  style: TagStyle;
  onChange: (key: TagKey, patch: Partial<TagStyle>) => void | Promise<void>;
  colorFieldClass: string;
}

function TagEditor({ tagKey, style, onChange, colorFieldClass }: TagEditorProps): JSX.Element {
  const s = useStyles();
  const canNest = tagKey === "section-open" || tagKey === "section-close" || tagKey === "inverted-open";

  const previewStyle: React.CSSProperties = {
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    fontFamily: tokens.fontFamilyMonospace,
    backgroundColor: style.highlight ?? "transparent",
    color: style.color,
    fontWeight: style.bold ? "bold" : "normal",
    borderRadius: tokens.borderRadiusSmall,
    border: `1px dashed ${tokens.colorNeutralStroke2}`,
  };

  return (
    <div className={s.tagCard}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Body1Strong>{TAG_LABELS[tagKey]}</Body1Strong>
        <Switch
          checked={style.enabled}
          onChange={(_, d) => onChange(tagKey, { enabled: Boolean(d.checked) })}
          label="Aan"
        />
      </div>

      <div style={previewStyle}>{TAG_LABELS[tagKey]} — voorbeeld</div>

      <div className={s.row}>
        <Field label="Tekstkleur">
          <input
            type="color"
            className={colorFieldClass}
            value={style.color}
            onChange={(e) => onChange(tagKey, { color: e.target.value })}
          />
        </Field>
        <Field label="Markering">
          <input
            type="color"
            className={colorFieldClass}
            value={style.highlight ?? "#ffffff"}
            onChange={(e) => onChange(tagKey, { highlight: e.target.value })}
          />
        </Field>
      </div>

      <div className={s.row}>
        <Field label="Vet">
          <Switch
            checked={Boolean(style.bold)}
            onChange={(_, d) => onChange(tagKey, { bold: Boolean(d.checked) })}
          />
        </Field>
        <Field label="Onderlijning">
          <Dropdown
            value={style.underline ?? "none"}
            selectedOptions={[style.underline ?? "none"]}
            onOptionSelect={(_, d) =>
              d.optionValue &&
              onChange(tagKey, { underline: d.optionValue as TagStyle["underline"] })
            }
          >
            <Option value="none">Geen</Option>
            <Option value="single">Enkele lijn</Option>
            <Option value="wavy">Wavy (fout-indicator)</Option>
          </Dropdown>
        </Field>
      </div>

      {canNest && (
        <Field label="Gebruik nesting-schakeringen (lichter → donkerder per diepte)">
          <Switch
            checked={Boolean(style.useNestingShades)}
            onChange={(_, d) => onChange(tagKey, { useNestingShades: Boolean(d.checked) })}
          />
        </Field>
      )}

      <Button
        appearance="subtle"
        size="small"
        onClick={() => onChange(tagKey, { highlight: null })}
      >
        Verwijder markering
      </Button>
    </div>
  );
}

function ExportImportRow(): JSX.Element {
  const s = useStyles();
  const { settings, setSettings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "doccrea-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [settings]);

  const handleImport = useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      const file = ev.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          if (typeof parsed !== "object" || !parsed) throw new Error("Ongeldige JSON");
          void setSettings((prev) => ({ ...prev, ...parsed }));
        } catch (err) {
          console.error("Import faalde:", err);
          alert("Kon dit bestand niet lezen. Controleer of het een geldige JSON-export is.");
        } finally {
          ev.target.value = "";
        }
      };
      reader.readAsText(file);
    },
    [setSettings],
  );

  return (
    <div className={s.exportRow}>
      <Body1>
        <Body1Strong>Team-deling</Body1Strong>
      </Body1>
      <Button onClick={handleExport}>Exporteer naar JSON</Button>
      <Button appearance="secondary" onClick={() => fileInputRef.current?.click()}>
        Importeer JSON
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        onChange={handleImport}
        className={s.hiddenFile}
      />
    </div>
  );
}

function mutableEditablePreset(settings: AppSettings, preset: ColorPreset): ColorPreset {
  const isBuiltin = BUILTIN_PRESETS.some((p) => p.id === preset.id);
  if (!isBuiltin) return cloneStyles(preset);

  // Ingebouwde presets worden nooit gewijzigd — maak een custom-kopie.
  void settings;
  return {
    ...cloneStyles(preset),
    id: `custom-${preset.id}-${Date.now()}`,
    name: `${preset.name} (aangepast)`,
    description: "Automatisch aangemaakt omdat een ingebouwde preset werd gewijzigd.",
  };
}

function cloneStyles(preset: ColorPreset): ColorPreset {
  return {
    ...preset,
    styles: Object.fromEntries(
      Object.entries(preset.styles).map(([k, v]) => [k, { ...v }]),
    ) as StyleMap,
  };
}

function writePreset(prev: AppSettings, preset: ColorPreset): AppSettings {
  const existing = prev.customPresets.find((p) => p.id === preset.id);
  if (existing) {
    return {
      ...prev,
      customPresets: prev.customPresets.map((p) => (p.id === preset.id ? preset : p)),
      presetId: preset.id,
    };
  }
  return {
    ...prev,
    customPresets: [...prev.customPresets, preset],
    presetId: preset.id,
  };
}
