import { describe, it, expect } from "vitest";
import { escapeForWildcardSearch } from "../src/word/applyHighlights.js";

describe("escapeForWildcardSearch", () => {
  it("escape't `^` als `^^` (Word's literal-caret syntax, niet `\\^`)", () => {
    expect(escapeForWildcardSearch("{^productnaam}")).toBe("\\{^^productnaam\\}");
  });

  it("escape't `{` en `}` zodat ze letterlijk matchen", () => {
    expect(escapeForWildcardSearch("{naam}")).toBe("\\{naam\\}");
  });

  it("escape't parens en backslash", () => {
    expect(escapeForWildcardSearch("{/Foutt)")).toBe("\\{/Foutt\\)");
  });

  it("escape't meerdere speciale tekens (inclusief `=` uit wildcardlijst)", () => {
    expect(escapeForWildcardSearch("{#p == \"x\"}")).toBe("\\{#p \\=\\= \"x\"\\}");
  });

  it("laat normale tekens ongemoeid", () => {
    expect(escapeForWildcardSearch("productnaam")).toBe("productnaam");
  });
});
