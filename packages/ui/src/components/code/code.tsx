"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { useState, type ComponentProps } from "react";

import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { RevealIcon } from "../action-icons";
import { Button } from "../button";
import { CopyButton } from "../copy-button";

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

export interface CodeBlockProps
  extends
    Omit<ComponentProps<"pre">, "children">,
    VariantProps<typeof codeBlockVariants> {
  value: string;
  copyable?: boolean;
  /** Replaces the English names of the hidden value and the actions. */
  labels?: Partial<CodeBlockLabels> | undefined;
  mask?: boolean;
}

export function CodeBlock({
  value,
  copyable = false,
  labels,
  mask = false,
  size,
  className,
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
  // the end edge; the code text stops just before them.
  const isSmall = size === "sm";
  const actionClassName = cn(
    "absolute flex gap-1",
    isSmall ? "end-1" : "end-2",
    mask ? "top-1/2 -translate-y-1/2" : isSmall ? "top-1" : "top-2",
  );
  return (
    <pre
      className={cn(
        slotClass("code-block", props),
        codeBlockVariants({ size }),
        hasActions && (copyable && mask ? "pe-18" : "pe-11"),
        className,
      )}
      data-slot="code-block"
      {...props}
    >
      {/* anywhere, not break-word: a long value also stops counting as one
          unbreakable width, so it never widens the block's grid or flex
          parent (rulebook K5). */}
      <code className="block whitespace-pre-wrap wrap-anywhere">
        {masked ? (
          <>
            {/* The bullets only show that a value is hidden; a screen reader
                hears one short text instead of dozens of "bullet". */}
            <span aria-hidden="true">
              {"•".repeat(Math.min(value.length, 44))}
            </span>
            <span className="sr-only">{text.hidden}</span>
          </>
        ) : (
          value
        )}
      </code>
      {hasActions ? (
        <span className={actionClassName}>
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
              and the announcement of either. */}
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
            />
          ) : null}
        </span>
      ) : null}
    </pre>
  );
}
