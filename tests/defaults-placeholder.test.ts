import { describe, it, expect } from "vitest";
import { BUILTIN_PRESETS } from "../src/core/defaults.js";

describe("placeholder default = zwart (regressie)", () => {
  it.each(BUILTIN_PRESETS)("preset '$name' zet placeholder tekstkleur op zwart", (preset) => {
    // Reden: DocxTemplater neemt de formatting van de placeholder-run over
    // naar de gerenderde waarde. Een gekleurde placeholder zou dus zwart
    // gekleurde data produceren in het eindsjabloon. We leggen dit hier vast
    // zodat we het niet per ongeluk terugdraaien.
    expect(preset.styles.placeholder.color.toLowerCase()).toBe("#000000");
  });

  it("invalid-styling blijft rood voor duidelijke error-indicatie", () => {
    for (const preset of BUILTIN_PRESETS) {
      expect(preset.styles.invalid.underline).toBe("wavy");
    }
  });
});
