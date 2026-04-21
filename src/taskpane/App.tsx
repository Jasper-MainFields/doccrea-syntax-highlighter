import { useState } from "react";
import {
  Tab,
  TabList,
  type SelectTabEvent,
  type SelectTabData,
  makeStyles,
  tokens,
  Title2,
  Caption1,
} from "@fluentui/react-components";
import { SettingsProvider } from "./state/settingsContext.js";
import { ValidationPanel } from "./panels/ValidationPanel.js";
import { ColorsPanel } from "./panels/ColorsPanel.js";
import { SyntaxPanel } from "./panels/SyntaxPanel.js";
import { SnippetsPanel } from "./panels/SnippetsPanel.js";
import { AboutPanel } from "./panels/AboutPanel.js";

// MainFields huisstijl — dezelfde basis als de icon-gradient in scripts/generate-icons.mjs.
export const MAINFIELDS_BRAND_COLOR = "#0F4C81";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    boxSizing: "border-box",
    gap: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  brandWord: {
    color: MAINFIELDS_BRAND_COLOR,
    fontWeight: tokens.fontWeightBold,
  },
  content: {
    flex: 1,
    overflowY: "auto",
    paddingBottom: tokens.spacingVerticalM,
  },
});

type PanelId = "validation" | "colors" | "syntax" | "snippets" | "about";

export function App(): JSX.Element {
  const styles = useStyles();
  const [tab, setTab] = useState<PanelId>("validation");

  const onTabSelect = (_e: SelectTabEvent, data: SelectTabData): void => {
    setTab(data.value as PanelId);
  };

  return (
    <SettingsProvider>
      <div className={styles.container}>
        <header className={styles.header}>
          <Title2>
            <span className={styles.brandWord}>MainFields</span> DocCrea Syntax Highlighter
          </Title2>
          <Caption1>
            Gemaakt door <span className={styles.brandWord}>MainFields</span>
          </Caption1>
        </header>

        <TabList selectedValue={tab} onTabSelect={onTabSelect}>
          <Tab value="validation">Scan</Tab>
          <Tab value="colors">Kleuren</Tab>
          <Tab value="syntax">Syntax</Tab>
          <Tab value="snippets">Snippets</Tab>
          <Tab value="about">Over</Tab>
        </TabList>

        <div className={styles.content}>
          {tab === "validation" && <ValidationPanel />}
          {tab === "colors" && <ColorsPanel />}
          {tab === "syntax" && <SyntaxPanel />}
          {tab === "snippets" && <SnippetsPanel />}
          {tab === "about" && <AboutPanel />}
        </div>
      </div>
    </SettingsProvider>
  );
}
