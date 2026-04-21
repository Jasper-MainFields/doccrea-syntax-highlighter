import type { TagKind } from "./types.js";

export interface TagStyle {
  enabled: boolean;
  color: string;
  highlight?: string | null;
  bold?: boolean;
  underline?: "none" | "single" | "wavy";
  useNestingShades?: boolean;
}

export type StyleMap = Record<Exclude<TagKind, "invalid">, TagStyle> & {
  invalid: TagStyle;
};

export interface ColorPreset {
  id: string;
  name: string;
  description?: string;
  styles: StyleMap;
}

export interface SyntaxSettings {
  delimiterOpen: string;
  delimiterClose: string;
  allowDiacritics: boolean;
  angularParser: boolean;
}

export interface ValidationSettings {
  checkBalance: boolean;
  checkSyntax: boolean;
  severity: "error" | "warning";
}

export interface Snippet {
  id: string;
  label: string;
  /**
   * Tekst die in het document komt. Twee placeholders worden ondersteund:
   * - `${cursor}` — eindpositie van de cursor na invoegen.
   * - `${select:WORD}` — initieel geselecteerde tekst zodat je direct kunt doortypen.
   */
  body: string;
  group?: "ingebouwd" | "eigen";
}

export interface AppSettings {
  presetId: string;
  customPresets: ColorPreset[];
  syntax: SyntaxSettings;
  validation: ValidationSettings;
  snippets: Snippet[];
  schemaVersion: 1;
}

const MAINFIELDS_SECONDARY = "#2E8B8B";
const MAINFIELDS_ACCENT = "#7B4BA8";
const MAINFIELDS_WARNING = "#D97706";
const MAINFIELDS_NEUTRAL = "#6B7280";
const ERROR_RED = "#C0392B";

function buildMainFieldsPreset(): ColorPreset {
  return {
    id: "mainfields",
    name: "MainFields",
    description:
      "Huisstijl van MainFields. Placeholders blijven zwart zodat je gerenderde tekst niet gekleurd wordt.",
    styles: {
      // Placeholders krijgen default GEEN tekstkleur: DocxTemplater zou die anders
      // overnemen in de gerenderde waarde. De markering valt wel op tijdens
      // bewerking en verdwijnt bij render omdat de tag-tekst vervangen wordt.
      placeholder: {
        enabled: true,
        color: "#000000",
        highlight: "#FFF7CC",
        bold: false,
        underline: "none",
      },
      "section-open": {
        enabled: true,
        color: MAINFIELDS_SECONDARY,
        highlight: null,
        bold: true,
        underline: "none",
        useNestingShades: true,
      },
      "section-close": {
        enabled: true,
        color: MAINFIELDS_SECONDARY,
        highlight: null,
        bold: true,
        underline: "none",
        useNestingShades: true,
      },
      "inverted-open": {
        enabled: true,
        color: MAINFIELDS_ACCENT,
        highlight: null,
        bold: true,
        underline: "none",
        useNestingShades: true,
      },
      raw: {
        enabled: true,
        color: MAINFIELDS_WARNING,
        highlight: "#FFF7E6",
        bold: true,
        underline: "none",
      },
      partial: {
        enabled: true,
        color: MAINFIELDS_NEUTRAL,
        highlight: null,
        bold: false,
        underline: "none",
      },
      invalid: {
        enabled: true,
        color: ERROR_RED,
        highlight: "#FDECEA",
        bold: true,
        underline: "wavy",
      },
    },
  };
}

function buildLightPreset(): ColorPreset {
  return {
    id: "light",
    name: "Licht",
    description: "Zachte tinten op witte achtergrond.",
    styles: {
      placeholder: { enabled: true, color: "#000000", highlight: "#DBEAFE", bold: false, underline: "none" },
      "section-open": { enabled: true, color: "#0F766E", highlight: null, bold: true, underline: "none", useNestingShades: true },
      "section-close": { enabled: true, color: "#0F766E", highlight: null, bold: true, underline: "none", useNestingShades: true },
      "inverted-open": { enabled: true, color: "#7C3AED", highlight: null, bold: true, underline: "none", useNestingShades: true },
      raw: { enabled: true, color: "#B45309", highlight: "#FEF3C7", bold: true, underline: "none" },
      partial: { enabled: true, color: "#475569", highlight: null, bold: false, underline: "none" },
      invalid: { enabled: true, color: "#B91C1C", highlight: "#FEE2E2", bold: true, underline: "wavy" },
    },
  };
}

function buildDarkPreset(): ColorPreset {
  return {
    id: "dark",
    name: "Donker",
    description: "Heldere kleuren voor donker themapapier.",
    styles: {
      placeholder: { enabled: true, color: "#000000", highlight: "#1E3A5F", bold: false, underline: "none" },
      "section-open": { enabled: true, color: "#34D399", highlight: null, bold: true, underline: "none", useNestingShades: true },
      "section-close": { enabled: true, color: "#34D399", highlight: null, bold: true, underline: "none", useNestingShades: true },
      "inverted-open": { enabled: true, color: "#C084FC", highlight: null, bold: true, underline: "none", useNestingShades: true },
      raw: { enabled: true, color: "#FBBF24", highlight: null, bold: true, underline: "none" },
      partial: { enabled: true, color: "#9CA3AF", highlight: null, bold: false, underline: "none" },
      invalid: { enabled: true, color: "#FCA5A5", highlight: null, bold: true, underline: "wavy" },
    },
  };
}

function buildHighContrastPreset(): ColorPreset {
  return {
    id: "high-contrast",
    name: "Hoog contrast",
    description: "Maximale leesbaarheid voor toegankelijkheid.",
    styles: {
      placeholder: { enabled: true, color: "#000000", highlight: "#FFFF00", bold: false, underline: "none" },
      "section-open": { enabled: true, color: "#006400", highlight: "#FFFFFF", bold: true, underline: "single", useNestingShades: true },
      "section-close": { enabled: true, color: "#006400", highlight: "#FFFFFF", bold: true, underline: "single", useNestingShades: true },
      "inverted-open": { enabled: true, color: "#4B0082", highlight: "#FFFFFF", bold: true, underline: "single", useNestingShades: true },
      raw: { enabled: true, color: "#8B0000", highlight: "#FFE4B5", bold: true, underline: "single" },
      partial: { enabled: true, color: "#000000", highlight: "#D3D3D3", bold: true, underline: "none" },
      invalid: { enabled: true, color: "#FFFFFF", highlight: "#FF0000", bold: true, underline: "wavy" },
    },
  };
}

export const BUILTIN_PRESETS: ColorPreset[] = [
  buildMainFieldsPreset(),
  buildLightPreset(),
  buildDarkPreset(),
  buildHighContrastPreset(),
];

export const DEFAULT_PRESET_ID = "mainfields";

export const DEFAULT_SNIPPETS: Snippet[] = [
  {
    id: "snippet-placeholder",
    label: "Placeholder",
    body: "{${select:veldnaam}}",
    group: "ingebouwd",
  },
  {
    id: "snippet-loop",
    label: "Loop",
    body: "{#${select:items}}\n  {naam}\n{/items}",
    group: "ingebouwd",
  },
  {
    id: "snippet-condition",
    label: "Conditie",
    body: "{#${select:conditie}}\n  …\n{/conditie}",
    group: "ingebouwd",
  },
  {
    id: "snippet-inverted",
    label: "Inverted sectie",
    body: "{^${select:conditie}}\n  …\n{/conditie}",
    group: "ingebouwd",
  },
  {
    id: "snippet-rawxml",
    label: "Raw XML",
    body: "{@${select:html}}",
    group: "ingebouwd",
  },
  {
    id: "snippet-tablerow",
    label: "Tabelrij-loop",
    body: "{#${select:rijen}}{kolom1}\t{kolom2}\t{kolom3}{/rijen}",
    group: "ingebouwd",
  },
];

export function buildDefaultSettings(): AppSettings {
  return {
    presetId: DEFAULT_PRESET_ID,
    customPresets: [],
    syntax: {
      delimiterOpen: "{",
      delimiterClose: "}",
      allowDiacritics: true,
      // Default AAN: de meeste DocxTemplater-sjablonen gebruiken pipes
      // (`{naam|lower}`) of vergelijkingen (`{#status == "Open"}`) die
      // anders als fout zouden worden gemarkeerd.
      angularParser: true,
    },
    validation: {
      checkBalance: true,
      checkSyntax: true,
      severity: "error",
    },
    snippets: [...DEFAULT_SNIPPETS],
    schemaVersion: 1,
  };
}

/**
 * Schaduw-helper voor nesting. Geeft een (lichter of donkerder) variant van de basiskleur,
 * afhankelijk van de diepte en of er een lichte of donkere achtergrond verondersteld wordt.
 */
export function shadeForDepth(baseHex: string, depth: number, mode: "light" | "dark" = "light"): string {
  if (depth <= 0) return baseHex;
  const factor = Math.min(depth * 0.12, 0.6);
  return mode === "light" ? lighten(baseHex, factor) : darken(baseHex, factor);
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

function parseHex(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const expanded = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(expanded, 16);
  return [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff];
}

function toHex(r: number, g: number, b: number): string {
  const h = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

function lighten(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  return toHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}

function darken(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  return toHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}
