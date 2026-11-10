"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { observeTruncation } from "../../system/hooks/use-truncated";
import {
  siteplaneUIDefaults,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import { surfaceClassNames } from "../../system/styles/surface";
import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { wrapTextRuns } from "../../system/utils/text-runs";
import { Spinner } from "../spinner";
import type {
  KitButtonProfile,
  KitButtonProfileMode,
  KitButtonProfileTone,
} from "./button-internal";

import "./button.css";

export const buttonVariants = cva(
  "pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    defaultVariants: {
      size: siteplaneUIDefaults.controlSize,
      variant: "default",
    },
    variants: {
      // The icon and label of each size come from the control scale in
      // design-rework.css (--sp-rw-button-icon and the size's text); the
      // ::before layer takes the chassis radius at every size. `close-xs` is
      // the CloseButton's own 28 px step (design-rework.css, close profile),
      // not a size of the public Button.
      size: {
        md: "",
        "icon-md": "",
        "icon-lg": "",
        "icon-sm": "",
        "icon-xl": "",
        "icon-xs": "",
        "icon-2xs": "",
        "close-xs": "",
        lg: "",
        sm: "",
        xl: "",
        xs: "",
      },
      // Every variant's look is design-rework.css's: its chassis and skin, the
      // spinner of a loading Button in the text colour (currentColor), and the
      // link's underline and its press dim (the link block there). Lukas, 30
      // October 2026; the text variant was the link and is
      // gone (31 October 2026).
      variant: {
        default: "",
        accent: "",
        destructive: "",
        "frosted-accent": "backdrop-blur-md",
        // The shared glass surface draws the fill, edge, shadow, sheen, blur
        // and text colour; the Button keeps its geometry, focus and
        // interaction layer.
        glass: "",
        // The white destructive Button: the default Button with the
        // destructive text, rim and tint (Lukas, 30 October 2026).
        "default-destructive": "",
        "ghost-destructive": "",
        inverse: "",
        "outline-destructive": "",
        ghost: "",
        link: "",
        // The link in the text colour of its skin, as the default link does
        // (design-rework.css).
        "link-accent": "",
        "link-destructive": "",
        "muted-accent": "",
        outline: "",
      },
    },
  },
);

const buttonVariantBindings = {
  accent: { chassis: "solid", skin: "accent" },
  default: { chassis: "solid", skin: "neutral" },
  "default-destructive": { chassis: "solid", skin: "destructive" },
  destructive: { chassis: "solid", skin: "destructive" },
  "frosted-accent": { chassis: "frosted", skin: "accent" },
  ghost: { chassis: "ghost", skin: "neutral" },
  "ghost-destructive": { chassis: "ghost", skin: "destructive" },
  glass: { chassis: "frosted", skin: "neutral" },
  inverse: { chassis: "solid", skin: "inverse" },
  link: { chassis: "link", skin: "neutral" },
  "link-accent": { chassis: "link", skin: "accent" },
  "link-destructive": { chassis: "link", skin: "destructive" },
  "muted-accent": { chassis: "muted", skin: "accent" },
  outline: { chassis: "outline", skin: "neutral" },
  "outline-destructive": { chassis: "outline", skin: "destructive" },
} as const;

const solidEffectLayers = [
  "drop-shadow",
  "interaction",
  "spotlights",
  "dome-overlay",
  "rim",
  "secondary-spotlights",
] as const;

const buttonVariantEffectLayers = {
  accent: solidEffectLayers,
  default: solidEffectLayers,
  "default-destructive": solidEffectLayers,
  destructive: solidEffectLayers,
  "frosted-accent": [
    "drop-shadow",
    "interaction",
    "spotlights",
    "dome-overlay",
    "rim",
  ],
  ghost: ["interaction"],
  "ghost-destructive": ["interaction"],
  glass: ["interaction"],
  inverse: solidEffectLayers,
  link: [],
  "link-accent": [],
  "link-destructive": [],
  "muted-accent": ["interaction"],
  outline: ["interaction", "rim"],
  "outline-destructive": ["interaction", "rim"],
} as const;

// A profile can add a layer its variant does not render. The navigation-link
// profile keeps the layerless link variant but draws the current destination's
// persistent fill through the same interaction layer the Sidebar rows use.
const buttonProfileEffectLayers: Partial<
  Record<KitButtonProfile, readonly string[]>
> = {
  "navigation-link": ["interaction"],
};

// The Buttons that flash their border when a press ends (design-rework.css,
// "Border flash"). Lukas left these out on 20 October 2026: Tabs and Select,
// whose ::before draws the dome and the underline; a Link on its own; Icon
// Morphs, Accordion and Collapsible; the Sidebar's trigger and rail
// (its other Buttons take 0 % from the Sidebar's own tokens); the Copy Button
// except the ghost one; and every icon or symbol without a ghost hover: the
// field and inline actions, the Stepper's step headers, the Navigation Menu,
// the Number Field's steppers and the picker triggers outside the calendar.
// The profiles below leave it out by themselves; a part whose Button has the
// default profile, such as a picker trigger, a Number Field stepper or a Copy
// Button that is not the ghost one, opts out with `data-flash={false}`.
const flashLeftOutProfiles: ReadonlySet<string> = new Set([
  "accordion-trigger",
  "collapsible-trigger",
  "field-action",
  "inline",
  "morph-trigger",
  "navigation-link",
  "select-trigger",
  "sidebar-rail",
  "step-trigger",
  "tabs-tab",
]);

function flashesBorder({
  chassis,
  flash,
  profile,
  sidebar,
}: {
  chassis: string;
  flash: boolean | undefined;
  profile: string;
  sidebar: unknown;
}): boolean {
  if (flash === false) return false;
  if (flashLeftOutProfiles.has(profile) || sidebar === "trigger") return false;
  return !(profile === "default" && chassis === "link");
}

/**
 * The tones of a Button's status dot (`indicator`), the tones of the kit's
 * BadgeDot: an error behind the Button, a warning, a success, information or
 * something new in the accent.
 */
export type ButtonIndicator =
  "accent" | "error" | "info" | "success" | "warning";

/** Every size the chassis draws, the CloseButton's own step included. */
type ButtonChassisSize = NonNullable<
  VariantProps<typeof buttonVariants>["size"]
>;

export interface ButtonBaseProps extends useRender.ComponentProps<"button"> {
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: Exclude<ButtonChassisSize, "close-xs"> | null | undefined;
  /**
   * `square` is the icon-only box and inherits the matching square size.
   * `pill` rounds the control fully at every size; the size keeps its height
   * and padding, and the variant and its states keep their styling.
   */
  shape?: "default" | "square" | "pill";
  /**
   * A loading Button is busy, not unavailable: it blocks activation and keeps
   * its focus and its fill. The spinner takes the middle of the Button and the
   * label keeps its room, unless `showTextWhileLoading` is set.
   */
  loading?: boolean;
  /**
   * Keeps the label visible while `loading`, with the spinner before it where
   * a leading icon stands, and hides the Button's own icons.
   */
  showTextWhileLoading?: boolean;
  align?: "center" | "start" | "between";
  multiline?: boolean;
  width?: "auto" | "fit" | "full";
  /**
   * A status dot, such as an error in a panel the Button shows or something
   * new behind a bell: the kit's BadgeDot in the tone named, 8 px, cut out of
   * the Button by a 2 px ring in the colour of the surface, as the corner marks
   * of an Avatar are. It sits on the top-end corner of the Button's glyph, the
   * leading icon of a labelled Button, and on the top-end corner of the content
   * of a Button without one. Name what it means with `indicatorLabel`.
   */
  indicator?: ButtonIndicator | undefined;
  /**
   * What the dot means, such as "Errors in the fields": the Button's
   * description for assistive technology, read after its name. Without it the
   * dot is decoration only.
   */
  indicatorLabel?: string | undefined;
}

/**
 * The documented profiles. Kit components compose Button with further,
 * internal profiles (`button-internal.ts`); those are not public API.
 *
 * - `avatar` makes an Avatar child the trigger itself: circular interaction
 *   surface and focus ring, at the matching square icon size. The portrait
 *   fills it, with or without a presence dot; an Avatar that names its own
 *   size keeps it, centred in the circle.
 * - `field-action` is the icon-only action inside a field: show or hide a
 *   secret, copy, clear, open a picker. It renders the bare glyph, muted at
 *   rest and primary on hover, press and open, with no fill; the keyboard
 *   focus outline hugs the glyph. A square one names `icon-xs` and keeps its own
 *   24px target, which the profile sets whatever the ladder gives that size.
 *   A press keeps focus inside the field in every engine
 *   (`focusFieldActionOnPress`).
 * - `inline` is an action inside running text; its link takes the accent text
 *   colour, and `profileTone` changes it.
 * - `navigation-link` is a navigation trigger or destination.
 */
export type ButtonProfile =
  "default" | "avatar" | "field-action" | "inline" | "navigation-link";

/**
 * The tones of the `inline` profile, whose link takes the accent text colour
 * without one, in a sentence as on its own beside text, such as View report at
 * the foot of a card. `muted` rests in the tertiary text colour, for a
 * secondary inline action. `accent` names that default. `neutral` keeps the
 * text colour, for a link that sits with text but is no part of a sentence and
 * that the accent would overstate, such as a Back link above a title.
 * `destructive` rests in the text colour and takes the destructive text colour
 * on hover and press, for an action that removes something.
 */
export type ButtonProfileTone = "muted" | "accent" | "neutral" | "destructive";

export interface ButtonDefaultProfileProps extends ButtonBaseProps {
  profile?: Exclude<ButtonProfile, "inline">;
  profileTone?: never;
}

export interface InlineButtonProps extends ButtonBaseProps {
  profile: "inline";
  profileTone?: ButtonProfileTone;
}

export type ButtonStandardProps = ButtonDefaultProfileProps | InlineButtonProps;

export type ButtonProps = ButtonStandardProps;

/** Every prop the implementation reads, internal profiles included. */
type ButtonImplementationProps = Omit<ButtonBaseProps, "size"> & {
  /** `false` leaves the Button out of the border flash (flashesBorder). */
  "data-flash"?: boolean | undefined;
  profile?: KitButtonProfile;
  profileMode?: KitButtonProfileMode;
  profileTone?: KitButtonProfileTone;
  size?: ButtonChassisSize | null | undefined;
};

/** The text sizes of the control ladder, which a square Button turns square. */
const controlLadderSizes: ReadonlySet<string> = new Set([
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
]);

// `focusVisible` is not in TypeScript's FocusOptions yet; every current engine
// reads it.
const fieldActionFocusOptions: FocusOptions & { focusVisible?: boolean } = {
  focusVisible: false,
  preventScroll: true,
};

/**
 * A pressed field action takes focus in every engine. Chromium and Firefox
 * focus a pressed button themselves; Safari does not, so focus fell from the
 * field's control to the page, and the field counted as left: a Field in
 * onBlur mode validated while the user was still in it. The press now moves
 * focus from the control straight to the action, without the keyboard ring. A
 * handler that keeps focus elsewhere prevents the default first and wins, as
 * Base UI's Combobox clear and trigger do to keep it in their input.
 */
function focusFieldActionOnPress(
  event: React.MouseEvent<HTMLButtonElement>,
): void {
  if (event.button !== 0 || event.defaultPrevented) return;
  event.preventDefault();
  event.currentTarget.focus(fieldActionFocusOptions);
}

/*
 * A label that ends with an ellipsis carries its full text as its title, and
 * a label that fits carries none, so a short label adds no native tooltip. The
 * kit's one truncation observer, which Truncate shares, reads the label's box
 * when its size changes, after the first layout too.
 */
function syncLabelTitle(cut: boolean, label: Element): void {
  if (cut) label.setAttribute("title", label.textContent ?? "");
  else label.removeAttribute("title");
}

/**
 * The ref of a Button label: it keeps the label's title in step with its
 * ellipsis while the label is mounted. It is one stable function, so React
 * calls it once per label and runs the cleanup it returns on unmount.
 */
function labelTitleRef(label: HTMLSpanElement | null): (() => void) | void {
  if (!label) return;
  return observeTruncation(label, syncLabelTitle);
}

// The render element's capture handlers are cleared with explicit `undefined`
// values when it is cloned; the Button's own handlers call them instead.
type ButtonRenderCaptureProps = {
  onClickCapture?: React.MouseEventHandler<HTMLElement> | undefined;
  onKeyDownCapture?: React.KeyboardEventHandler<HTMLElement> | undefined;
};

export function Button(buttonProps: ButtonProps): React.ReactElement {
  // Kit components pass internal profiles through KitButton
  // (button-internal.ts), the same function with the wider props type.
  const {
    "aria-describedby": ariaDescribedByProp,
    "aria-disabled": ariaDisabledProp,
    // Read here and never forwarded: the attribute is the Button's own.
    "data-flash": flashProp,
    align = "center",
    className,
    variant,
    size,
    shape = "default",
    render,
    children,
    loading = false,
    showTextWhileLoading = false,
    multiline = false,
    indicator,
    indicatorLabel,
    onClick,
    onClickCapture,
    onKeyDown,
    onKeyDownCapture,
    profile = "default",
    profileMode,
    profileTone,
    width = "auto",
    disabled: disabledProp,
    ...props
  } = buttonProps as ButtonImplementationProps;
  // A loading Button is not disabled: it stays in the tab order and keeps its
  // look, and the aria-disabled guards below block its activation.
  const isDisabled: boolean = Boolean(disabledProp);
  const isAriaDisabled: boolean = Boolean(
    isDisabled ||
    loading ||
    ariaDisabledProp === true ||
    ariaDisabledProp === "true",
  );
  const loadingBesideText = loading && showTextWhileLoading;
  // The dot's meaning is a hidden part of the Button that its description
  // names, so a labelled Button keeps its name and both read it once.
  const indicatorId = React.useId();
  const indicatorNamed = Boolean(indicator && indicatorLabel);
  const describedBy =
    [ariaDescribedByProp, indicatorNamed ? indicatorId : undefined]
      .filter(Boolean)
      .join(" ") || undefined;
  // The spinner only shows the busy state that aria-busy already announces, so
  // it stays out of the accessible name: a status region inside the Button
  // would read "Loading Saving" where the label alone says "Saving".
  const loadingIndicator = loading ? (
    <Spinner
      aria-hidden="true"
      aria-label={undefined}
      className={cn(
        "pointer-events-none size-[var(--sp-rw-button-icon,1rem)] shrink-0",
        loadingBesideText && "static",
      )}
      data-slot="button-loading-indicator"
      role={undefined}
    />
  ) : null;
  const renderElement = React.isValidElement<ButtonRenderCaptureProps>(render)
    ? render
    : undefined;
  const renderCaptureProps = renderElement?.props;
  const guardedRender = renderElement
    ? React.cloneElement(renderElement, {
        onClickCapture: undefined,
        onKeyDownCapture: undefined,
      })
    : render;
  const rendersNativeButton = !render || renderElement?.type === "button";
  // A field action is the glyph's own 24px target. The control size a form
  // hands down must not turn a square one into a field-high box.
  const inheritedSize = useResolvedControlSize(
    profile === "field-action" && shape === "square" && size == null
      ? "icon-xs"
      : size,
  );
  // A square Button takes the icon size of its step on the control ladder; a
  // size of its own, an icon size or the CloseButton's step, stays as it is.
  const resolvedSize =
    (shape === "square" || (profile === "avatar" && size == null)) &&
    controlLadderSizes.has(inheritedSize)
      ? (`icon-${inheritedSize}` as
          "icon-xs" | "icon-sm" | "icon-md" | "icon-lg" | "icon-xl")
      : inheritedSize;
  const resolvedVariant =
    variant ?? (profile === "field-action" ? "ghost" : "default");
  const { chassis, skin } = buttonVariantBindings[resolvedVariant];
  const variantLayers = buttonVariantEffectLayers[
    resolvedVariant
  ] as readonly string[];
  const effectLayers = [
    ...variantLayers,
    ...(buttonProfileEffectLayers[profile] ?? []).filter(
      (layer) => !variantLayers.includes(layer),
    ),
  ];
  const typeValue: React.ButtonHTMLAttributes<HTMLButtonElement>["type"] =
    render ? undefined : "button";
  // A Button of the default profile keeps its label on one line. Its text is
  // a label that ends with an ellipsis where the Button meets the edge of its
  // space, so a long label never makes its container wider (rulebook K5); the
  // label rule in design-rework.css owns that. Other profiles keep their own
  // text layout, and a multiline Button wraps.
  const content =
    profile === "default" && !multiline
      ? wrapTextRuns(children, (text, index) => (
          <span
            className="sp-button-label"
            data-slot="button-label"
            key={`button-label-${index}`}
            ref={labelTitleRef}
          >
            {text}
          </span>
        ))
      : children;
  const defaultProps = {
    children: (
      <>
        {effectLayers.includes("drop-shadow") && (
          <span
            aria-hidden="true"
            data-fx-layer="drop-shadow"
            className="sp-button-chassis-drop-shadow"
            data-slot="button-chassis-drop-shadow"
          />
        )}
        {effectLayers.includes("interaction") && (
          <span
            aria-hidden="true"
            data-fx-layer="interaction"
            className="sp-button-chassis-interaction"
            data-slot="button-chassis-interaction"
          />
        )}
        {effectLayers.includes("spotlights") && (
          <span
            aria-hidden="true"
            data-fx-layer="spotlights"
            className="sp-button-chassis-spotlights"
            data-slot="button-chassis-spotlights"
          />
        )}
        {effectLayers.includes("dome-overlay") && (
          <span
            aria-hidden="true"
            data-fx-layer="dome-overlay"
            className="sp-button-chassis-dome-overlay"
            data-slot="button-chassis-dome-overlay"
          />
        )}
        {effectLayers.includes("rim") && (
          <span
            aria-hidden="true"
            data-fx-layer="rim"
            className="sp-button-chassis-rim"
            data-slot="button-chassis-rim"
          />
        )}
        {effectLayers.includes("secondary-spotlights") && (
          <span
            aria-hidden="true"
            data-fx-layer="secondary-spotlights"
            className="sp-button-chassis-secondary-spotlights"
            data-slot="button-chassis-secondary-spotlights"
          />
        )}
        {/* An empty, unstyled span (a label left empty) takes no slot, so it
            adds no content gap beside the icon. */}
        <span
          className={cn(
            "sp-button-content [&>span:empty:not([class],[style],[data-slot])]:hidden",
            // The spinner stands in the place of the Button's own icons.
            loadingBesideText &&
              "[&>svg:not([data-slot=button-loading-indicator])]:hidden",
          )}
          data-slot="button-content"
        >
          {loadingBesideText ? loadingIndicator : null}
          {content}
          {indicator ? (
            <span
              aria-hidden="true"
              className="sp-button-indicator"
              data-slot="button-indicator"
              data-variant={indicator}
            />
          ) : null}
          {indicatorNamed ? (
            <span
              className="sp-button-indicator-label"
              data-slot="button-indicator-label"
              hidden
              id={indicatorId}
            >
              {indicatorLabel}
            </span>
          ) : null}
        </span>
        {loadingBesideText ? null : loadingIndicator}
      </>
    ),
    className: cn(
      slotClass("button", props, guardedRender),
      buttonVariants({ size: resolvedSize, variant: resolvedVariant }),
      resolvedVariant === "glass" && surfaceClassNames.glass,
      "sp-button-motion",
      // A multiline Button's height follows its lines, and one line stays on
      // the control scale: both are design-rework.css's ([data-multiline]).
      // A Select trigger's surface is its profile's, by its mode, there too.
      width === "fit" && "w-fit",
      className,
    ),
    "aria-busy": loading || undefined,
    "aria-describedby": describedBy,
    "aria-disabled": isAriaDisabled || undefined,
    "data-align": align === "center" ? undefined : align,
    "data-loading": loading ? "" : undefined,
    "data-loading-text": loadingBesideText ? "" : undefined,
    "data-multiline": multiline ? "" : undefined,
    "data-profile": profile,
    "data-profile-mode": profileMode,
    "data-profile-tone": profileTone,
    "data-chassis": chassis,
    "data-flash": flashesBorder({
      chassis,
      flash: flashProp,
      profile,
      sidebar: (props as Record<string, unknown>)["data-sidebar"],
    })
      ? ""
      : undefined,
    "data-shape": shape,
    "data-size": resolvedSize,
    "data-skin": skin,
    "data-slot": "button",
    "data-variant": resolvedVariant,
    "data-width": width === "auto" ? undefined : width,
    disabled: rendersNativeButton ? isDisabled : undefined,
    onClickCapture:
      isAriaDisabled || renderCaptureProps?.onClickCapture || onClickCapture
        ? (event: React.MouseEvent<HTMLButtonElement>) => {
            // This is the earliest owner-local guard. DOM ancestor capture
            // handlers have already run; stopping those would require global
            // interception.
            if (isAriaDisabled) {
              event.preventDefault();
              event.stopPropagation();
              return;
            }

            renderCaptureProps?.onClickCapture?.(event);
            if (
              !(
                event as React.SyntheticEvent & {
                  baseUIHandlerPrevented?: boolean;
                }
              ).baseUIHandlerPrevented
            ) {
              onClickCapture?.(event);
            }
          }
        : undefined,
    onClick:
      isAriaDisabled || onClick
        ? (event: React.MouseEvent<HTMLButtonElement>) => {
            if (isAriaDisabled) {
              event.preventDefault();
              event.stopPropagation();
              return;
            }

            onClick?.(event);
          }
        : undefined,
    onMouseDown:
      profile === "field-action" ? focusFieldActionOnPress : undefined,
    onKeyDown:
      isAriaDisabled || onKeyDown
        ? (event: React.KeyboardEvent<HTMLButtonElement>) => {
            if (
              isAriaDisabled &&
              (event.key === "Enter" || event.key === " ")
            ) {
              event.preventDefault();
              event.stopPropagation();
              return;
            }

            onKeyDown?.(event);
          }
        : undefined,
    onKeyDownCapture:
      isAriaDisabled || renderCaptureProps?.onKeyDownCapture || onKeyDownCapture
        ? (event: React.KeyboardEvent<HTMLButtonElement>) => {
            // Keep the focusable aria-disabled element in place while blocking
            // its target and bubble activation path.
            if (
              isAriaDisabled &&
              (event.key === "Enter" || event.key === " ")
            ) {
              event.preventDefault();
              event.stopPropagation();
              return;
            }

            renderCaptureProps?.onKeyDownCapture?.(event);
            if (
              !(
                event as React.SyntheticEvent & {
                  baseUIHandlerPrevented?: boolean;
                }
              ).baseUIHandlerPrevented
            ) {
              onKeyDownCapture?.(event);
            }
          }
        : undefined,
    type: typeValue,
  };

  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(defaultProps, props),
    render: guardedRender,
  });
}
