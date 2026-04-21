import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Badge,
  Body1,
  Body1Strong,
  Caption1,
  makeStyles,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Spinner,
  tokens,
  Switch,
  Field,
} from "@fluentui/react-components";
import { ArrowRightRegular, CheckmarkCircleRegular, WarningRegular } from "@fluentui/react-icons";
import { loadLastRun, saveLastRun, type LastRun } from "../state/lastRun.js";
import { goToIssue } from "../../word/goToIssue.js";
import { applyHighlights } from "../../word/applyHighlights.js";
import { clearHighlights } from "../../word/clearHighlights.js";
import { loadSettings, resolvePreset, saveSettings } from "../../word/settings.js";
import type { InvalidReason } from "../../core/types.js";

const REASON_LABEL: Record<InvalidReason, string> = {
  "empty-tag": "Lege tag",
  "unknown-prefix": "Onbekend tag-type",
  "invalid-name": "Ongeldige naam",
  unterminated: "Tag niet afgesloten",
  "stray-close": "Losse sluitingstag",
  "mismatched-close": "Verkeerd gesloten nesting",
  "unclosed-open": "Open sectie zonder sluiting",
};

const useStyles = makeStyles({
  wrap: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  toolbar: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
  },
  issueCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: tokens.spacingVerticalS,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    gap: tokens.spacingHorizontalM,
  },
  issueText: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  code: {
    fontFamily: tokens.fontFamilyMonospace,
    backgroundColor: tokens.colorNeutralBackground3,
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalXS}`,
    borderRadius: tokens.borderRadiusSmall,
    wordBreak: "break-all",
  },
  settings: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
});

export function ValidationPanel(): JSX.Element {
  const styles = useStyles();
  const [lastRun, setLastRun] = useState<LastRun | null>(null);
  const [busy, setBusy] = useState<"idle" | "run" | "clear">("idle");
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState(loadSettings());

  useEffect(() => {
    setLastRun(loadLastRun());
  }, []);

  const runHighlight = useCallback(async () => {
    setBusy("run");
    setError(null);
    try {
      const preset = resolvePreset(settings);
      const result = await applyHighlights(settings, preset);
      const run: LastRun = {
        when: new Date().toISOString(),
        tokensHighlighted: result.tokensHighlighted,
        issues: result.issues,
        issueLocations: result.issueLocations,
      };
      await saveLastRun(run);
      setLastRun(run);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("idle");
    }
  }, [settings]);

  const runClear = useCallback(async () => {
    setBusy("clear");
    setError(null);
    try {
      await clearHighlights(settings);
      const run: LastRun = {
        when: new Date().toISOString(),
        tokensHighlighted: 0,
        issues: [],
        issueLocations: [],
      };
      await saveLastRun(run);
      setLastRun(run);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("idle");
    }
  }, [settings]);

  const updateCheck = useCallback(
    async (key: "checkBalance" | "checkSyntax", value: boolean) => {
      const next = {
        ...settings,
        validation: { ...settings.validation, [key]: value },
      };
      setSettings(next);
      await saveSettings(next);
    },
    [settings],
  );

  const hasIssues = (lastRun?.issues.length ?? 0) > 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <Button appearance="primary" onClick={runHighlight} disabled={busy !== "idle"}>
          {busy === "run" ? <Spinner size="tiny" /> : "Highlight document"}
        </Button>
        <Button appearance="secondary" onClick={runClear} disabled={busy !== "idle"}>
          {busy === "clear" ? <Spinner size="tiny" /> : "Clear highlights"}
        </Button>
      </div>

      {error && (
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>Er ging iets mis</MessageBarTitle>
            {error}
          </MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.settings}>
        <Body1Strong>Wat wordt er gecontroleerd?</Body1Strong>
        <Field label="Balans (open/close, nesting)">
          <Switch
            checked={settings.validation.checkBalance}
            onChange={(_, d) => updateCheck("checkBalance", Boolean(d.checked))}
          />
        </Field>
        <Field label="Syntax (onbekende tags, ongeldige namen)">
          <Switch
            checked={settings.validation.checkSyntax}
            onChange={(_, d) => updateCheck("checkSyntax", Boolean(d.checked))}
          />
        </Field>
      </div>

      {!lastRun && (
        <MessageBar intent="info">
          <MessageBarBody>
            Druk op "Highlight document" om je sjabloon te scannen.
          </MessageBarBody>
        </MessageBar>
      )}

      {lastRun && !hasIssues && (
        <MessageBar intent="success">
          <MessageBarBody>
            <MessageBarTitle>
              <CheckmarkCircleRegular /> Geen problemen gevonden
            </MessageBarTitle>
            {lastRun.tokensHighlighted} tags gekleurd.
          </MessageBarBody>
        </MessageBar>
      )}

      {lastRun && hasIssues && (
        <>
          <Body1Strong>
            Problemen gevonden{" "}
            <Badge appearance="filled" color="danger">
              {lastRun.issues.length}
            </Badge>
          </Body1Strong>
          {lastRun.issueLocations.map((loc, idx) => (
            <div key={`${loc.paragraphIndex}-${idx}`} className={styles.issueCard}>
              <div className={styles.issueText}>
                <Body1>
                  <WarningRegular /> {REASON_LABEL[loc.issue.reason]}
                </Body1>
                <code className={styles.code}>{loc.issue.raw}</code>
                <Caption1>{loc.issue.message}</Caption1>
              </div>
              <Button
                icon={<ArrowRightRegular />}
                onClick={() => goToIssue(loc.paragraphIndex, loc.issue).catch(console.error)}
              >
                Ga heen
              </Button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
