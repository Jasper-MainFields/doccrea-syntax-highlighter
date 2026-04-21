/// <reference types="office-js" />
import type { IssueLocation } from "../../word/applyHighlights.js";
import type { ValidationIssue } from "../../core/types.js";

const LAST_RUN_KEY = "doccrea.lastRun";

export interface LastRun {
  when: string;
  tokensHighlighted: number;
  issues: ValidationIssue[];
  issueLocations: IssueLocation[];
}

export function loadLastRun(): LastRun | null {
  try {
    const raw = Office.context.roamingSettings?.get(LAST_RUN_KEY);
    if (!raw) return null;
    return typeof raw === "string" ? (JSON.parse(raw) as LastRun) : (raw as LastRun);
  } catch {
    return null;
  }
}

export async function saveLastRun(run: LastRun): Promise<void> {
  Office.context.roamingSettings.set(LAST_RUN_KEY, JSON.stringify(run));
  return new Promise((resolve, reject) => {
    Office.context.roamingSettings.saveAsync((r) => {
      if (r.status === Office.AsyncResultStatus.Succeeded) resolve();
      else reject(r.error);
    });
  });
}
