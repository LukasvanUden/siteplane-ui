"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import {
  siteplaneUIDefaults,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import { useSiteplaneMessages } from "../../system/locale/messages-context";
import { cn } from "../../system/utils/cn";
import { baseClass, slotClass } from "../../system/utils/slot-class";
import { wrapTextRuns } from "../../system/utils/text-runs";
import { CloseGlyph, KitButton } from "../button/button-internal";
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
        default: "",
        destructive: "",
        error: "",
        info: "",
        inverse: "",
        outline: "",
        secondary: "",
        success: "",
        warning: "",
        // The colour tints beside the status ones.
        blue: "",
        indigo: "",
        orange: "",
        pink: "",
        purple: "",
        sky: "",
        slate: "",
      },
    },
  },
);

export type BadgeProfile = "count" | "entitlement" | "status" | "verified";

// Counts never truncate (design-rework.css), so their label carries no title.
const countProfiles: ReadonlySet<string> = new Set([
  "count",
  "group-overflow-count",
  "tag-count",
]);

/**
 * The text of a badge is one label: every run of text children, such as
 * `{count} new`, becomes one label span. The label stays on one line and ends
 * with an ellipsis where the badge meets the edge of its space (rulebook K5);
 * its title carries the full text. Icons and other elements stay children of
 * the badge, which lays them out. `text` is the text of the labels, which
 * names the remove button.
 */
function badgeLabels(
  children: React.ReactNode,
  titled: boolean,
): { labels: React.ReactNode[]; text: string } {
  const texts: string[] = [];
  const labels = wrapTextRuns(children, (text, index) => {
    texts.push(text.trim());
    return (
      <span
        className="sp-badge-label"
        data-slot="badge-label"
        key={`badge-label-${index}`}
        title={titled ? text.trim() : undefined}
      >
        {text}
      </span>
    );
  });
  return { labels, text: texts.filter(Boolean).join(" ") };
}

/**
 * The dot of a badge: 8 px in a 10 px box, in the tone of the badge's variant
 * (success, warning, error, info, the colour of a colour tint, and grey; the
 * text colour on a solid fill), or of its own `variant`, such as a green dot in
 * a Tag.
 * It is a mark like an icon or an avatar, so it can lead the label of any
 * variant, of a Tag and of a Combobox chip. It is decoration, hidden from
 * assistive technology; the words carry the state. The status profile renders
 * it before its words.
 */
export function BadgeDot({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & {
  /**
   * The tone of this dot, when it is not the badge's: `success`, `warning`,
   * `error` or `destructive`, and `info` or `accent`, as the status profile
   * names them, or a colour: `slate`, `sky`, `blue`, `indigo`, `purple`,
   * `pink` or `orange`. Grey for the others.
   */
  variant?: BadgeVariant | undefined;
}): React.ReactElement {
  return (
    <span
      aria-hidden="true"
      className={cn(slotClass("badge-dot", props), className)}
      data-slot="badge-dot"
      data-variant={variant}
      {...props}
    />
  );
}

export interface BadgeIconProps extends Omit<
  React.SVGProps<SVGSVGElement>,
  "children" | "ref"
> {
  /** The icon, one element such as a Phosphor icon. */
  children: React.ReactElement;
  /**
   * The tone of this icon, when it is not the badge's, by the same names as
   * BadgeDot's `variant`.
   */
  variant?: BadgeVariant | undefined;
}

/**
 * An icon in the tone of the badge's dot: the colour of the badge's variant,
 * or of its own `variant`, at full strength. It is how a white badge (the
 * default variant) carries a colour in its icon alone, such as a green arrow
 * before a figure. The icon stays the badge's own mark, sized and placed like
 * any icon of a badge; a plain icon keeps 80 % of the badge's text colour. It
 * is decoration, hidden from assistive technology.
 */
export function BadgeIcon({
  children,
  className,
  variant,
  ...props
}: BadgeIconProps): React.ReactElement {
  return useRender({
    defaultTagName: "svg",
    props: mergeProps<"svg">(
      {
        "aria-hidden": true,
        className: cn(slotClass("badge-icon", props, children), className),
        "data-slot": "badge-icon",
        "data-variant": variant,
      } as React.ComponentProps<"svg">,
      props as React.ComponentProps<"svg">,
    ),
    render: children,
  });
}

export type BadgeVariant = NonNullable<
  VariantProps<typeof badgeVariants>["variant"]
>;

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
   * `error` tint with a status color, and `slate`, `sky`, `blue`, `indigo`,
   * `purple`, `pink` and `orange` with a color of their own, each with its text
   * color, its dot (BadgeDot) and its colored icon (BadgeIcon). A `count`
   * badge is `inverse` and an `entitlement` badge is `info` unless a variant
   * is set. A `status` badge keeps no fill: its variant gives the dot's tone,
   * `success`, `warning`, `error` (or `destructive`), `info` (or `accent`) or
   * a color, and gray for the others.
   */
  variant?: BadgeVariant | null | undefined;
  size?: VariantProps<typeof badgeVariants>["size"];
  /**
   * `pill` rounds the badge fully at every size and gives it 2 px more at each
   * side; the size keeps its height, and the variant keeps its styling.
   * `default` takes the theme's badge radius, `--sp-rw-radius-badge`, and
   * otherwise the corner of its size.
   */
  shape?: "default" | "pill";
  /**
   * Runs two soft lights, the brand accent and the amber highlight, around
   * the badge's edge, for the one announcement on a page. Use it on an opaque
   * badge such as `default`; reduced motion keeps the lights still.
   */
  light?: boolean;
  /**
   * Adds a remove button after the label and calls this when it is pressed.
   * The button is the kit's chip remove action, the one a Tag and a Combobox
   * chip show: 16 px with a 12 px cross (20 px with 14 px at `xl`), in the
   * badge's text color. The badge itself stays a span, so do not combine it
   * with a `render` that makes the badge a link or a button.
   */
  onRemove?: (() => void) | undefined;
  /**
   * The whole accessible name of the remove button, such as "Delete Design".
   * Without it the button is named by the `chip.remove` message with the
   * badge's label, "Remove Design" in English, as a Tag's and a Combobox
   * chip's are.
   */
  removeLabel?: string | undefined;
}

export function Badge({
  className,
  profile,
  variant,
  size,
  shape = "default",
  light = false,
  onRemove,
  removeLabel,
  render,
  children,
  ...props
}: BadgeProps): React.ReactElement {
  const messages = useSiteplaneMessages("chip");
  const resolvedSize = useResolvedControlSize(size);
  const resolvedVariant: BadgeVariant =
    variant ??
    (profile === "count"
      ? "inverse"
      : profile === "entitlement"
        ? "info"
        : "default");
  // A badge stays on one line: its text is a label that ends with an ellipsis
  // when the badge would be wider than the space it sits in (rulebook K5), so
  // a long value never pushes a row apart. The badge-label rule in
  // design-rework.css owns that; icons beside the label keep their size.
  const { labels: label, text } = badgeLabels(
    children,
    !countProfiles.has(profile ?? ""),
  );
  // The status dot comes from the badge; the words carry the state, so the
  // dot is hidden from assistive technology.
  const dot = profile === "status" ? <BadgeDot /> : null;
  // The remove action is the chip remove action of every chip, a Tag's and a
  // Combobox chip's: the chip-remove profile owns its glyph, size, colors and
  // corner, and the badge names only the size of its cross (badge.css). It
  // follows the label, which still ends with an ellipsis before it. It is
  // named as theirs are, by the chip.remove message with the label, such as
  // "Remove Design", so each one in a row of badges is distinct, and a
  // translation sets its own word order. A removeLabel is the whole name.
  const remove = onRemove ? (
    <KitButton
      aria-label={removeLabel ?? messages.remove(text)}
      data-slot="badge-remove"
      onClick={() => onRemove()}
      profile="chip-remove"
      size="icon-2xs"
      variant="ghost"
    >
      <CloseGlyph />
    </KitButton>
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
        {remove}
      </>
    ) : (
      <>
        {dot}
        {label}
        {remove}
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
    "data-removable": remove ? "" : undefined,
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
