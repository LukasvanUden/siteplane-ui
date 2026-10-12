"use client";

import type * as React from "react";
import { FileIcon, defaultStyles, type IconType } from "react-file-icon";
import { cn } from "../../system/utils/cn";

export type FileTypeIconProps = {
  /** The file name used to identify the extension. Render its accessible name alongside the icon. */
  name: string;
  /** Optional extension override, for files without a suffix. */
  extension?: string | undefined;
  className?: string | undefined;
};

type FileTypeIconTone = "error" | "success" | "warning" | "accent" | "neutral";

// The label takes the kit's solid status and brand fills, the fills of the
// destructive and accent Badge, with white text, so a brand override reaches
// it: PDFs red, sheets green, slides and archives orange, documents and media
// the accent, code and unknown files neutral.
const tones: Partial<Record<IconType, FileTypeIconTone>> = {
  acrobat: "error",
  document: "accent",
  spreadsheet: "success",
  presentation: "warning",
  image: "accent",
  vector: "accent",
  video: "accent",
  audio: "accent",
  compressed: "warning",
  code: "neutral",
  code2: "neutral",
};

const labelColors: Record<FileTypeIconTone, string> = {
  error: "var(--sp-rw-bg-destructive)",
  success: "var(--sp-rw-bg-positive)",
  warning: "var(--sp-rw-bg-attention)",
  accent: "var(--sp-rw-bg-accent)",
  neutral: "var(--sp-rw-fg-tertiary)",
};

/** Decorative SVG file icon; the complete glyph and label scale together. */
export function FileTypeIcon({
  name,
  extension,
  className,
}: FileTypeIconProps): React.ReactElement {
  const basename = name.split(/[\\/]/).pop() ?? name;
  const suffix = (
    extension ??
    (basename.lastIndexOf(".") > 0 ? basename.split(".").pop() : "") ??
    ""
  )
    .replace(/^\./, "")
    .toLowerCase();
  const preset = Object.hasOwn(defaultStyles, suffix)
    ? defaultStyles[suffix as keyof typeof defaultStyles]
    : undefined;
  const type =
    preset?.type ??
    (/^(tsx|vue|svelte|yaml)$/.test(suffix)
      ? "code"
      : suffix === "zip" || suffix === "7z"
        ? "compressed"
        : "document");
  const tone: FileTypeIconTone =
    preset || /^(tsx|vue|svelte|yaml|7z)$/.test(suffix)
      ? (tones[type] ?? "neutral")
      : "neutral";
  return (
    <span
      aria-hidden="true"
      data-slot="file-type-icon"
      data-extension={suffix || undefined}
      data-tone={tone}
      className={cn(
        "inline-flex h-10 w-[34px] shrink-0 items-center justify-center [&>svg]:block [&>svg]:h-full [&>svg]:w-full [&>svg]:opacity-100",
        className,
      )}
    >
      <FileIcon
        type={type}
        extension={
          suffix.length <= 5 && /^[a-z0-9]+$/.test(suffix)
            ? suffix.toUpperCase()
            : "FILE"
        }
        color="var(--sp-semantic-color-muted)"
        foldColor="var(--sp-semantic-color-border)"
        glyphColor="var(--sp-semantic-color-muted-foreground)"
        labelColor={labelColors[tone]}
        labelTextColor="var(--sp-rw-fg-emphasis)"
        gradientOpacity={0}
        radius={3}
      />
    </span>
  );
}
