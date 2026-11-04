"use client";

import {
  useState,
  type MouseEventHandler,
  type ReactElement,
  type ReactNode,
} from "react";
import { useSiteplaneMessages } from "../../system/locale/messages-context";
import { Badge } from "../badge";
import { Button, type ButtonStandardProps } from "./button";
import { CloseGlyph, KitButton } from "./button-internal";

export { CloseGlyph } from "./button-internal";
export {
  OverflowGlyph,
  type OverflowGlyphOrientation,
  type OverflowGlyphProps,
} from "../../system/styles/overflow-glyph";

type StandardButtonPropsWithout<K extends keyof ButtonStandardProps> =
  ButtonStandardProps extends infer Props
    ? Props extends ButtonStandardProps
      ? Omit<Props, K>
      : never
    : never;

type IconButtonSize = Extract<
  NonNullable<ButtonStandardProps["size"]>,
  "icon-lg" | "icon-md" | "icon-sm" | "icon-xl" | "icon-xs"
>;

export type IconButtonProps = StandardButtonPropsWithout<
  "aria-label" | "children" | "size" | "shape"
> & {
  icon: ReactNode;
  label: string;
  /** A positive count, displayed as 99+ above 99. Include its meaning in label. */
  count?: number;
  size?: IconButtonSize;
};

export function IconButton({
  icon,
  label,
  count,
  size,
  ...props
}: IconButtonProps): ReactElement {
  return (
    <Button aria-label={label} shape="square" size={size} {...props}>
      {icon}
      {count !== undefined && Number.isFinite(count) && count > 0 && (
        <Badge aria-hidden="true" profile="count">
          {count > 99 ? "99+" : Math.ceil(count)}
        </Badge>
      )}
    </Button>
  );
}

export type ButtonWithIconProps = StandardButtonPropsWithout<"children"> & {
  children: ReactNode;
  icon: ReactNode;
  iconPosition?: "end" | "start";
};

export function ButtonWithIcon({
  children,
  icon,
  iconPosition = "start",
  ...props
}: ButtonWithIconProps): ReactElement {
  // The label is the Button's own: a text child becomes its one-line label,
  // with the 2 px inset at its sides that every Button label has and an
  // ellipsis where the Button meets the edge of its space (K5). An empty label
  // adds nothing beside the icon, so the icon stays centred.
  return (
    <Button {...props}>
      {iconPosition === "start" ? icon : null}
      {children}
      {iconPosition === "end" ? icon : null}
    </Button>
  );
}

type LoadingButtonPhase = "idle" | "loading";

export type LoadingButtonProps = StandardButtonPropsWithout<
  "children" | "loading" | "onClick" | "showTextWhileLoading"
> & {
  action?: () => Promise<unknown> | unknown;
  children: ReactNode;
  icon?: ReactNode;
  iconPosition?: "end" | "start";
  loading?: boolean;
  loadingText?: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onError?: (error: unknown) => void;
};

/**
 * A Button that runs an action and shows its pending state while the action
 * runs: the Button's own loading state with the label kept, so the spinner
 * stands in the place of the icon, before `loadingText`. The Button stays
 * focusable and blocks its activation meanwhile (aria-busy, aria-disabled).
 */
export function LoadingButton({
  action,
  children,
  disabled,
  icon,
  iconPosition = "start",
  loading = false,
  loadingText: loadingTextProp,
  onClick,
  onError,
  ...props
}: LoadingButtonProps): ReactElement {
  const messages = useSiteplaneMessages("loadingButton");
  const loadingText =
    loadingTextProp === undefined ? messages.loading : loadingTextProp;
  const [phase, setPhase] = useState<LoadingButtonPhase>("idle");
  const visualPhase: LoadingButtonPhase = loading ? "loading" : phase;
  const isPending = visualPhase === "loading";

  const handleClick: MouseEventHandler<HTMLButtonElement> = async (event) => {
    if (visualPhase !== "idle" || disabled) return;
    onClick?.(event);
    if (event.defaultPrevented || !action) return;

    setPhase("loading");
    try {
      await Promise.resolve(action());
    } catch (error) {
      onError?.(error);
      setPhase("idle");
      return;
    }
    setPhase("idle");
  };

  return (
    <Button
      {...props}
      data-loading-button-phase={visualPhase}
      disabled={disabled}
      loading={isPending}
      onClick={handleClick}
      showTextWhileLoading
    >
      {iconPosition === "start" ? icon : null}
      {isPending ? loadingText : children}
      {iconPosition === "end" ? icon : null}
    </Button>
  );
}

/**
 * The sizes of a CloseButton: 28, 36, 40 and 44 px, and the
 * kit's dense 24 px step (`2xs`), the corner close of a Dialog, Sheet, Drawer,
 * Popover, Alert, Notification and Toast.
 */
export type CloseButtonSize = "2xs" | "lg" | "md" | "sm" | "xs";

const closeButtonSizes = {
  "2xs": "icon-2xs",
  lg: "icon-lg",
  md: "icon-md",
  sm: "icon-sm",
  xs: "close-xs",
} as const satisfies Record<CloseButtonSize, string>;

export type CloseButtonProps = StandardButtonPropsWithout<
  | "aria-label"
  | "children"
  | "profile"
  | "profileTone"
  | "shape"
  | "size"
  | "variant"
> & {
  /**
   * The accessible name: the `closeButton.label` message of
   * SiteplaneLocaleProvider by default, "Close" in English.
   */
  label?: string | undefined;
  /**
   * 24 px with a 16 px glyph at 2xs, 28 px with 16 px at xs, 36 px at sm,
   * 40 px at md (20 px glyphs) and 44 px with 24 px at lg.
   */
  size?: CloseButtonSize;
};

/**
 * A close button: a bare X that fills with the hover
 * fill. On a dark surface it reads the dark theme's text colours, so put it in
 * a `data-theme="dark"` scope (a dark Card, or a Provider with that theme)
 * instead of choosing a colour. Every close of the kit is this Button: an
 * overlay places it at `2xs` in its corner, and passes only its place.
 */
export function CloseButton({
  label,
  size = "sm",
  ...props
}: CloseButtonProps): ReactElement {
  // A Close part that renders it, such as an overlay's, hands it that part's
  // accessible name; `label` names it otherwise, and the provider's
  // `closeButton.label` message by default ("Close").
  const messages = useSiteplaneMessages("closeButton");
  const name =
    label ??
    (props as { "aria-label"?: string })["aria-label"] ??
    messages.label;
  return (
    <KitButton
      {...props}
      aria-label={name}
      profile="close"
      shape="square"
      size={closeButtonSizes[size]}
      variant="ghost"
    >
      <CloseGlyph />
    </KitButton>
  );
}
