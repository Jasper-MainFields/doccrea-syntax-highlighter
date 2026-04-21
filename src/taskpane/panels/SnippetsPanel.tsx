import { useCallback, useState } from "react";
import {
  Body1,
  Body1Strong,
  Button,
  Caption1,
  Field,
  Input,
  makeStyles,
  MessageBar,
  MessageBarBody,
  Textarea,
  tokens,
} from "@fluentui/react-components";
import { AddRegular, DeleteRegular, ArrowDownloadRegular } from "@fluentui/react-icons";
import { useSettings } from "../state/settingsContext.js";
import { insertSnippet } from "../../word/insertSnippet.js";
import { DEFAULT_SNIPPETS, type Snippet } from "../../core/defaults.js";

const useStyles = makeStyles({
  wrap: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  card: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  snippetRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalS,
  },
  preview: {
    fontFamily: tokens.fontFamilyMonospace,
    whiteSpace: "pre-wrap",
    backgroundColor: tokens.colorNeutralBackground3,
    padding: tokens.spacingVerticalXS,
    borderRadius: tokens.borderRadiusSmall,
    fontSize: tokens.fontSizeBase200,
    maxHeight: "120px",
    overflowY: "auto",
  },
  actions: {
    display: "flex",
    gap: tokens.spacingHorizontalXS,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
});

export function SnippetsPanel(): JSX.Element {
  const s = useStyles();
  const { settings, setSettings } = useSettings();

  const handleInsert = useCallback((snippet: Snippet) => {
    insertSnippet(snippet).catch((err) => {
      console.error("Insert faalde:", err);
      alert("Kon dit snippet niet invoegen: " + (err instanceof Error ? err.message : String(err)));
    });
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      await setSettings((prev) => ({
        ...prev,
        snippets: prev.snippets.filter((s) => s.id !== id),
      }));
    },
    [setSettings],
  );

  const handleRestoreBuiltins = useCallback(async () => {
    await setSettings((prev) => {
      const existingIds = new Set(prev.snippets.map((s) => s.id));
      const missing = DEFAULT_SNIPPETS.filter((s) => !existingIds.has(s.id));
      return { ...prev, snippets: [...prev.snippets, ...missing] };
    });
  }, [setSettings]);

  return (
    <div className={s.wrap}>
      <MessageBar intent="info">
        <MessageBarBody>
          Klik "Voeg in" om een snippet op de cursor te plaatsen. Placeholder-tekst in{" "}
          <code>{"${select:naam}"}</code> wordt direct geselecteerd zodat je kunt doortypen.
        </MessageBarBody>
      </MessageBar>

      {settings.snippets.map((snippet) => (
        <div key={snippet.id} className={s.card}>
          <div className={s.snippetRow}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Body1Strong>{snippet.label}</Body1Strong>
              <Caption1>{snippet.group === "ingebouwd" ? "Ingebouwd" : "Eigen snippet"}</Caption1>
            </div>
            <div className={s.actions}>
              <Button
                appearance="primary"
                icon={<ArrowDownloadRegular />}
                onClick={() => handleInsert(snippet)}
              >
                Voeg in
              </Button>
              <Button
                appearance="subtle"
                icon={<DeleteRegular />}
                aria-label={`Verwijder ${snippet.label}`}
                onClick={() => handleDelete(snippet.id)}
              />
            </div>
          </div>
          <pre className={s.preview}>{snippet.body}</pre>
        </div>
      ))}

      {settings.snippets.length === 0 && (
        <MessageBar intent="warning">
          <MessageBarBody>Alle snippets verwijderd. Herstel de ingebouwde set hieronder.</MessageBarBody>
        </MessageBar>
      )}

      <Button onClick={handleRestoreBuiltins}>Herstel ingebouwde snippets</Button>

      <NewSnippetForm />
    </div>
  );
}

function NewSnippetForm(): JSX.Element {
  const s = useStyles();
  const { setSettings } = useSettings();
  const [label, setLabel] = useState("");
  const [body, setBody] = useState("");

  const canSubmit = label.trim().length > 0 && body.trim().length > 0;

  const submit = useCallback(async () => {
    if (!canSubmit) return;
    const id = `custom-${Date.now()}`;
    await setSettings((prev) => ({
      ...prev,
      snippets: [
        ...prev.snippets,
        { id, label: label.trim(), body, group: "eigen" as const },
      ],
    }));
    setLabel("");
    setBody("");
  }, [canSubmit, label, body, setSettings]);

  return (
    <div className={s.card}>
      <Body1Strong>Eigen snippet toevoegen</Body1Strong>
      <Body1>
        Tip: gebruik <code>{"${select:naam}"}</code> om een stuk tekst direct geselecteerd te
        zetten, of <code>{"${cursor}"}</code> om de cursor op een specifieke plek te zetten.
      </Body1>

      <div className={s.form}>
        <Field label="Label">
          <Input value={label} onChange={(_, d) => setLabel(d.value)} placeholder="Bijv. Adresblok" />
        </Field>
        <Field label="Body">
          <Textarea
            value={body}
            onChange={(_, d) => setBody(d.value)}
            rows={5}
            placeholder={"{#${select:adressen}}\n  {straat} {nummer}\n  {plaats}\n{/adressen}"}
          />
        </Field>
        <Button icon={<AddRegular />} appearance="primary" onClick={submit} disabled={!canSubmit}>
          Voeg snippet toe
        </Button>
      </div>
    </div>
  );
}
