import { describe, it, expect } from "vitest";
import { expandSnippet } from "../src/word/insertSnippet.js";
import { DEFAULT_SNIPPETS } from "../src/core/defaults.js";

describe("expandSnippet", () => {
  it("haalt select-placeholder naar voren", () => {
    const r = expandSnippet({
      id: "x",
      label: "x",
      body: "{#${select:items}}\n  {naam}\n{/items}",
    });
    expect(r.hasSelection).toBe(true);
    expect(r.placeholder).toBe("items");
    expect(r.before).toBe("{#");
    expect(r.after).toBe("}\n  {naam}\n{/items}");
  });

  it("ondersteunt cursor-placeholder", () => {
    const r = expandSnippet({
      id: "x",
      label: "x",
      body: "start${cursor}end",
    });
    expect(r.hasSelection).toBe(false);
    expect(r.before).toBe("start");
    expect(r.after).toBe("end");
    expect(r.placeholder).toBe("");
  });

  it("zonder placeholder plaatst alles in 'before'", () => {
    const r = expandSnippet({ id: "x", label: "x", body: "{naam}" });
    expect(r.hasSelection).toBe(false);
    expect(r.before).toBe("{naam}");
    expect(r.placeholder).toBe("");
    expect(r.after).toBe("");
  });

  it("alle ingebouwde snippets expanden zonder fouten", () => {
    for (const snippet of DEFAULT_SNIPPETS) {
      const r = expandSnippet(snippet);
      expect(r.before + r.placeholder + r.after).not.toContain("${select:");
      expect(r.before + r.placeholder + r.after).not.toContain("${cursor}");
    }
  });
});
