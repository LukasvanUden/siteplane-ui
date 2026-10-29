"use client";

import * as React from "react";
import {
  FileIcon,
  defaultStyles,
  type FileIconProps,
  type IconType,
} from "react-file-icon";
import { cn } from "../../system/utils/cn";

/** The heights of the icon box in px; the width follows (see `boxClassNames`). */
export type FileTypeIconSize = 16 | 20 | 24 | 32 | 40;

export type FileTypeIconProps = {
  /** The file name used to identify the extension. Render its accessible name alongside the icon. */
  name: string;
  /** Optional extension override, for files without a suffix. */
  extension?: string | undefined;
  /**
   * The height of the box in px: 16, 20, 24, 32 or 40 (the default). The width
   * keeps the sheet's 34:40 proportion, rounded to whole pixels, and the sheet,
   * glyph and label scale with the box.
   */
  size?: FileTypeIconSize | undefined;
  className?: string | undefined;
};

// One box per size: the height, and the width at the 34:40 proportion of the
// sheet (13.6, 17, 20.4, 27.2 and 34 px) rounded to whole pixels. The classes
// are written out so the stylesheet generator finds them. The 40 px box is the
// one the icon always had.
const boxClassNames: Record<FileTypeIconSize, string> = {
  16: "h-4 w-[14px]",
  20: "h-5 w-[17px]",
  24: "h-6 w-5",
  32: "h-8 w-[27px]",
  40: "h-10 w-[34px]",
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

/**
 * react-file-icon 1.6.0 gives the page group of every icon the same
 * `id="file"`, so a page with two icons repeats an id, in the server HTML as
 * well. Nothing refers to that id, and the library's other ids are unique per
 * icon, so the kit renders the library's tree without it.
 */
function FileIconWithoutFixedId(props: FileIconProps): React.ReactElement {
  // The library's component is a plain function: called here, its useId runs
  // as part of this component, in the same order on every render.
  const icon = FileIcon(props) as React.ReactElement<{
    children?: React.ReactNode;
  }>;

  return React.cloneElement(
    icon,
    undefined,
    React.Children.map(icon.props.children, (child) =>
      React.isValidElement<{ id?: string | undefined }>(child) &&
      child.props.id === "file"
        ? React.cloneElement(child, { id: undefined })
        : child,
    ),
  );
}

/** Decorative SVG file icon; the complete glyph and label scale together. */
export function FileTypeIcon({
  name,
  extension,
  size = 40,
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
        "sp-file-type-icon",
        "inline-flex",
        boxClassNames[size],
        "shrink-0 items-center justify-center [&>svg]:block [&>svg]:h-full [&>svg]:w-full [&>svg]:opacity-100",
        className,
      )}
    >
      <FileIconWithoutFixedId
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
