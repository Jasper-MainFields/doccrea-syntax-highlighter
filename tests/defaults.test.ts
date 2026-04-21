import { describe, it, expect } from "vitest";
import { BUILTIN_PRESETS, buildDefaultSettings, DEFAULT_PRESET_ID, shadeForDepth } from "../src/core/defaults.js";

describe("defaults — presets", () => {
  it("heeft vier ingebouwde presets", () => {
    const ids = BUILTIN_PRESETS.map((p) => p.id);
    expect(ids).toEqual(["mainfields", "light", "dark", "high-contrast"]);
  });

  it("gebruikt MainFields als default", () => {
    expect(DEFAULT_PRESET_ID).toBe("mainfields");
  });

  it("elke preset heeft styles voor alle tag-types", () => {
    for (const preset of BUILTIN_PRESETS) {
      expect(preset.styles.placeholder).toBeDefined();
      expect(preset.styles["section-open"]).toBeDefined();
      expect(preset.styles["section-close"]).toBeDefined();
      expect(preset.styles["inverted-open"]).toBeDefined();
      expect(preset.styles.raw).toBeDefined();
      expect(preset.styles.partial).toBeDefined();
      expect(preset.styles.invalid).toBeDefined();
    }
  });
});

describe("defaults — settings", () => {
  it("buildDefaultSettings geeft consistente schema-versie", () => {
    const s = buildDefaultSettings();
    expect(s.schemaVersion).toBe(1);
    expect(s.presetId).toBe(DEFAULT_PRESET_ID);
    expect(s.syntax.delimiterOpen).toBe("{");
    expect(s.syntax.delimiterClose).toBe("}");
    expect(s.snippets.length).toBeGreaterThan(0);
  });
});

describe("defaults — shadeForDepth", () => {
  it("geeft basiskleur terug bij depth 0", () => {
    expect(shadeForDepth("#2E8B8B", 0)).toBe("#2E8B8B");
  });

  it("maakt lichter bij hogere depth in light mode", () => {
    const d1 = shadeForDepth("#2E8B8B", 1, "light");
    const d3 = shadeForDepth("#2E8B8B", 3, "light");
    expect(d1).not.toBe("#2E8B8B");
    expect(d3).not.toBe(d1);
  });

  it("maakt donkerder in dark mode", () => {
    const baseR = 0x2e;
    const dark = shadeForDepth("#2E8B8B", 2, "dark");
    const darkR = parseInt(dark.slice(1, 3), 16);
    expect(darkR).toBeLessThan(baseR);
  });
});
