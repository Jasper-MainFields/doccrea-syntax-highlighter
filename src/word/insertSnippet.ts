/// <reference types="office-js" />
import type { Snippet } from "../core/defaults.js";

export interface ExpandedSnippet {
  before: string;
  placeholder: string;
  after: string;
  hasSelection: boolean;
}

/**
 * Ondersteunde placeholders in een snippet-body:
 *   - `${select:WORD}` — wordt ingevoegd als `WORD` en staat klaar voor
 *     directe selectie zodat doortypen het vervangt.
 *   - `${cursor}` — cursorpositie na invoegen (geen selectie).
 * Zonder placeholder komt de cursor aan het einde van het snippet.
 */
export function expandSnippet(snippet: Snippet): ExpandedSnippet {
  const body = snippet.body;
  const selectMatch = /\$\{select:([^}]*)\}/.exec(body);

  if (selectMatch) {
    return {
      before: body.slice(0, selectMatch.index),
      placeholder: selectMatch[1],
      after: body.slice(selectMatch.index + selectMatch[0].length),
      hasSelection: true,
    };
  }

  const cursorIdx = body.indexOf("${cursor}");
  if (cursorIdx !== -1) {
    return {
      before: body.slice(0, cursorIdx),
      placeholder: "",
      after: body.slice(cursorIdx + "${cursor}".length),
      hasSelection: false,
    };
  }

  return { before: body, placeholder: "", after: "", hasSelection: false };
}

export async function insertSnippet(snippet: Snippet): Promise<void> {
  const { before, placeholder, after, hasSelection } = expandSnippet(snippet);

  await Word.run(async (context) => {
    const selection = context.document.getSelection();

    // Stap 1: vervang huidige selectie door het "before"-deel.
    const beforeRange = selection.insertText(before, "Replace");
    // Stap 2: voeg de placeholder daarachter in als aparte range.
    const placeholderRange = beforeRange.getRange("End").insertText(placeholder, "After");
    // Stap 3: voeg "after" in achter de placeholder.
    const afterRange = placeholderRange.getRange("End").insertText(after, "After");

    if (hasSelection && placeholder.length > 0) {
      placeholderRange.select("Select");
    } else {
      afterRange.getRange("End").select("End");
    }

    await context.sync();
  });
}
