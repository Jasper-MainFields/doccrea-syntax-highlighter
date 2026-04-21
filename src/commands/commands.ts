/// <reference types="office-js" />
import { applyHighlights } from "../word/applyHighlights.js";
import { clearHighlights } from "../word/clearHighlights.js";
import { insertSnippet } from "../word/insertSnippet.js";
import { loadSettings, resolvePreset } from "../word/settings.js";
import { DEFAULT_SNIPPETS, type Snippet } from "../core/defaults.js";

const LAST_RUN_KEY = "doccrea.lastRun.v1";

Office.onReady(() => {
  // No-op — Office registreert de Action-functies automatisch via associate.
});

async function runHighlight(event: Office.AddinCommands.Event): Promise<void> {
  try {
    const settings = loadSettings();
    const preset = resolvePreset(settings);
    const result = await applyHighlights(settings, preset);

    // Bewaar het laatste resultaat in localStorage (zelfde origin als het
    // taskpane) zodat de issue-lijst zichtbaar is zonder herparsen.
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        LAST_RUN_KEY,
        JSON.stringify({
          when: new Date().toISOString(),
          tokensHighlighted: result.tokensHighlighted,
          issues: result.issues,
          issueLocations: result.issueLocations,
        }),
      );
    }
  } catch (err) {
    console.error("Highlight faalde:", err);
  } finally {
    event.completed();
  }
}

async function runClear(event: Office.AddinCommands.Event): Promise<void> {
  try {
    const settings = loadSettings();
    await clearHighlights(settings);
    event.completed();
  } catch (err) {
    console.error("Clear faalde:", err);
    event.completed();
  }
}

function findSnippet(id: string): Snippet {
  const settings = loadSettings();
  return (
    settings.snippets.find((s) => s.id === id) ??
    DEFAULT_SNIPPETS.find((s) => s.id === id) ??
    DEFAULT_SNIPPETS[0]
  );
}

async function runSnippet(event: Office.AddinCommands.Event, id: string): Promise<void> {
  try {
    await insertSnippet(findSnippet(id));
  } catch (err) {
    console.error(`Snippet ${id} faalde:`, err);
  } finally {
    event.completed();
  }
}

// --- Office-associations ---
Office.actions.associate("highlightDocument", runHighlight);
Office.actions.associate("clearHighlights", runClear);
Office.actions.associate("insertSnippetPlaceholder", (ev: Office.AddinCommands.Event) => runSnippet(ev, "snippet-placeholder"));
Office.actions.associate("insertSnippetLoop", (ev: Office.AddinCommands.Event) => runSnippet(ev, "snippet-loop"));
Office.actions.associate("insertSnippetCondition", (ev: Office.AddinCommands.Event) => runSnippet(ev, "snippet-condition"));
Office.actions.associate("insertSnippetInverted", (ev: Office.AddinCommands.Event) => runSnippet(ev, "snippet-inverted"));
Office.actions.associate("insertSnippetRawXml", (ev: Office.AddinCommands.Event) => runSnippet(ev, "snippet-rawxml"));
Office.actions.associate("insertSnippetTableRow", (ev: Office.AddinCommands.Event) => runSnippet(ev, "snippet-tablerow"));
