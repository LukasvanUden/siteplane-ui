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
import {
  formControlSurfaceClassNames,
  surfaceClassNames,
} from "../../system/styles/surface";
import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { wrapTextRuns } from "../../system/utils/text-runs";
import { Spinner } from "../spinner";
import type {
  KitButtonProfile,
  KitButtonProfileMode,
  KitButtonProfileTone,
  SelectTriggerButtonMode,
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
      // ::before layer takes the chassis radius at every size.
      size: {
        md: "",
        "icon-md": "",
        "icon-lg": "",
        "icon-sm": "",
        "icon-xl": "",
        "icon-xs": "",
        "icon-2xs": "",
        lg: "",
        sm: "",
        xl: "",
        xs: "",
      },
      variant: {
        default:
          "*:data-[slot=button-loading-indicator]:text-secondary-foreground",
        accent:
          "*:data-[slot=button-loading-indicator]:text-primary-foreground",
        destructive: "*:data-[slot=button-loading-indicator]:text-white",
        "frosted-accent": "backdrop-blur-md",
        // The shared glass surface draws the fill, edge, shadow, sheen, blur
        // and text colour; the Button keeps its geometry, focus and
        // interaction layer.
        glass: "",
        "ghost-destructive":
          "*:data-[slot=button-loading-indicator]:text-destructive-foreground",
        inverse:
          "*:data-[slot=button-loading-indicator]:text-primary-foreground",
        "outline-destructive":
          "*:data-[slot=button-loading-indicator]:text-foreground",
        ghost: "*:data-[slot=button-loading-indicator]:text-foreground",
        link: "underline-offset-4 not-aria-disabled:hover:underline not-aria-disabled:data-pressed:underline *:data-[slot=button-loading-indicator]:text-foreground",
        "muted-accent": "",
        outline: "*:data-[slot=button-loading-indicator]:text-foreground",
        text: "not-aria-disabled:data-pressed:opacity-80 *:data-[slot=button-loading-indicator]:text-foreground",
      },
    },
  },
);

const buttonVariantBindings = {
  accent: { chassis: "solid", skin: "accent" },
  default: { chassis: "solid", skin: "neutral" },
  destructive: { chassis: "solid", skin: "destructive" },
  "frosted-accent": { chassis: "frosted", skin: "accent" },
  ghost: { chassis: "ghost", skin: "neutral" },
  "ghost-destructive": { chassis: "ghost", skin: "destructive" },
  glass: { chassis: "frosted", skin: "neutral" },
  inverse: { chassis: "solid", skin: "inverse" },
  link: { chassis: "link", skin: "neutral" },
  "muted-accent": { chassis: "muted", skin: "accent" },
  outline: { chassis: "outline", skin: "neutral" },
  "outline-destructive": { chassis: "outline", skin: "destructive" },
  text: { chassis: "text", skin: "neutral" },
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
  "muted-accent": ["interaction"],
  outline: ["interaction", "rim"],
  "outline-destructive": ["interaction", "rim"],
  text: [],
} as const;

// A profile can add a layer its variant does not render. The navigation-link
// profile keeps the layerless text variant but draws the current destination's
// persistent fill through the same interaction layer the Sidebar rows use.
const buttonProfileEffectLayers: Partial<
  Record<KitButtonProfile, readonly string[]>
> = {
  "navigation-link": ["interaction"],
};

export interface ButtonBaseProps extends useRender.ComponentProps<"button"> {
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  /**
   * `square` is the icon-only box and inherits the matching square size.
   * `pill` rounds the control fully at every size; the size keeps its height
   * and padding, and the variant and its states keep their styling.
   */
  shape?: "default" | "square" | "pill";
  loading?: boolean;
  align?: "center" | "start" | "between";
  multiline?: boolean;
  width?: "auto" | "fit" | "full";
}

/**
 * The documented profiles. Kit components compose Button with further,
 * internal profiles (`button-internal.ts`); those are not public API.
 *
 * - `avatar` makes an Avatar child the trigger itself: circular interaction
 *   surface and focus ring, at the matching square icon size.
 * - `field-action` is the icon-only action inside a field: show or hide a
 *   secret, copy, clear, open a picker. It renders the bare glyph, muted at
 *   rest and primary on hover, press and open, with no fill; the keyboard
 *   focus outline hugs the glyph. A square one defaults to the 24px `icon-xs`
 *   target. A press keeps focus inside the field in every engine
 *   (`focusFieldActionOnPress`).
 * - `inline` is an action inside running text; it takes `profileTone`.
 * - `navigation-link` is a navigation trigger or destination.
 */
export type ButtonProfile =
  "default" | "avatar" | "field-action" | "inline" | "navigation-link";

/**
 * The tones of the `inline` profile. `muted` rests in the tertiary text
 * colour, for a secondary inline action. `accent` takes the accent text colour
 * at rest and on interaction, for a link that stands out beside neutral ones.
 * `destructive` rests like any link and takes the destructive text colour on
 * hover and press, for an action that removes something.
 */
export type ButtonProfileTone = "muted" | "accent" | "destructive";

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
type ButtonImplementationProps = ButtonBaseProps & {
  profile?: KitButtonProfile;
  profileMode?: KitButtonProfileMode;
  profileTone?: KitButtonProfileTone;
};

const selectTriggerProfileModeClassNames = {
  default: formControlSurfaceClassNames.default,
  elevated: formControlSurfaceClassNames.elevated,
  ghost: "",
  inset: formControlSurfaceClassNames.inset,
} as const satisfies Record<SelectTriggerButtonMode, string>;

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
    "aria-disabled": ariaDisabledProp,
    align = "center",
    className,
    variant,
    size,
    shape = "default",
    render,
    children,
    loading = false,
    multiline = false,
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
  const isDisabled: boolean = Boolean(loading || disabledProp);
  const isAriaDisabled: boolean = Boolean(
    isDisabled || ariaDisabledProp === true || ariaDisabledProp === "true",
  );
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
  const resolvedSize =
    (shape === "square" || (profile === "avatar" && size == null)) &&
    !inheritedSize.startsWith("icon")
      ? (`icon-${inheritedSize}` as
          "icon-xs" | "icon-sm" | "icon-md" | "icon-lg" | "icon-xl")
      : inheritedSize;
  const resolvedVariant =
    variant ?? (profile === "field-action" ? "ghost" : "default");
  const selectTriggerProfileMode =
    profile === "select-trigger"
      ? (profileMode as SelectTriggerButtonMode | undefined)
      : undefined;
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
          className="sp-button-content [&>span:empty:not([class],[style],[data-slot])]:hidden"
          data-slot="button-content"
        >
          {content}
        </span>
        {loading && (
          <Spinner
            className="pointer-events-none"
            data-slot="button-loading-indicator"
          />
        )}
      </>
    ),
    className: cn(
      slotClass("button", props, guardedRender),
      buttonVariants({ size: resolvedSize, variant: resolvedVariant }),
      resolvedVariant === "glass" && surfaceClassNames.glass,
      "sp-button-motion",
      // A multiline Button's height follows its lines, and one line stays on
      // the control scale: both are design-rework.css's ([data-multiline]).
      selectTriggerProfileMode &&
        selectTriggerProfileModeClassNames[selectTriggerProfileMode],
      width === "fit" && "w-fit",
      className,
    ),
    "aria-disabled": isAriaDisabled || undefined,
    "data-align": align === "center" ? undefined : align,
    "data-loading": loading ? "" : undefined,
    "data-multiline": multiline ? "" : undefined,
    "data-profile": profile,
    "data-profile-mode": profileMode,
    "data-profile-tone": profileTone,
    "data-chassis": chassis,
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
