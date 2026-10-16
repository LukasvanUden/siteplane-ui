"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import {
  siteplaneUIDefaults,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import { cn } from "../../system/utils/cn";
import { baseClass, slotClass } from "../../system/utils/slot-class";
import { wrapTextRuns } from "../../system/utils/text-runs";
import "./badge.css";

// The badge sets no white-space of its own: its label wraps the way the text
// around the badge does (design-rework.css, the badge-label rule).
export const badgeVariants = cva(
  "shrink-0 items-center justify-center disabled:opacity-(--sp-rw-disabled-opacity-action) [&_svg]:pointer-events-none [&_svg]:shrink-0 [button&,a&]:cursor-pointer [button&,a&]:pointer-coarse:after:absolute [button&,a&]:pointer-coarse:after:size-full [button&,a&]:pointer-coarse:after:min-h-11 [button&,a&]:pointer-coarse:after:min-w-11",
  {
    defaultVariants: {
      size: siteplaneUIDefaults.controlSize,
      variant: "default",
    },
    variants: {
      size: {
        md: "",
        lg: "",
        sm: "",
        xl: "",
      },
      // The variant colors, the link and button hover tint and the focus
      // ring all come from the kit rules in design-rework.css, so no variant
      // adds a class of its own.
      variant: {
        accent: "",
        // Deprecated: the earlier name of accent.
        brand: "",
        default: "",
        destructive: "",
        error: "",
        info: "",
        inverse: "",
        outline: "",
        secondary: "",
        success: "",
        warning: "",
      },
    },
  },
);

export type BadgeProfile = "count" | "entitlement" | "status" | "verified";

// Counts never truncate (design-rework.css), so their label carries no title.
const countProfiles: ReadonlySet<string> = new Set([
  "count",
  "group-overflow-count",
]);

/**
 * The text of a badge is one label: every run of text children, such as
 * `{count} new`, becomes one label span. The label stays on one line and ends
 * with an ellipsis where the badge meets the edge of its space (rulebook K5);
 * its title carries the full text. Icons and other elements stay children of
 * the badge, which lays them out.
 */
function badgeLabels(
  children: React.ReactNode,
  titled: boolean,
): React.ReactNode[] {
  return wrapTextRuns(children, (text, index) => (
    <span
      className="sp-badge-label"
      data-slot="badge-label"
      key={`badge-label-${index}`}
      title={titled ? text.trim() : undefined}
    >
      {text}
    </span>
  ));
}

export type BadgeVariant = Exclude<
  NonNullable<VariantProps<typeof badgeVariants>["variant"]>,
  BadgeDeprecatedVariant
>;
/**
 * @deprecated `brand` is the earlier name of `accent`, the kit's brand value;
 * it renders `accent`.
 */
export type BadgeDeprecatedVariant = "brand";

export interface BadgeProps extends useRender.ComponentProps<"span"> {
  /**
   * A form of the badge. `count` is a compact count that grows as a pill and
   * never truncates; `entitlement` labels a plan with its icon; `status` is a
   * state in words after a colored dot, without fill or contour, with the dot
   * in the tone of the variant; `verified` is the check circle on an avatar.
   */
  profile?: BadgeProfile;
  /**
   * `default` is a white surface with a hairline contour and `outline` keeps
   * only the contour. `secondary` is a light, translucent neutral fill that
   * reads on a white card, on a tinted row and in Dark.
   * `accent`, `inverse` and `destructive` are solid fills,
   * like the Button variants of those names; `info`, `success`, `warning` and
   * `error` tint with a status color. A `count` badge is `inverse` and an
   * `entitlement` badge is `info` unless a variant is set. A `status` badge
   * keeps no fill: its variant gives the dot's tone, `success`, `warning`,
   * `error` (or `destructive`) and `info` (or `accent`), and gray for the
   * others. `brand` is the deprecated earlier name of `accent`.
   */
  variant?: BadgeVariant | BadgeDeprecatedVariant | null | undefined;
  size?: VariantProps<typeof badgeVariants>["size"];
  /**
   * `pill` rounds the badge fully at every size; the size keeps its height
   * and padding, and the variant keeps its styling. `default` takes the
   * theme's badge radius, `--sp-rw-radius-badge`.
   */
  shape?: "default" | "pill";
  /**
   * Runs two soft lights, the brand accent and the amber highlight, around
   * the badge's edge, for the one announcement on a page. Use it on an opaque
   * badge such as `default`; reduced motion keeps the lights still.
   */
  light?: boolean;
}

export function Badge({
  className,
  profile,
  variant,
  size,
  shape = "default",
  light = false,
  render,
  children,
  ...props
}: BadgeProps): React.ReactElement {
  const resolvedSize = useResolvedControlSize(size);
  const resolvedVariant: BadgeVariant =
    variant === "brand"
      ? "accent"
      : (variant ??
        (profile === "count"
          ? "inverse"
          : profile === "entitlement"
            ? "info"
            : "default"));
  // A badge stays on one line: its text is a label that ends with an ellipsis
  // when the badge would be wider than the space it sits in (rulebook K5), so
  // a long value never pushes a row apart. The badge-label rule in
  // design-rework.css owns that; icons beside the label keep their size.
  const label = badgeLabels(children, !countProfiles.has(profile ?? ""));
  // The status dot comes from the badge; the words carry the state, so the
  // dot is hidden from assistive technology.
  const dot =
    profile === "status" ? (
      <span aria-hidden="true" className="sp-badge-dot" data-slot="badge-dot" />
    ) : null;
  const defaultProps = {
    // The light lives inside the badge, so className and style place a lit
    // badge exactly like any other.
    children: light ? (
      <>
        <span
          aria-hidden="true"
          className="sp-badge-light-halo"
          data-slot="badge-light-halo"
        />
        <span
          aria-hidden="true"
          className="sp-badge-light-ring"
          data-slot="badge-light-ring"
        />
        {dot}
        {label}
      </>
    ) : (
      <>
        {dot}
        {label}
      </>
    ),
    className: cn(
      slotClass("badge", props, render),
      baseClass("badge", props, render),
      badgeVariants({ size: resolvedSize, variant: resolvedVariant }),
      className,
    ),
    "data-foundation": "badge",
    "data-light": light ? "" : undefined,
    "data-profile": profile,
    "data-shape": shape,
    "data-size": resolvedSize,
    "data-slot": "badge",
    "data-variant": resolvedVariant,
  };

  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(defaultProps, props),
    render,
  });
}
