export * from "./types.js";
export { tokenize } from "./tokenizer.js";
export { parse } from "./matcher.js";
export {
  BUILTIN_PRESETS,
  DEFAULT_PRESET_ID,
  DEFAULT_SNIPPETS,
  buildDefaultSettings,
  shadeForDepth,
  type AppSettings,
  type ColorPreset,
  type Snippet,
  type StyleMap,
  type SyntaxSettings,
  type TagStyle,
  type ValidationSettings,
} from "./defaults.js";
