import { describe, it, expect } from "vitest";
import { parse } from "../src/core/matcher.js";
import type { TagToken } from "../src/core/types.js";
import { ANONYMOUS_CLOSE, LETTER, MIXED_ERRORS, NESTED } from "./fixtures/sample-templates.js";

function tagTokens(tokens: ReturnType<typeof parse>["tokens"]): TagToken[] {
  return tokens.filter((t): t is TagToken => t.kind !== "text");
}

describe("matcher — balans", () => {
  it("koppelt open en close met dezelfde pairId", () => {
    const r = parse("{#items}hallo{/items}");
    const tags = tagTokens(r.tokens);
    expect(r.issues).toHaveLength(0);
    expect(tags[0].pairId).toBeDefined();
    expect(tags[0].pairId).toBe(tags[1].pairId);
  });

  it("kent depth toe bij nesting", () => {
    const r = parse("{#a}{#b}{#c}{/c}{/b}{/a}");
    const tags = tagTokens(r.tokens);
    const depths = tags.map((t) => t.depth);
    expect(depths).toEqual([0, 1, 2, 2, 1, 0]);
    expect(r.issues).toHaveLength(0);
  });

  it("koppelt anonieme close {/} aan laatst-geopende sectie", () => {
    const r = parse(ANONYMOUS_CLOSE);
    const tags = tagTokens(r.tokens);
    expect(r.issues).toHaveLength(0);
    expect(tags[0].pairId).toBe(tags[2].pairId);
  });

  it("detecteert onclosed open", () => {
    const r = parse("{#items}hallo");
    expect(r.issues).toHaveLength(1);
    expect(r.issues[0].reason).toBe("unclosed-open");
  });

  it("detecteert stray close", () => {
    const r = parse("hallo{/items}");
    expect(r.issues).toHaveLength(1);
    expect(r.issues[0].reason).toBe("stray-close");
  });

  it("detecteert verkeerd-genest: {#a}{#b}{/a}{/b}", () => {
    const r = parse(MIXED_ERRORS);
    const reasons = r.issues.map((i) => i.reason);
    expect(reasons).toContain("mismatched-close");
  });

  it("ondersteunt diepe nesting zonder fouten op een realistisch sjabloon", () => {
    const r = parse(NESTED);
    expect(r.issues).toHaveLength(0);
    const tags = tagTokens(r.tokens);
    const maxDepth = Math.max(...tags.map((t) => t.depth));
    expect(maxDepth).toBeGreaterThanOrEqual(2);
  });

  it("valideert een complete brief als foutvrij", () => {
    const r = parse(LETTER);
    expect(r.issues).toHaveLength(0);
  });
});

describe("matcher — syntax-fouten worden issues", () => {
  it("lege tag produceert issue", () => {
    const r = parse("tekst {} meer");
    expect(r.issues[0].reason).toBe("empty-tag");
  });

  it("onbekende prefix produceert issue", () => {
    const r = parse("{!iets}");
    expect(r.issues[0].reason).toBe("unknown-prefix");
  });

  it("onterminate tag produceert issue", () => {
    const r = parse("{naam");
    expect(r.issues[0].reason).toBe("unterminated");
  });
});

describe("matcher — inverted secties", () => {
  it("sluiten met {/naam} werkt net als sections", () => {
    const r = parse("{^leeg}niks{/leeg}");
    expect(r.issues).toHaveLength(0);
    const tags = tagTokens(r.tokens);
    expect(tags[0].kind).toBe("inverted-open");
    expect(tags[1].kind).toBe("section-close");
    expect(tags[0].pairId).toBe(tags[1].pairId);
  });
});

describe("matcher — pairId uniek per paar", () => {
  it("verschillende paren krijgen verschillende pairIds", () => {
    const r = parse("{#a}x{/a}{#b}y{/b}");
    const tags = tagTokens(r.tokens);
    expect(tags[0].pairId).not.toBe(tags[2].pairId);
    expect(tags[0].pairId).toBe(tags[1].pairId);
    expect(tags[2].pairId).toBe(tags[3].pairId);
  });
});
