import type { IssueLocation } from "../../word/applyHighlights.js";
import type { ValidationIssue } from "../../core/types.js";

const LAST_RUN_KEY = "doccrea.lastRun.v1";

export interface LastRun {
  when: string;
  tokensHighlighted: number;
  issues: ValidationIssue[];
  issueLocations: IssueLocation[];
}

export function loadLastRun(): LastRun | null {
  try {
    const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(LAST_RUN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LastRun;
  } catch {
    return null;
  }
}

export async function saveLastRun(run: LastRun): Promise<void> {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(LAST_RUN_KEY, JSON.stringify(run));
}
