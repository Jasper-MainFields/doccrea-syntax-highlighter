import { makeStyles, tokens, Title3, Body1, Caption1, Link } from "@fluentui/react-components";
import { MAINFIELDS_GRAY, MAINFIELDS_TEAL } from "../branding.js";

const useStyles = makeStyles({
  wrap: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  block: {
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  brandMain: {
    color: MAINFIELDS_GRAY,
    fontWeight: tokens.fontWeightBold,
  },
  brandFields: {
    color: MAINFIELDS_TEAL,
    fontWeight: tokens.fontWeightBold,
  },
});

const APP_VERSION = "0.1.0";

function MainFieldsWord(): JSX.Element {
  const s = useStyles();
  return (
    <>
      <span className={s.brandMain}>Main</span>
      <span className={s.brandFields}>Fields</span>
    </>
  );
}

export function AboutPanel(): JSX.Element {
  const s = useStyles();
  return (
    <div className={s.wrap}>
      <Title3>
        <MainFieldsWord /> DocCrea Syntax Highlighter
      </Title3>
      <Caption1>Versie {APP_VERSION}</Caption1>

      <div className={s.block}>
        <Body1>
          Gemaakt door{" "}
          <Link href="https://www.mainfields.nl" target="_blank" rel="noopener noreferrer">
            <MainFieldsWord />
          </Link>
          . Deze add-in kleurt DocxTemplater-syntaxen en vangt fouten vóór je je sjabloon rendert.
        </Body1>
      </div>

      <div className={s.block}>
        <Body1>Feedback of een bug gevonden?</Body1>
        <Caption1>
          Stuur een bericht via de website of maak een issue aan op GitHub (
          <Link
            href="https://github.com/Jasper-MainFields/doccrea-syntax-highlighter/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            Jasper-MainFields/doccrea-syntax-highlighter
          </Link>
          ).
        </Caption1>
      </div>
    </div>
  );
}
