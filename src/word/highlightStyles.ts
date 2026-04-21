import type { TagToken } from "../core/types.js";
import type { StyleMap, TagStyle } from "../core/defaults.js";
import { shadeForDepth } from "../core/defaults.js";

export interface ResolvedStyle {
  color: string;
  highlight: string | null;
  bold: boolean;
  underline: "none" | "single" | "wavy";
}

export function resolveStyle(token: TagToken, styles: StyleMap): ResolvedStyle | null {
  const style = pickStyle(token, styles);
  if (!style || !style.enabled) return null;

  const depth = token.depth ?? 0;
  const useShades = Boolean(style.useNestingShades) && depth > 0;
  const color = useShades ? shadeForDepth(style.color, depth, "light") : style.color;

  return {
    color,
    highlight: style.highlight ?? null,
    bold: Boolean(style.bold),
    underline: style.underline ?? "none",
  };
}

function pickStyle(token: TagToken, styles: StyleMap): TagStyle | null {
  switch (token.kind) {
    case "placeholder":
      return styles.placeholder;
    case "section-open":
      return styles["section-open"];
    case "section-close":
      return styles["section-close"];
    case "inverted-open":
      return styles["inverted-open"];
    case "raw":
      return styles.raw;
    case "partial":
      return styles.partial;
    case "invalid":
      return styles.invalid;
    default:
      return null;
  }
}

/**
 * Word's `Range.font.underline` values — mapping van onze interne waarden.
 * Houd de mapping hier centraal zodat we het op één plek aanpassen als we merken
 * dat een specifieke Word-versie zich anders gedraagt (zie spike §6.3).
 */
export const UNDERLINE_MAP: Record<ResolvedStyle["underline"], Word.UnderlineType> = {
  none: "None" as Word.UnderlineType,
  single: "Single" as Word.UnderlineType,
  wavy: "WavyLine" as Word.UnderlineType,
};
