import { describe, it, expect } from "vitest";
import { tokenize } from "../src/core/tokenizer.js";
import type { TagToken } from "../src/core/types.js";
import { CUSTOM_DELIMITERS, DIACRITICS, LETTER, NESTED, PARTIAL, RAW_XML } from "./fixtures/sample-templates.js";

function tagTokens(tokens: ReturnType<typeof tokenize>): TagToken[] {
  return tokens.filter((t): t is TagToken => t.kind !== "text");
}

describe("tokenizer — plain tekst", () => {
  it("levert één text-token voor tekst zonder tags", () => {
    const tokens = tokenize("Gewoon lopende tekst.");
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toMatchObject({ kind: "text", raw: "Gewoon lopende tekst.", start: 0, end: 21 });
  });

  it("retourneert een lege array voor een lege string", () => {
    expect(tokenize("")).toEqual([]);
  });
});

describe("tokenizer — placeholder", () => {
  it("herkent een simpele placeholder", () => {
    const [t] = tagTokens(tokenize("{naam}"));
    expect(t).toMatchObject({ kind: "placeholder", name: "naam", raw: "{naam}", start: 0, end: 6 });
  });

  it("herkent genestte property-paden", () => {
    const [t] = tagTokens(tokenize("{user.profile.email}"));
    expect(t.kind).toBe("placeholder");
    expect(t.name).toBe("user.profile.email");
  });

  it("trimt spaties rond de naam", () => {
    const [t] = tagTokens(tokenize("{  voornaam  }"));
    expect(t.kind).toBe("placeholder");
    expect(t.name).toBe("voornaam");
  });

  it("accepteert diakrieten wanneer toegestaan", () => {
    const [t] = tagTokens(tokenize(DIACRITICS));
    expect(t.kind).toBe("placeholder");
    expect(t.name).toBe("naam.straßenname");
  });

  it("weigert diakrieten wanneer uitgeschakeld (strikt)", () => {
    const [t] = tagTokens(tokenize(DIACRITICS, { allowDiacritics: false, angularParser: false }));
    expect(t.kind).toBe("invalid");
    expect(t.invalidReason).toBe("invalid-name");
  });

  it("weigert leading diakriet als ascii-strict modus aanstaat", () => {
    const [t] = tagTokens(tokenize("{ßnaam}", { allowDiacritics: false, angularParser: false }));
    expect(t.kind).toBe("invalid");
    expect(t.invalidReason).toBe("unknown-prefix");
  });
});

describe("tokenizer — secties", () => {
  it("herkent open sectie", () => {
    const [t] = tagTokens(tokenize("{#items}"));
    expect(t).toMatchObject({ kind: "section-open", name: "items" });
  });

  it("herkent close sectie", () => {
    const [t] = tagTokens(tokenize("{/items}"));
    expect(t).toMatchObject({ kind: "section-close", name: "items" });
  });

  it("herkent anonieme close", () => {
    const [t] = tagTokens(tokenize("{/}"));
    expect(t).toMatchObject({ kind: "section-close", name: "" });
  });

  it("herkent inverted open", () => {
    const [t] = tagTokens(tokenize("{^aanwezig}"));
    expect(t).toMatchObject({ kind: "inverted-open", name: "aanwezig" });
  });
});

describe("tokenizer — raw en partial", () => {
  it("herkent raw XML", () => {
    const [t] = tagTokens(tokenize(RAW_XML));
    expect(t).toMatchObject({ kind: "raw", name: "htmlBlob" });
  });

  it("herkent partial", () => {
    const tokens = tagTokens(tokenize(PARTIAL));
    expect(tokens[0]).toMatchObject({ kind: "partial", name: "header" });
    expect(tokens.at(-1)).toMatchObject({ kind: "partial", name: "footer" });
  });
});

describe("tokenizer — foutgevallen (strikte modus)", () => {
  const strict = { angularParser: false } as const;

  it("markeert lege tag als invalid", () => {
    const [t] = tagTokens(tokenize("{}", strict));
    expect(t.kind).toBe("invalid");
    expect(t.invalidReason).toBe("empty-tag");
  });

  it("markeert whitespace-only tag als invalid", () => {
    const [t] = tagTokens(tokenize("{   }", strict));
    expect(t.invalidReason).toBe("empty-tag");
  });

  it("markeert onterminate tag als invalid", () => {
    const [t] = tagTokens(tokenize("prefix {naam suffix", strict));
    expect(t.kind).toBe("invalid");
    expect(t.invalidReason).toBe("unterminated");
  });

  it("markeert onbekend prefix als invalid", () => {
    const [t] = tagTokens(tokenize("{!iets}", strict));
    expect(t.invalidReason).toBe("unknown-prefix");
  });

  it("markeert spaties in de naam als invalid", () => {
    const [t] = tagTokens(tokenize("{gebroken naam}", strict));
    expect(t.invalidReason).toBe("invalid-name");
  });
});

describe("tokenizer — custom delimiters", () => {
  it("gebruikt opgegeven delimiters", () => {
    const tokens = tagTokens(
      tokenize(CUSTOM_DELIMITERS, { delimiters: { open: "[[", close: "]]" } }),
    );
    expect(tokens.map((t) => t.name)).toEqual(["naam", "bedrijf.naam"]);
  });
});

describe("tokenizer — volledige sjablonen", () => {
  it("produceert afwisselende text en tag tokens voor een brief", () => {
    const tokens = tokenize(LETTER);
    const kinds = tokens.map((t) => t.kind);
    expect(kinds).toContain("section-open");
    expect(kinds).toContain("section-close");
    expect(kinds).toContain("inverted-open");
    expect(kinds).toContain("placeholder");
  });

  it("behoudt bron-offsets", () => {
    const tokens = tokenize(NESTED);
    for (const t of tokens) {
      expect(NESTED.slice(t.start, t.end)).toBe(t.raw);
    }
  });
});
