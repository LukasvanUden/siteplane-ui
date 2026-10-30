"use client";

import { cva, type VariantProps } from "class-variance-authority";
import {
  Fragment,
  memo,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";

import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { RevealIcon } from "../action-icons";
import { Button } from "../button";
import { CopyButton } from "../copy-button";
import { useCodeHighlight, type HighlightedLine } from "./code-highlight-slot";

import "./code.css";

// Inline code wraps a long command or an unbroken value between any two
// characters with the text around it, so it never widens its line (rulebook
// K5).
const codeInlineClassName =
  "rounded-(--code-inline-radius) bg-muted px-1.5 py-0.5 font-mono [font-size:var(--code-inline-font-size)] text-foreground wrap-anywhere";
const codeBlockBaseClassName =
  "relative w-full overflow-x-auto rounded-lg bg-muted/50 font-mono text-foreground leading-relaxed";
// The md size names its line height with its font size: a bare text-xs
// replaced the block's leading-relaxed, so sm had taller lines than md.
const codeBlockSizeClassNames = {
  md: "px-3.5 py-3 text-xs/relaxed",
  sm: "px-3 py-2 [font-size:var(--code-block-sm-font-size)]",
} as const;

export function Code({ className, ...props }: ComponentProps<"code">) {
  return (
    <code
      className={cn(slotClass("code", props), codeInlineClassName, className)}
      data-slot="code"
      {...props}
    />
  );
}

const codeBlockVariants = cva(codeBlockBaseClassName, {
  defaultVariants: { size: "md" },
  variants: { size: codeBlockSizeClassNames },
});

/** The words a CodeBlock speaks to assistive technology. */
export type CodeBlockLabels = {
  /** Read in place of a masked value. */
  hidden: string;
  /** The reveal button while the value is masked. */
  reveal: string;
  /** The same button while the value shows. */
  hide: string;
  /** The copy button. */
  copy: string;
  /** The copy button while its check confirms a copy. */
  copied: string;
  /** The copy button and its announcement when the clipboard refuses. */
  copyFailed: string;
};

const defaultCodeBlockLabels: CodeBlockLabels = {
  hidden: "Hidden value",
  reveal: "Reveal value",
  hide: "Hide value",
  copy: "Copy to clipboard",
  copied: "Copied to clipboard",
  copyFailed: "Copy unavailable",
};

/** What a line of a block shows: a change, or a line the text calls out. */
export type CodeLineState = "added" | "removed" | "highlighted";

export interface CodeBlockProps
  extends
    Omit<ComponentProps<"pre">, "children" | "title">,
    VariantProps<typeof codeBlockVariants> {
  value: string;
  copyable?: boolean;
  /** Replaces the English names of the hidden value and the actions. */
  labels?: Partial<CodeBlockLabels> | undefined;
  mask?: boolean;
  /**
   * The language to highlight, such as `tsx` or `sql`, with the names and
   * aliases of `highlightLanguages` (code-highlight.ts). Highlighting is an
   * optional module: the app imports `code-highlight` once, before the first
   * CodeBlock renders, or calls its `enableCodeHighlighting()`. Shiki then
   * loads when a block first asks for a language; until it has, on the server,
   * for a language that is not listed, and without the module, the block shows
   * plain text.
   */
  language?: string | undefined;
  /**
   * A header row with the title, such as a file name. The reveal and copy
   * actions move into it. A string title also carries itself as the title
   * attribute, for the moment an ellipsis cuts it.
   */
  title?: ReactNode;
  /** Numbers the lines. The numbers are left out of a selection and the copy. */
  lineNumbers?: boolean | undefined;
  /** The number of the first line, such as for a snippet from the middle of a file. */
  startLine?: number | undefined;
  /**
   * Marks lines by their number, as shown (`startLine` counts): `added` and
   * `removed` lines get a fill and a + or − mark, `highlighted` lines a
   * fill. The marks are left out of a selection and the copy.
   */
  lineStates?: Readonly<Record<number, CodeLineState>> | undefined;
  /**
   * The text is still arriving: the copy action stays disabled until it has
   * all come.
   */
  streaming?: boolean | undefined;
}

// A block that gives its code a header or numbers its lines hands the inset
// from its edges to the header and the lines, so a line's fill reaches both
// edges (the size scale of codeBlockSizeClassNames, split up).
const codeBlockInsetClassNames = { md: "px-3.5", sm: "px-3" } as const;
const codeBlockHeaderClassNames = {
  md: "ps-3.5 pe-2",
  sm: "ps-3 pe-1",
} as const;
const codeBlockTitledClassNames = {
  md: "flex flex-col gap-2 pt-2",
  sm: "flex flex-col gap-1.5 pt-1",
} as const;
const codeBlockMarkClassNames = { md: "start-1", sm: "start-0.5" } as const;

/**
 * The lines of a value, as a block shows them: carriage returns are one line
 * break, and a line break at the very end only ends the last line.
 */
function splitCodeLines(value: string): string[] {
  return value.replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n");
}

/** The tokens of one line: runs in the text colour are bare text, the rest are spans. */
function CodeTokens({ line }: { line: HighlightedLine }): ReactNode {
  return line.map((token, index) =>
    token.light === undefined &&
    !token.bold &&
    !token.italic &&
    !token.underline ? (
      token.content
    ) : (
      <span
        className="sp-code-token"
        data-bold={token.bold ? "" : undefined}
        data-italic={token.italic ? "" : undefined}
        data-underline={token.underline ? "" : undefined}
        key={index}
        style={
          {
            "--sp-code-token-dark": token.dark,
            "--sp-code-token-light": token.light,
          } as CSSProperties
        }
      >
        {token.content}
      </span>
    ),
  );
}

type CodeLineProps = {
  insetClassName: string;
  markClassName: string;
  number: number;
  numbered: boolean;
  state: CodeLineState | undefined;
  text: string;
  tokens: HighlightedLine | undefined;
};

// A line renders again only when it changed: while text streams in, the lines
// before the last keep their tokens, so they keep their elements.
const CodeLine = memo(function CodeLine({
  insetClassName,
  markClassName,
  number,
  numbered,
  state,
  text,
  tokens,
}: CodeLineProps) {
  return (
    <span
      className={cn(slotClass("code-block-line"), insetClassName)}
      data-line={number}
      data-line-state={state}
      data-numbered={numbered ? "" : undefined}
      data-slot="code-block-line"
    >
      {state === "added" || state === "removed" ? (
        <span
          className={cn(slotClass("code-block-line-mark"), markClassName)}
          data-slot="code-block-line-mark"
        >
          {state === "added" ? "+" : "\u2212"}
        </span>
      ) : null}
      {numbered ? (
        <span
          aria-hidden="true"
          className={slotClass("code-block-line-number")}
          data-slot="code-block-line-number"
        >
          {number}
        </span>
      ) : null}
      <span
        className={slotClass("code-block-line-content")}
        data-slot="code-block-line-content"
      >
        {/* An empty line holds a line break, so it keeps its height and a
            selection keeps the blank line. */}
        {tokens && tokens.length > 0 ? (
          <CodeTokens line={tokens} />
        ) : text === "" ? (
          "\n"
        ) : (
          text
        )}
      </span>
    </span>
  );
});

export function CodeBlock({
  value,
  copyable = false,
  labels,
  mask = false,
  size,
  className,
  language,
  title,
  lineNumbers = false,
  startLine = 1,
  lineStates,
  streaming = false,
  ...props
}: CodeBlockProps) {
  const text = { ...defaultCodeBlockLabels, ...labels };
  // The person's reveal, which a change of `mask` takes back: a block that is
  // masked after it loaded is hidden again, not left in clear text.
  const [revealedByPerson, setRevealedByPerson] = useState(false);
  const [maskedBefore, setMaskedBefore] = useState(mask);
  if (maskedBefore !== mask) {
    setMaskedBefore(mask);
    setRevealedByPerson(false);
  }
  const revealed = !mask || revealedByPerson;
  const masked = mask && !revealed;
  const hasActions = copyable || mask;
  // The 24px field actions keep their glyph as far from the top edge as from
  // the end edge; the code text stops just before them. They stand 4 px apart,
  // as field actions side by side do in an InputGroup addon (sp-field-actions,
  // design-rework.css).
  const isSmall = size === "sm";
  const sizeKey = isSmall ? "sm" : "md";
  const actionClassName = cn(
    "sp-field-actions absolute flex",
    isSmall ? "end-1" : "end-2",
    mask ? "top-1/2 -translate-y-1/2" : isSmall ? "top-1" : "top-2",
  );

  // The structure comes from the props that ask for it. A block without them
  // is the original markup: the value as one text node in the code element.
  const hasTitle =
    title !== undefined && title !== null && title !== false && title !== "";
  const hasLineStates =
    lineStates !== undefined && Object.keys(lineStates).length > 0;
  // A masked value is bullets, whatever else is asked.
  const perLine = !masked && (lineNumbers || hasLineStates);
  const structured = hasTitle || perLine;
  const lines =
    !masked && (perLine || language !== undefined)
      ? splitCodeLines(value)
      : undefined;
  const highlighted = useCodeHighlight(
    lines ? lines.join("\n") : "",
    masked ? undefined : language,
  );
  const firstLine = Number.isFinite(startLine) ? Math.trunc(startLine) : 1;
  const gutter = Math.max(
    String(firstLine).length,
    String(firstLine + (lines?.length ?? 1) - 1).length,
  );
  const insetClassName = codeBlockInsetClassNames[sizeKey];

  let content: ReactNode;
  if (masked) {
    content = (
      <>
        {/* The bullets only show that a value is hidden; a screen reader
            hears one short text instead of dozens of "bullet". */}
        <span aria-hidden="true">{"•".repeat(Math.min(value.length, 44))}</span>
        <span className="sr-only">{text.hidden}</span>
      </>
    );
  } else if (perLine && lines) {
    content = lines.map((line, index) => (
      <CodeLine
        insetClassName={cn(
          insetClassName,
          hasActions && !hasTitle && (copyable && mask ? "pe-18" : "pe-11"),
        )}
        key={index}
        markClassName={codeBlockMarkClassNames[sizeKey]}
        number={firstLine + index}
        numbered={lineNumbers}
        state={lineStates?.[firstLine + index]}
        text={line}
        tokens={highlighted?.[index]}
      />
    ));
  } else if (highlighted) {
    content = highlighted.map((line, index) => (
      <Fragment key={index}>
        {index > 0 ? "\n" : null}
        <CodeTokens line={line} />
      </Fragment>
    ));
  } else {
    content = value;
  }

  const buttons = hasActions ? (
    <>
      {mask ? (
        <Button
          aria-label={revealed ? text.hide : text.reveal}
          onClick={() => setRevealedByPerson((current) => !current)}
          profile="field-action"
          shape="square"
          type="button"
        >
          <RevealIcon revealed={revealed} />
        </Button>
      ) : null}
      {/* The kit's copy action: its check after a copy, a cross for a
          moment when the clipboard is missing or refuses, its tooltip
          and the announcement of either. It copies the value, never the
          numbers or marks of the lines. */}
      {copyable ? (
        <CopyButton
          labels={{
            copied: text.copied,
            copy: text.copy,
            copyFailed: text.copyFailed,
          }}
          profile="field-action"
          shape="square"
          value={value}
          disabled={streaming}
        />
      ) : null}
    </>
  ) : null;

  // anywhere, not break-word: a long value also stops counting as one
  // unbreakable width, so it never widens the block's grid or flex parent
  // (rulebook K5). Code reads left to right in any page direction once it has
  // a language, a title or numbers.
  const code = (
    <code
      className={cn(
        "block whitespace-pre-wrap wrap-anywhere",
        structured && !perLine && insetClassName,
      )}
      dir={
        language !== undefined || hasTitle || lineNumbers || hasLineStates
          ? "ltr"
          : undefined
      }
      style={
        perLine && lineNumbers
          ? ({ "--sp-code-gutter": `${gutter}ch` } as CSSProperties)
          : undefined
      }
    >
      {content}
    </code>
  );

  // The pre has two children, the code (with the header above it when there
  // is a title) and the floating actions, as it always had.
  return (
    <pre
      className={cn(
        slotClass("code-block", props),
        codeBlockVariants({ size }),
        hasActions && !structured && (copyable && mask ? "pe-18" : "pe-11"),
        structured && "px-0",
        hasTitle && codeBlockTitledClassNames[sizeKey],
        className,
      )}
      data-language={language}
      data-slot="code-block"
      {...props}
    >
      {hasTitle ? (
        <>
          <span
            className={cn(
              slotClass("code-block-header"),
              codeBlockHeaderClassNames[sizeKey],
            )}
            data-slot="code-block-header"
          >
            <span
              className={slotClass("code-block-title")}
              data-slot="code-block-title"
              title={typeof title === "string" ? title : undefined}
            >
              {title}
            </span>
            {hasActions ? (
              <span
                className={slotClass("code-block-actions")}
                data-slot="code-block-actions"
              >
                {buttons}
              </span>
            ) : null}
          </span>
          {code}
        </>
      ) : (
        code
      )}
      {hasActions && !hasTitle ? (
        <span className={actionClassName}>{buttons}</span>
      ) : null}
    </pre>
  );
}
