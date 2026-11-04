"use client";

import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import * as React from "react";

import { Badge, BadgeDot, type BadgeProps, type BadgeVariant } from "../badge";

import "./badge-group.css";

/**
 * The tint of the group, by the Badge variant that draws it: `secondary` is
 * the neutral one (gray), `info` the accent tint (the brand),
 * `success`, `warning` and `error` the status tints, and `slate`, `sky`,
 * `blue`, `indigo`, `purple`, `pink` and `orange` the colour tints. In the
 * modern appearance it names the colour of the dot.
 */
export type BadgeGroupVariant = Extract<
  BadgeVariant,
  | "secondary"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "slate"
  | "sky"
  | "blue"
  | "indigo"
  | "purple"
  | "pink"
  | "orange"
>;

/**
 * `light` tints the whole pill and sets the addon on it as a white pill of its
 * own. `modern` is a white, hairline group whose addon is a white badge with a
 * dot in the variant's colour.
 */
export type BadgeGroupAppearance = "light" | "modern";

/**
 * `md` is a 30 px group with 12 px type around a 22 px addon, `lg` a 32 px
 * group with 14 px type around a 24 px addon. The addon
 * is the Badge at `sm` and `md`.
 */
export type BadgeGroupSize = "md" | "lg";

/** Where the addon stands: before the message, or after it. */
export type BadgeGroupAddonPosition = "start" | "end";

export interface BadgeGroupProps extends Omit<
  BadgeProps,
  | "light"
  | "onRemove"
  | "profile"
  | "removeLabel"
  | "shape"
  | "size"
  | "variant"
> {
  /**
   * The small badge that joins the message, such as "New" or "Error". It is a
   * Badge of its own, so text and an icon lay out as in any Badge.
   */
  addon: React.ReactNode;
  /**
   * `start`, the default, puts the addon before the message and the icon after
   * it; `end` puts the message first and the addon, with the icon inside it, at
   * the end of the group.
   */
  addonPosition?: BadgeGroupAddonPosition | undefined;
  /** `light`, the default, or `modern`. */
  appearance?: BadgeGroupAppearance | undefined;
  /**
   * Makes the group a link to this address: it shows the pointer, a hover and
   * a pressed tint in its own colour and the keyboard focus ring, in every
   * appearance and colour. For a router's link component or a button, pass
   * `render` instead. Without either the group is static and has no hover.
   */
  href?: string | undefined;
  /**
   * The message is the children, one line that ends with an ellipsis where the
   * group is full.
   */
  children?: React.ReactNode;
  /**
   * The icon after the message, or inside the addon when it stands at the end:
   * an arrow by default. Pass `null` for none. Decoration, so give it
   * `aria-hidden`.
   */
  icon?: React.ReactNode;
  /** `md`, the default, or `lg`. */
  size?: BadgeGroupSize | undefined;
  /** The tint, `info` by default. */
  variant?: BadgeGroupVariant | undefined;
}

/** Whether a node has anything to show, so its gap and its margin stay out. */
function hasContent(node: React.ReactNode): boolean {
  return !(
    node === undefined ||
    node === null ||
    node === false ||
    node === ""
  );
}

/**
 * One pill that joins a small badge, the addon, and a message: a release note,
 * a warning or an announcement above a heading, with an arrow that says it
 * goes somewhere. It is a Badge, so the tint, the pill geometry and the
 * behaviour of a link or a button (`href`, or `render`: the pointer, the
 * hover and pressed tints and the focus ring) are the Badge's; the addon is a
 * Badge inside it. The group is static unless `href` or `render` makes it a
 * link or a button.
 */
export function BadgeGroup({
  addon,
  addonPosition = "start",
  appearance = "light",
  children,
  className,
  href,
  icon,
  render,
  size = "md",
  variant = "info",
  ...props
}: BadgeGroupProps): React.ReactElement {
  const modern = appearance === "modern";
  const end = addonPosition === "end";
  const iconNode =
    icon === undefined ? <ArrowRightIcon aria-hidden="true" /> : icon;
  const hasMessage = hasContent(children);
  const hasIcon = hasContent(iconNode);
  // The dot of the modern appearance leads the addon, or the group when the
  // addon stands at the end.
  const dot = modern ? <BadgeDot variant={variant} /> : null;
  const addonBadge = (
    <Badge
      data-slot="badge-group-addon"
      shape={modern ? "default" : "pill"}
      size={size === "lg" ? "md" : "sm"}
      variant="default"
    >
      {end ? null : dot}
      {addon}
      {end ? iconNode : null}
    </Badge>
  );

  return (
    <Badge
      className={className}
      data-addon-position={addonPosition}
      data-appearance={appearance}
      data-icon={!end && hasIcon ? "" : undefined}
      data-message={hasMessage ? "" : undefined}
      data-slot="badge-group"
      render={render ?? (href === undefined ? undefined : <a href={href} />)}
      shape={modern ? "default" : "pill"}
      size={size}
      variant={modern ? "default" : variant}
      {...props}
    >
      {/* Three children, not a fragment: the Badge makes the text among its
          own children the label that ends with an ellipsis, and does not look
          inside a fragment. */}
      {end ? dot : addonBadge}
      {children}
      {end ? addonBadge : iconNode}
    </Badge>
  );
}
