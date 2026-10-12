"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { XIcon } from "lucide-react";
import { useEffect, useState, type ComponentProps } from "react";

import { cn } from "../../system/utils/cn";
import { CopyRedrawIcon, RevealIcon, useCopyIconPhase } from "../action-icons";
import { Button } from "../button";

const codeInlineClassName =
  "rounded-(--code-inline-radius) bg-muted px-1.5 py-0.5 font-mono [font-size:var(--code-inline-font-size)] text-foreground";
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
      className={cn(codeInlineClassName, className)}
      data-slot="code"
      {...props}
    />
  );
}

// How long the cross of a failed copy stays, in milliseconds.
const copyFailureHold = 2400;

const codeBlockVariants = cva(codeBlockBaseClassName, {
  defaultVariants: { size: "md" },
  variants: { size: codeBlockSizeClassNames },
});

export interface CodeBlockProps
  extends
    Omit<ComponentProps<"pre">, "children">,
    VariantProps<typeof codeBlockVariants> {
  value: string;
  copyable?: boolean;
  mask?: boolean;
}

export function CodeBlock({
  value,
  copyable = false,
  mask = false,
  size,
  className,
  ...props
}: CodeBlockProps) {
  const { copyPhase, isShowingCheck, playCopyFeedback } = useCopyIconPhase();
  // The person's reveal, which a change of `mask` takes back: a block that is
  // masked after it loaded is hidden again, not left in clear text.
  const [revealedByPerson, setRevealedByPerson] = useState(false);
  const [maskedBefore, setMaskedBefore] = useState(mask);
  if (maskedBefore !== mask) {
    setMaskedBefore(mask);
    setRevealedByPerson(false);
  }
  const revealed = !mask || revealedByPerson;
  // A clipboard that is missing or refuses shows a cross for a moment, like the
  // check of a copy that worked.
  const [copyFailed, setCopyFailed] = useState(false);
  useEffect(() => {
    if (!copyFailed) return;
    const timer = setTimeout(() => setCopyFailed(false), copyFailureHold);
    return () => clearTimeout(timer);
  }, [copyFailed]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopyFailed(false);
      playCopyFeedback();
    } catch {
      setCopyFailed(true);
    }
  }
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
            <span className="sr-only">Hidden value</span>
          </>
        ) : (
          value
        )}
      </code>
      {hasActions ? (
        <span className={actionClassName}>
          {mask ? (
            <Button
              aria-label={revealed ? "Hide value" : "Reveal value"}
              onClick={() => setRevealedByPerson((current) => !current)}
              profile="field-action"
              shape="square"
              type="button"
            >
              <RevealIcon revealed={revealed} />
            </Button>
          ) : null}
          {copyable ? (
            <Button
              aria-label={
                copyFailed
                  ? "Copy unavailable"
                  : isShowingCheck
                    ? "Copied to clipboard"
                    : "Copy to clipboard"
              }
              onClick={copy}
              profile="field-action"
              shape="square"
              type="button"
            >
              {copyFailed ? (
                <XIcon
                  aria-hidden="true"
                  className="siteplane-icon-pop size-4 text-destructive-foreground"
                />
              ) : (
                <CopyRedrawIcon phase={copyPhase} />
              )}
            </Button>
          ) : null}
          {/* The failure is announced without moving focus. */}
          {copyable ? (
            <span aria-live="polite" className="sr-only">
              {copyFailed ? "Copy unavailable" : ""}
            </span>
          ) : null}
        </span>
      ) : null}
    </pre>
  );
}
