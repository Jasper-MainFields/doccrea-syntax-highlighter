import {
  Body1,
  Body1Strong,
  Caption1,
  Field,
  Input,
  makeStyles,
  MessageBar,
  MessageBarBody,
  Switch,
  tokens,
} from "@fluentui/react-components";
import { useSettings } from "../state/settingsContext.js";

const useStyles = makeStyles({
  wrap: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalS,
  },
  card: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
});

export function SyntaxPanel(): JSX.Element {
  const s = useStyles();
  const { settings, setSettings } = useSettings();

  const updateSyntax = <K extends keyof typeof settings.syntax>(
    key: K,
    value: (typeof settings.syntax)[K],
  ): Promise<void> =>
    setSettings((prev) => ({
      ...prev,
      syntax: { ...prev.syntax, [key]: value },
    }));

  return (
    <div className={s.wrap}>
      <Body1Strong>Delimiters</Body1Strong>
      <Caption1>
        Standaard gebruikt DocxTemplater <code>{"{"}</code> en <code>{"}"}</code>. Pas dit aan
        alleen als je DocxTemplater zelf met andere delimiters start.
      </Caption1>

      <div className={s.row}>
        <Field label="Opening">
          <Input
            value={settings.syntax.delimiterOpen}
            onChange={(_, d) => updateSyntax("delimiterOpen", d.value)}
          />
        </Field>
        <Field label="Sluiting">
          <Input
            value={settings.syntax.delimiterClose}
            onChange={(_, d) => updateSyntax("delimiterClose", d.value)}
          />
        </Field>
      </div>

      {(settings.syntax.delimiterOpen === "" || settings.syntax.delimiterClose === "") && (
        <MessageBar intent="error">
          <MessageBarBody>Delimiters mogen niet leeg zijn.</MessageBarBody>
        </MessageBar>
      )}

      <div className={s.card}>
        <Field label="Diakrieten in tag-namen toestaan (bv. ß, é, ñ)">
          <Switch
            checked={settings.syntax.allowDiacritics}
            onChange={(_, d) => updateSyntax("allowDiacritics", Boolean(d.checked))}
          />
        </Field>
        <Caption1>
          DocxTemplater werkt standaard met ASCII-identifiers. Laat dit aan staan voor
          Nederlandstalige variabelen; uit voor strikte compatibiliteit met data-model-keys.
        </Caption1>
      </div>

      <div className={s.card}>
        <Field label="Angular-parser modus (pipes, vergelijkingen, argumenten)">
          <Switch
            checked={settings.syntax.angularParser}
            onChange={(_, d) => updateSyntax("angularParser", Boolean(d.checked))}
          />
        </Field>
        <Body1>
          Aan staat de highlighter brede expressies toe binnen tags, zoals
          <code>{` {naam|lower} `}</code>, <code>{` {d | date: 'dd-MM'} `}</code> en
          <code>{` {#status == "Open"} `}</code>. Zet uit voor strikte validatie als je
          DocxTemplater zonder angular-parser-module gebruikt.
        </Body1>
      </div>
    </div>
  );
}
