import { describe, it, expect } from "vitest";
import { parse } from "../src/core/matcher.js";
import { tokenize } from "../src/core/tokenizer.js";
import type { TagToken } from "../src/core/types.js";

function tagTokens(tokens: ReturnType<typeof tokenize>): TagToken[] {
  return tokens.filter((t): t is TagToken => t.kind !== "text");
}

describe("angular-parser modus (default AAN)", () => {
  it("accepteert pipe-filter zonder spaties", () => {
    const r = parse("{omschrijving|lower}");
    expect(r.issues).toHaveLength(0);
    expect(tagTokens(r.tokens)[0].kind).toBe("placeholder");
  });

  it("accepteert pipe met argument + quotes", () => {
    const r = parse("{startdatumzaak_ongeformatteerd | date: 'dd-MM-yyyy'}");
    expect(r.issues).toHaveLength(0);
    expect(tagTokens(r.tokens)[0].kind).toBe("placeholder");
  });

  it("accepteert pipe met spaties en functie-naam", () => {
    const r = parse("{productnaam | lowerFirstChar}");
    expect(r.issues).toHaveLength(0);
    expect(tagTokens(r.tokens)[0].kind).toBe("placeholder");
  });

  it("accepteert vergelijking in section-open", () => {
    const r = parse('{#procedure == "Regulier"}inhoud{/}');
    expect(r.issues).toHaveLength(0);
    const tags = tagTokens(r.tokens);
    expect(tags[0].kind).toBe("section-open");
    expect(tags[1].kind).toBe("section-close");
  });

  it("accepteert typografische curly quotes (Word autocorrect)", () => {
    const r = parse("{#procedure == \u201cRegulier\u201d}x{/}");
    expect(r.issues).toHaveLength(0);
  });

  it("houdt balans-validatie op peil in angular mode", () => {
    const r = parse('{#procedure == "Regulier"}inhoud');
    expect(r.issues.some((i) => i.reason === "unclosed-open")).toBe(true);
  });
});

describe("strikte modus (angularParser: false)", () => {
  it("markeert pipes alsnog als invalid-name", () => {
    const r = parse("{naam|lower}", { angularParser: false });
    expect(r.issues.some((i) => i.reason === "invalid-name")).toBe(true);
  });

  it("laat gewone tags valide in strikte modus", () => {
    const r = parse("{voornaam}", { angularParser: false });
    expect(r.issues).toHaveLength(0);
  });
});

describe("realistisch Regulier/Uitgebreid sjabloon uit praktijk", () => {
  const template = `{#zaak}Uw verzoek voor {omschrijving|lower}, ontvangen op {startdatumzaak_ongeformatteerd | date: 'dd-MM-yyyy'}, betreffende {#productnaam}{productnaam | lowerFirstChar}{/}{^productnaam}VUL PRODUCTNAAM IN{/} is geregistreerd onder zaaknummer {zaaknummer}.
Deze zaak wordt behandeld door {#teamcoordinator}{teamcoordinator}{/}{^teamcoordinator}{teambehandelaar}{/}.{/zaak}
{#zaak}{#procedure == "Regulier"}We zullen uw verzoek in behandeling nemen.{/}{/zaak}
{#zaak}{#procedure == "Uitgebreid"}Uitgebreide procedure.{/}{/zaak}`;

  it("valideert foutloos in angular-mode", () => {
    const r = parse(template);
    expect(r.issues).toHaveLength(0);
  });
});
