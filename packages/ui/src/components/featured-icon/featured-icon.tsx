"use client";

import * as React from "react";

import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";

import "./featured-icon.css";

/**
 * The color of a featured icon: the kit's status values, `accent` and
 * `neutral`.
 */
export type FeaturedIconTone =
  "neutral" | "accent" | "error" | "warning" | "success";

/**
 * How the glyph is set. `outline` is the bare glyph whose two rings exist
 * only as the pulse (rulebook I6), the lead of a Notification. `light` is a
 * circle in the tone's tint. `gradient` is a disc in the tone's solid fill
 * inside a halo of its tint that fades out downward. `dark` is a square in the
 * solid fill. `modern` is a square with the raised surface of the default
 * Button and the glyph in the tone's text color. `modern-neue` is a square
 * that holds a raised tile 4 px inside its edge.
 */
export type FeaturedIconVariant =
  "dark" | "gradient" | "light" | "modern" | "modern-neue" | "outline";

/**
 * The sizes: sm, md, lg and xl are 32, 40, 48 and 56 px with a 16,
 * 20, 24 and 28 px glyph. Without a size the icon is 36 px with an 18 px
 * glyph, the lead column of a Notification (rulebook I6, I9), unless a surface
 * around it sets the size of its featured icons (FeaturedIconSizeScope).
 */
export type FeaturedIconSize = "sm" | "md" | "lg" | "xl";

const FeaturedIconSizeContext = React.createContext<
  FeaturedIconSize | undefined
>(undefined);

/**
 * Sets the size of the featured icons inside it that name none. A surface that
 * steps its featured icon with its own scale wraps its media in it, as Empty
 * does: xl in an lg Empty, lg in md and sm. A `size` of the icon itself wins.
 * Context only: it draws nothing.
 */
export function FeaturedIconSizeScope({
  children,
  size,
}: {
  children: React.ReactNode;
  size: FeaturedIconSize | undefined;
}): React.ReactElement {
  return (
    <FeaturedIconSizeContext.Provider value={size}>
      {children}
    </FeaturedIconSizeContext.Provider>
  );
}

export type FeaturedIconProps = Omit<
  React.ComponentProps<"span">,
  "children"
> & {
  /** The glyph, such as an icon component's svg, sized by the icon. */
  children?: React.ReactNode;
  /**
   * Whether the rings of an `outline` icon pulse: they keep traveling outward
   * from the glyph as they fade. On by default. The rings exist only as the
   * pulse, so `false` and reduced motion show the glyph alone. The other
   * variants have no rings.
   */
  pulse?: boolean | undefined;
  /**
   * sm, md, lg or xl; without one, 36 px with an 18 px glyph, or the size that
   * the surface around the icon sets for its featured icons, as Empty does.
   */
  size?: FeaturedIconSize | undefined;
  /** The color, `neutral` by default. */
  tone?: FeaturedIconTone | undefined;
  /** How the glyph is set; `outline` by default. */
  variant?: FeaturedIconVariant | undefined;
};

/**
 * A glyph set in a box to lead a message, a dialog or an empty state. The
 * box, the glyph and every variant's fill and edges belong to
 * featured-icon.css, which takes them from the kit's tokens: the status tints
 * and fills that the Badge and the solid Button use, and the raised surface
 * of the default Button. The icon is decoration and hidden from assistive
 * technology; the text beside it says what it means.
 *
 * The `outline` icon, the default, pulses for as long as it is shown: two
 * rings keep traveling outward from the glyph as they fade, a new ring every
 * 2 s. They are drawn around the box without taking layout space, so text
 * beside it keeps its column. There is no still ring: with `pulse={false}`,
 * with reduced motion and after the last wave of a limited pulse, the glyph
 * stands alone in its box.
 */
export function FeaturedIcon({
  children,
  className,
  pulse = true,
  size,
  tone = "neutral",
  variant = "outline",
  ...props
}: FeaturedIconProps): React.ReactElement {
  const scopedSize = React.useContext(FeaturedIconSizeContext);
  return (
    <span
      aria-hidden="true"
      data-slot="featured-icon"
      data-tone={tone}
      data-variant={variant}
      data-size={size ?? scopedSize}
      data-pulse={variant === "outline" && pulse ? "" : undefined}
      {...props}
      className={cn(slotClass("featured-icon", props), className)}
    >
      {children}
    </span>
  );
}
