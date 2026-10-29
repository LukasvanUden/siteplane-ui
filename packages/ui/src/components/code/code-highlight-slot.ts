"use client";

import { useState } from "react";

/*
 * The seam between CodeBlock and syntax highlighting, and the only highlight
 * file CodeBlock imports. It names no shiki and loads nothing: it holds the
 * types of a highlighted line and one registration, so the `code` item installs
 * and updates without shiki. `code-highlight.ts`, the optional item, registers
 * the real highlighter here when it is imported.
 *
 * Registration has to happen before the first render of a CodeBlock, so import
 * `code-highlight` once in client code that loads with the app's first page,
 * for example the component that holds the root layout's providers, or call
 * `enableCodeHighlighting()` from it. A block takes the registered hook once,
 * when it mounts, and keeps it: a block that mounted before the registration
 * stays plain text, and never changes the hooks it calls between renders.
 */

/** One run of text with the colours it takes in the light and the dark theme. */
export type HighlightedToken = {
  readonly content: string;
  /**
   * The colours of the light and the dark theme, as hex. Text in the theme's
   * own text colour has none and takes the colour of the block, so a plain
   * word looks the same before and after the highlighter has loaded.
   */
  readonly light?: string;
  readonly dark?: string;
  readonly bold?: true;
  readonly italic?: true;
  readonly underline?: true;
};

/** The tokens of one line, without its line break. */
export type HighlightedLine = readonly HighlightedToken[];

/**
 * A hook that gives the lines of `code` in `language`, one for each line of
 * `code`, or `null` while it has none to show: no language, a language it does
 * not highlight, still loading, and always on the server.
 */
export type CodeHighlightHook = (
  code: string,
  language?: string,
) => HighlightedLine[] | null;

let registered: CodeHighlightHook | undefined;

/**
 * Sets the hook that CodeBlocks highlight with, for the blocks that mount
 * after it. `code-highlight.ts` calls it with `useHighlightedCode`; an app that
 * highlights some other way may call it with its own hook.
 */
export function registerCodeHighlighter(useHighlight: CodeHighlightHook): void {
  registered = useHighlight;
}

const withoutHighlighting: CodeHighlightHook = () => null;

/**
 * What CodeBlock calls: the registered highlighter, or `null` without one, so
 * the block stays plain text. The hook is read once per block, on its first
 * render, so a registration that comes late changes no block's hooks.
 */
export function useCodeHighlight(
  code: string,
  language?: string,
): HighlightedLine[] | null {
  const [useHighlight] = useState<CodeHighlightHook>(
    () => registered ?? withoutHighlighting,
  );
  return useHighlight(code, language);
}
