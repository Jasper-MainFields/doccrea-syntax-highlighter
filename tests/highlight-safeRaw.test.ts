import { describe, it, expect } from "vitest";
import { makeSafeRaw } from "../src/word/applyHighlights.js";

describe("makeSafeRaw", () => {
  it("laat nette tags ongemoeid", () => {
    expect(makeSafeRaw("{voornaam}", "{", "}")).toBe("{voornaam}");
    expect(makeSafeRaw("{#items}", "{", "}")).toBe("{#items}");
  });

  it("strip trailing parens (Word search breekt hierop)", () => {
    expect(makeSafeRaw("{/Foutt)", "{", "}")).toBe("{/Foutt");
  });

  it("strip meerdere trailing problematische tekens", () => {
    expect(makeSafeRaw("{naam)])", "{", "}")).toBe("{naam");
  });

  it("geeft null als er niks veiligs overblijft", () => {
    expect(makeSafeRaw("{)", "{", "}")).toBeNull();
  });

  it("werkt met custom delimiters", () => {
    expect(makeSafeRaw("[[naam)]", "[[", "]]")).toBe("[[naam");
  });

  it("geeft null als raw niet met open-delimiter begint", () => {
    expect(makeSafeRaw("naam}", "{", "}")).toBeNull();
  });
});
