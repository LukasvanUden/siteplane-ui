import { cva, type VariantProps } from "class-variance-authority";
import type React from "react";

import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
// A Server Component: the size reaches its parts through the root's
// `data-size` and custom properties, and only the actions' control size, the
// media's featured icon and the avatars a decoration counts read it in React,
// from client leaves (EmptyScope, EmptyMediaScope).
import { EmptyMediaScope, EmptyScope } from "./empty-scope";

import "./empty-state.css";

// The structure (Lukas, 2 November 2026): no
// space of its own around it (the host gives that), 20 px under the media, 8 px
// between the title and the description and 32 px before the actions at lg and
// md, 16, 4 and 24 px at sm; a title of 20, 18 and 16 px and a description of
// 16, 14 and 14 px by size, and an icon or an illustration that steps down with
// it. The sizes step down from lg, the default: Empty passes the values of its
// parts on as custom properties, which the parts read with lg's values as
// fallbacks, so a part keeps the lg look wherever no size sets them. The
// weights are the kit's role tokens.
const emptyVariants = cva(
  "flex w-full min-w-0 flex-1 flex-col items-center justify-center text-center",
  {
    defaultVariants: { size: "lg" },
    variants: {
      size: {
        lg: "gap-8",
        md: "gap-8 [--empty-description-line:var(--sp-rw-line-20)] [--empty-description-size:var(--sp-rw-font-14)] [--empty-icon-size:--spacing(5)] [--empty-illustration-gap:--spacing(3)] [--empty-illustration-height:--spacing(32)] [--empty-title-line:calc(var(--sp-rw-space)*7)] [--empty-title-size:var(--sp-rw-font-18)]",
        sm: "gap-6 [--empty-description-line:var(--sp-rw-line-20)] [--empty-description-size:var(--sp-rw-font-14)] [--empty-header-gap:--spacing(1)] [--empty-icon-size:--spacing(5)] [--empty-illustration-gap:--spacing(3)] [--empty-illustration-height:--spacing(30)] [--empty-title-line:var(--sp-rw-line-24)] [--empty-title-size:var(--sp-rw-font-16)]",
      },
    },
  },
);

// The icon is a bare glyph of the size, or a featured icon (FeaturedIcon),
// which brings its own box and glyph (the media gives a featured icon without a
// size the step of the Empty). The illustration fills the height of its size
// and keeps its proportions.
const emptyMediaVariants = cva(
  "flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    defaultVariants: { variant: "default" },
    variants: {
      variant: {
        default: "bg-transparent not-last:mb-3",
        icon: "text-muted-foreground not-last:mb-3 [&>svg:not([class*='size-'])]:size-[var(--empty-icon-size,--spacing(6))]",
        illustration:
          "h-[var(--empty-illustration-height,--spacing(40))] text-muted-foreground not-last:mb-[var(--empty-illustration-gap,--spacing(4))] *:h-full *:w-auto",
      },
    },
  },
);

export function Empty({
  children,
  className,
  size = "lg",
  ...props
}: React.ComponentProps<"div"> & {
  /**
   * The scale of the empty state: lg for a page or a large section, md for a
   * card or a table, sm for a compact surface such as a popover or a side
   * panel. A smaller size takes less space between the parts, a smaller title
   * and description, and a smaller icon or illustration; the Buttons and other
   * controls inside are md at lg and md, and sm at sm, relative to the
   * provider's control size. Empty adds no space around itself: the host gives
   * that. Default `lg`.
   */
  size?: "sm" | "md" | "lg" | undefined;
}): React.ReactElement {
  return (
    <div
      className={cn(
        slotClass("empty", props),
        emptyVariants({ size }),
        className,
      )}
      data-size={size}
      data-slot="empty"
      {...props}
    >
      <EmptyScope size={size}>{children}</EmptyScope>
    </div>
  );
}

export function EmptyHeader({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        slotClass("empty-header", props),
        "flex max-w-88 flex-col items-center gap-[var(--empty-header-gap,--spacing(2))] text-center",
        className,
      )}
      data-slot="empty-header"
      {...props}
    />
  );
}

/**
 * The media of an Empty: a bare icon, a featured icon or an illustration. A
 * FeaturedIcon inside it that names no `size` takes the step of the Empty: xl
 * (56 px) in an lg Empty, lg (48 px) in md and sm. A `size` on the icon wins.
 */
export function EmptyMedia({
  children,
  className,
  pattern = "none",
  patternSize = "md",
  variant = "default",
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof emptyMediaVariants> & {
    /**
     * A pattern drawn behind the media, centred on it: `circle`, concentric
     * rings that fade out towards their edge, as behind a featured icon. The
     * rings are decoration, hidden from
     * assistive technology, and take no space. `none` by default.
     */
    pattern?: "none" | "circle" | undefined;
    /**
     * How far the pattern reaches: `sm` 336 px, `md` 480 px or `lg` 768 px
     * across. `md` by default.
     */
    patternSize?: "sm" | "md" | "lg" | undefined;
  }): React.ReactElement {
  return (
    // The header's gap spaces the text; the media is set apart from it by 20
    // px, so it adds the other 12 px while something follows it (rulebook S2):
    // a header with only media adds no space below it. At sm the header's gap is
    // 4 px, so the media sits 16 px from the text. An illustration at lg sits
    // 24 px from it.
    <div
      className={cn(
        slotClass("empty-media", props),
        emptyMediaVariants({ variant }),
        className,
      )}
      data-slot="empty-media"
      data-variant={variant}
      {...props}
    >
      {pattern === "circle" ? (
        <span
          aria-hidden="true"
          className="sp-empty-pattern"
          data-pattern="circle"
          data-size={patternSize}
          data-slot="empty-pattern"
        />
      ) : null}
      <EmptyMediaScope>{children}</EmptyMediaScope>
    </div>
  );
}

export function EmptyTitle({
  className,
  level,
  ...props
}: React.ComponentProps<"div"> & {
  /**
   * The heading level, 1 to 6, so the title takes its place in the page
   * outline as `h1` to `h6`. Without it the title is a div. The look stays the
   * same at every level.
   */
  level?: 1 | 2 | 3 | 4 | 5 | 6 | undefined;
}): React.ReactElement {
  // A heading takes the same attributes as the div; only the element type
  // names a different interface, so the props are passed on as they are.
  const Title = (level ? `h${level}` : "div") as "div";
  return (
    <Title
      className={cn(
        slotClass("empty-title", props),
        "font-(--sp-rw-font-weight-label) text-[length:var(--empty-title-size,var(--sp-rw-font-20))] leading-[var(--empty-title-line,var(--sp-rw-line-30))] wrap-anywhere",
        className,
      )}
      data-slot="empty-title"
      {...props}
    />
  );
}

/**
 * The text under the title. A link in it is the link Button of a sentence:
 * `<Button variant="link" profile="inline" render={<a href="…" />}>`, which
 * takes the sentence's type and the accent text colour and underlines on hover
 * like every link.
 */
export function EmptyDescription({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        slotClass("empty-description", props),
        "text-[length:var(--empty-description-size,var(--sp-rw-font-16))] leading-[var(--empty-description-line,var(--sp-rw-line-24))] text-muted-foreground wrap-anywhere",
        className,
      )}
      data-slot="empty-description"
      {...props}
    />
  );
}

export function EmptyContent({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        slotClass("empty-content", props),
        "flex w-full min-w-0 flex-wrap items-center justify-center gap-3 text-sm",
        className,
      )}
      data-slot="empty-content"
      {...props}
    />
  );
}
