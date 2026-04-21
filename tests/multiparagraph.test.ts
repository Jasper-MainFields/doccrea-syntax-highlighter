import { describe, it, expect } from "vitest";
import { parse } from "../src/core/matcher.js";

describe("multi-paragraph sections (regressie: {#zaak} op pagina 1, {/zaak} op pagina 8)", () => {
  it("matched open en close over een paragraafgrens heen", () => {
    const text = [
      "{#zaak}Uw verzoek voor {omschrijving|lower} is geregistreerd.",
      "Deze zaak wordt behandeld door team X.",
      "{/zaak}",
    ].join("\n");

    const r = parse(text);
    expect(r.issues).toHaveLength(0);
  });

  it("matched open en close over veel paragrafen met tussenliggende content", () => {
    const text = [
      "{#zaak}Start van de zaak.",
      "",
      "Paragraaf met {placeholder}.",
      "",
      "Meer content hier.",
      "",
      "Nog meer content.",
      "",
      "{/zaak}",
    ].join("\n");

    const r = parse(text);
    expect(r.issues).toHaveLength(0);
  });

  it("detecteert ongebalanceerde multi-paragraph sectie", () => {
    const text = [
      "{#zaak}Start.",
      "Content zonder sluiting.",
    ].join("\n");

    const r = parse(text);
    expect(r.issues.some((i) => i.reason === "unclosed-open")).toBe(true);
  });

  it("detecteert stray close over paragraafgrens", () => {
    const text = [
      "Normale paragraaf.",
      "{/zaak} zonder open.",
    ].join("\n");

    const r = parse(text);
    expect(r.issues.some((i) => i.reason === "stray-close")).toBe(true);
  });

  it("genestte secties over paragrafen", () => {
    const text = [
      "{#zaak}",
      "{#procedure == \"Regulier\"}",
      "Reguliere tekst.",
      "{/}",
      "{/zaak}",
    ].join("\n");

    const r = parse(text);
    expect(r.issues).toHaveLength(0);
  });
});
