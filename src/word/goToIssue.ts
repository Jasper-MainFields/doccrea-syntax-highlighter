/// <reference types="office-js" />
import type { ValidationIssue } from "../core/types.js";

/**
 * Spring naar een fout in het document. We vinden de paragraaf via index
 * en selecteren daar de exacte tag-tekst (issue.raw).
 *
 * Als de paragraaf intussen veranderd is (gebruiker typte verder) dan is de
 * raw-tekst er mogelijk niet meer; we vangen dat op door niks te selecteren
 * en de gebruiker in plaats daarvan naar de paragraaf-start te scrollen.
 */
export async function goToIssue(paragraphIndex: number, issue: ValidationIssue): Promise<void> {
  await Word.run(async (context) => {
    const paragraphs = context.document.body.paragraphs;
    paragraphs.load("items");
    await context.sync();

    const paragraph = paragraphs.items[paragraphIndex];
    if (!paragraph) return;

    paragraph.load("text");
    await context.sync();

    const search = paragraph.search(issue.raw, {
      matchCase: true,
      matchWholeWord: false,
      matchPrefix: false,
      matchSuffix: false,
      matchWildcards: false,
    });
    search.load("items");
    await context.sync();

    const match = search.items[0];
    if (match) {
      match.select("Select");
    } else {
      paragraph.getRange("Start").select("Start");
    }
    await context.sync();
  });
}
