"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import type {
  GrammarState,
  HighlighterCore,
  LanguageInput,
  ThemedTokenWithVariants,
} from "shiki/core";

import {
  registerCodeHighlighter,
  type HighlightedLine,
  type HighlightedToken,
} from "./code-highlight-slot";

export type { HighlightedLine, HighlightedToken };

/*
 * Syntax highlighting for CodeBlock (`language`). It is the optional part of
 * Code and the only file that names shiki: CodeBlock itself imports only
 * `code-highlight-slot.ts`, so a page, an install or an update that never
 * highlights has no shiki in it. Shiki, its JavaScript regex engine (no WASM),
 * the two themes and each language are dynamic imports, made the first time a
 * block asks for that language.
 *
 * To turn highlighting on, import this module once, before the first CodeBlock
 * renders: importing it registers `useHighlightedCode` with the slot, and so
 * does `enableCodeHighlighting()`, which an app can call where a bare import
 * would not be kept, such as a bundler that drops imports of a package it knows
 * to be free of side effects. A good place for either is client code that loads
 * with the first page, such as the component that holds the root layout's
 * providers. A CodeBlock that mounted before the registration stays plain text.
 *
 * The result is plain data (lines of tokens with a light and a dark colour),
 * which CodeBlock renders as React spans. Nothing goes through innerHTML.
 */

/** The languages CodeBlock highlights. Any other `language` shows plain text. */
export const highlightLanguages = [
  "bash",
  "css",
  "diff",
  "html",
  "javascript",
  "json",
  "jsx",
  "markdown",
  "python",
  "sql",
  "tsx",
  "typescript",
  "yaml",
] as const;

export type HighlightLanguage = (typeof highlightLanguages)[number];

const languageAliases: Readonly<Record<string, HighlightLanguage>> = {
  cjs: "javascript",
  cts: "typescript",
  js: "javascript",
  javascriptreact: "jsx",
  md: "markdown",
  mjs: "javascript",
  mts: "typescript",
  py: "python",
  sh: "bash",
  shell: "bash",
  shellscript: "bash",
  ts: "typescript",
  typescriptreact: "tsx",
  yml: "yaml",
  zsh: "bash",
};

/**
 * The language CodeBlock highlights for a fence or `language` name, or
 * `undefined` when it has none: the name or its alias, in any case.
 */
export function resolveHighlightLanguage(
  language: string,
): HighlightLanguage | undefined {
  const name = language.trim().toLowerCase();
  return (
    highlightLanguages.find((candidate) => candidate === name) ??
    (Object.hasOwn(languageAliases, name) ? languageAliases[name] : undefined)
  );
}

// The docs' themes (apps/site/src/lib/code-theme.ts) with their contrast fix,
// which the kit repeats because a component cannot import from an app: the
// light comment colour reaches 4.5:1 only as #59636e.
const themes = {
  dark: "github-dark-default",
  light: "github-light-default",
} as const;
const colorReplacements = {
  "github-light-default": { "#6e7781": "#59636e" },
};

// Lines longer than this are not tokenized, so a minified or machine-written
// line cannot hold the page.
const tokenizeMaxLineLength = 2000;

const languageLoaders: Record<HighlightLanguage, () => LanguageInput> = {
  bash: () => import("shiki/langs/shellscript.mjs"),
  css: () => import("shiki/langs/css.mjs"),
  diff: () => import("shiki/langs/diff.mjs"),
  html: () => import("shiki/langs/html.mjs"),
  javascript: () => import("shiki/langs/javascript.mjs"),
  json: () => import("shiki/langs/json.mjs"),
  jsx: () => import("shiki/langs/jsx.mjs"),
  markdown: () => import("shiki/langs/markdown.mjs"),
  python: () => import("shiki/langs/python.mjs"),
  sql: () => import("shiki/langs/sql.mjs"),
  tsx: () => import("shiki/langs/tsx.mjs"),
  typescript: () => import("shiki/langs/typescript.mjs"),
  yaml: () => import("shiki/langs/yaml.mjs"),
};

type Loaded = {
  highlighter: HighlighterCore;
  /** The text colour of each theme, which a token does not repeat. */
  foreground: { dark: string; light: string };
};

let loadedHighlighter: Loaded | undefined;
let pendingHighlighter: Promise<Loaded> | undefined;
const readyLanguages = new Set<HighlightLanguage>();
const pendingLanguages = new Map<HighlightLanguage, Promise<void>>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function createHighlighter(): Promise<Loaded> {
  const [core, engine] = await Promise.all([
    import("shiki/core"),
    import("shiki/engine/javascript"),
  ]);
  const highlighter = await core.createHighlighterCore({
    engine: engine.createJavaScriptRegexEngine({ forgiving: true }),
    langs: [],
    themes: [
      import("shiki/themes/github-light-default.mjs"),
      import("shiki/themes/github-dark-default.mjs"),
    ],
  });
  loadedHighlighter = {
    foreground: {
      dark: highlighter.getTheme(themes.dark).fg.toLowerCase(),
      light: highlighter.getTheme(themes.light).fg.toLowerCase(),
    },
    highlighter,
  };
  return loadedHighlighter;
}

/**
 * Loads the highlighter and a language into it, once. A failed load (the
 * network, a blocked chunk) rejects and is forgotten, so the next call tries
 * again; the blocks that asked keep their plain text.
 */
export function loadHighlightLanguage(
  language: HighlightLanguage,
): Promise<void> {
  const known = pendingLanguages.get(language);
  if (known) return known;
  const load = (async () => {
    pendingHighlighter ??= createHighlighter();
    let loaded: Loaded;
    try {
      loaded = await pendingHighlighter;
    } catch (error) {
      pendingHighlighter = undefined;
      throw error;
    }
    await loaded.highlighter.loadLanguage(languageLoaders[language]());
    readyLanguages.add(language);
    for (const listener of listeners) listener();
  })();
  pendingLanguages.set(language, load);
  load.catch(() => {
    pendingLanguages.delete(language);
  });
  return load;
}

// Shiki's FontStyle flags.
const italicFlag = 1;
const boldFlag = 2;
const underlineFlag = 4;

function toLine(
  tokens: readonly ThemedTokenWithVariants[],
  foreground: Loaded["foreground"],
): HighlightedLine {
  const line: HighlightedToken[] = [];
  for (const token of tokens) {
    const light = token.variants.light;
    const dark = token.variants.dark;
    const lightColor = light?.color?.toLowerCase();
    const darkColor = dark?.color?.toLowerCase();
    const plain =
      (lightColor === undefined || lightColor === foreground.light) &&
      (darkColor === undefined || darkColor === foreground.dark);
    const fontStyle = light?.fontStyle ?? 0;
    const next: HighlightedToken = {
      content: token.content,
      ...(plain
        ? {}
        : {
            dark: darkColor ?? foreground.dark,
            light: lightColor ?? foreground.light,
          }),
      ...(fontStyle > 0 && fontStyle & boldFlag ? { bold: true as const } : {}),
      ...(fontStyle > 0 && fontStyle & italicFlag
        ? { italic: true as const }
        : {}),
      ...(fontStyle > 0 && fontStyle & underlineFlag
        ? { underline: true as const }
        : {}),
    };
    // Neighbours with one look are one run, which keeps the markup small.
    const last = line[line.length - 1];
    if (
      last &&
      last.light === next.light &&
      last.dark === next.dark &&
      last.bold === next.bold &&
      last.italic === next.italic &&
      last.underline === next.underline
    )
      line[line.length - 1] = {
        ...last,
        content: last.content + next.content,
      };
    else line.push(next);
  }
  return line;
}

function tokenizeChunk(
  { foreground, highlighter }: Loaded,
  language: HighlightLanguage,
  text: string,
  state: GrammarState | undefined,
): { lines: HighlightedLine[]; state: GrammarState | undefined } {
  const tokens = highlighter.codeToTokensWithThemes(text, {
    colorReplacements,
    lang: language,
    themes,
    tokenizeMaxLineLength,
    ...(state ? { grammarState: state } : {}),
  });
  return {
    lines: tokens.map((line) => toLine(line, foreground)),
    state: highlighter.getLastGrammarState(tokens),
  };
}

/*
 * The last text tokenized for each language, as complete lines with the
 * grammar state after them. A block that streams grows by a few characters at
 * a time, so the next call finds its text starting with the last one's and
 * tokenizes only the lines since, from that state; the line still being
 * written is tokenized again each time. The result is the same as tokenizing
 * the whole text, which the tests compare. It is a cache only: a text that
 * does not continue the last one starts over.
 */
type Progress = {
  lines: HighlightedLine[];
  state: GrammarState | undefined;
  /** The complete lines, each with the line break that ends it. */
  text: string;
};

/** What `tokenizeLines` remembers between calls; a test passes its own. */
export type HighlightProgress = Map<HighlightLanguage, Progress>;

const sharedProgress: HighlightProgress = new Map();

/**
 * The tokens of `code`, one line each, once `language` has loaded, or `null`
 * before. `code` has no carriage returns; a trailing line break makes a last,
 * empty line.
 */
export function tokenizeLines(
  language: HighlightLanguage,
  code: string,
  remembered: HighlightProgress = sharedProgress,
): HighlightedLine[] | null {
  const loaded = loadedHighlighter;
  if (!loaded || !readyLanguages.has(language)) return null;
  const previous = remembered.get(language);
  let progress: Progress =
    previous && code.startsWith(previous.text)
      ? previous
      : { lines: [], state: undefined, text: "" };
  const end = code.lastIndexOf("\n") + 1;
  if (end > progress.text.length) {
    const chunk = tokenizeChunk(
      loaded,
      language,
      code.slice(progress.text.length, end - 1),
      progress.state,
    );
    progress = {
      lines: [...progress.lines, ...chunk.lines],
      state: chunk.state,
      text: code.slice(0, end),
    };
    remembered.set(language, progress);
  }
  const tail = tokenizeChunk(
    loaded,
    language,
    code.slice(end),
    progress.state,
  ).lines;
  return [...progress.lines, tail[0] ?? []];
}

/**
 * Loads `language` if needed and tokenizes `code` with it, for the server, a
 * test or a caller with no component. Resolves `null` for a language that
 * CodeBlock does not highlight, and when the load fails.
 */
export async function highlightCode(
  code: string,
  language: string,
): Promise<HighlightedLine[] | null> {
  const resolved = resolveHighlightLanguage(language);
  if (!resolved) return null;
  try {
    await loadHighlightLanguage(resolved);
    return tokenizeLines(resolved, code.replace(/\r\n?/g, "\n"));
  } catch {
    return null;
  }
}

const notReady = () => false;

/**
 * The tokens of `code` in `language`, or `null` while there is nothing to
 * show: no language, a language that is not highlighted, the highlighter still
 * loading or its load failed, and always on the server and on the first render
 * of a page that hydrates, so the markup is the plain text. A block that
 * shows plain text and then tokens does not shift: text the theme leaves in
 * its own colour takes the colour of the block in both.
 *
 * `code` has no carriage returns. The line count equals that of `code`.
 */
export function useHighlightedCode(
  code: string,
  language?: string,
): HighlightedLine[] | null {
  const resolved = language ? resolveHighlightLanguage(language) : undefined;
  const ready = useSyncExternalStore(
    subscribe,
    () => resolved !== undefined && readyLanguages.has(resolved),
    notReady,
  );
  useEffect(() => {
    if (resolved === undefined || readyLanguages.has(resolved)) return;
    loadHighlightLanguage(resolved).catch(() => {
      // The block keeps its plain text.
    });
  }, [resolved]);
  return useMemo(() => {
    if (!ready || resolved === undefined) return null;
    try {
      return tokenizeLines(resolved, code);
    } catch {
      return null;
    }
  }, [code, ready, resolved]);
}

/**
 * Turns highlighting on for the CodeBlocks that mount after it, by registering
 * `useHighlightedCode` with the slot CodeBlock reads. Importing this module
 * does it once already; calling it again changes nothing.
 */
export function enableCodeHighlighting(): void {
  registerCodeHighlighter(useHighlightedCode);
}

enableCodeHighlighting();
