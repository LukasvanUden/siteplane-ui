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
import "./badge.css";

export const badgeVariants = cva(
  "shrink-0 items-center justify-center whitespace-nowrap disabled:opacity-(--sp-rw-disabled-opacity-action) [&_svg]:pointer-events-none [&_svg]:shrink-0 [button&,a&]:cursor-pointer [button&,a&]:pointer-coarse:after:absolute [button&,a&]:pointer-coarse:after:size-full [button&,a&]:pointer-coarse:after:min-h-11 [button&,a&]:pointer-coarse:after:min-w-11",
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

export type BadgeProfile = "count" | "entitlement" | "verified";

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
  profile?: BadgeProfile;
  /**
   * `default` is a white surface with a hairline contour and `outline` keeps
   * only the contour. `accent`, `inverse` and `destructive` are solid fills,
   * like the Button variants of those names; `info`, `success`, `warning` and
   * `error` tint with a status color. A `count` badge is `inverse` and an
   * `entitlement` badge is `info` unless a variant is set. `brand` is the
   * deprecated earlier name of `accent`.
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
  const label = React.Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? (
      <span data-slot="badge-label">{child}</span>
    ) : (
      child
    ),
  );
  const defaultProps = {
    // The light lives inside the badge, so className and style place a lit
    // badge exactly like any other.
    children: light ? (
      <>
        <span
          aria-hidden="true"
          className="siteplane-badge-light-halo"
          data-slot="badge-light-halo"
        />
        <span
          aria-hidden="true"
          className="siteplane-badge-light-ring"
          data-slot="badge-light-ring"
        />
        {label}
      </>
    ) : (
      label
    ),
    className: cn(
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
