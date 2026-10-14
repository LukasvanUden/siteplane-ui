"use client";

import { LogOutIcon } from "lucide-react";
import type { CSSProperties, ReactElement, ReactNode } from "react";

import type { ButtonBaseProps } from "../button";
import { KitButton } from "../button/button-internal";
import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import { cn } from "../../system/utils/cn";

import "./animated-buttons.css";

type AnimatedButtonVariant = Extract<
  NonNullable<ButtonBaseProps["variant"]>,
  "default" | "destructive" | "inverse" | "outline"
>;

export type FillSweepButtonProps = Omit<ButtonBaseProps, "variant"> & {
  variant?: AnimatedButtonVariant;
};

export function FillSweepButton({
  children,
  className,
  variant = "default",
  ...props
}: FillSweepButtonProps): ReactElement {
  return (
    <span
      className="sp-fill-sweep-button-root"
      data-slot="fill-sweep-button-root"
    >
      <KitButton
        {...props}
        className={cn("sp-fill-sweep-button", className)}
        profile="animated-fill"
        variant={variant === "destructive" ? "outline-destructive" : variant}
      >
        <span aria-hidden="true" className="sp-fill-sweep-fill" />
        <span className="sp-fill-sweep-label">{children}</span>
      </KitButton>
    </span>
  );
}

export type ExpandingArrowButtonProps = Omit<
  ButtonBaseProps,
  "children" | "size" | "variant"
> & {
  label?: ReactNode;
  size?: SiteplaneControlSize;
  /**
   * `text` is the bare arrow and label. `default` sets them on the default
   * Button's surface, with its fill, hairline rim, depth and states.
   */
  variant?: "text" | "default";
};

// `type` stays in `props`: Button sets type="button" only when it renders a
// native button, so a `render` link does not receive it.
export function ExpandingArrowButton({
  className,
  label = "Learn more",
  size,
  variant = "text",
  ...props
}: ExpandingArrowButtonProps): ReactElement {
  const resolvedSize = useResolvedControlSize(size);

  return (
    <span
      data-size={resolvedSize}
      className="sp-expanding-arrow-button-root"
      data-slot="expanding-arrow-button-root"
    >
      <KitButton
        {...props}
        className={cn("sp-expanding-arrow-button", className)}
        profile="animated-arrow"
        size={resolvedSize}
        variant={variant}
      >
        <span aria-hidden="true" className="sp-expanding-arrow-circle">
          <span className="sp-expanding-arrow-icon" />
        </span>
        <span className="sp-expanding-arrow-label">{label}</span>
      </KitButton>
    </span>
  );
}

export type ExpandingLogoutButtonProps = Omit<
  ButtonBaseProps,
  "children" | "size" | "variant"
> & {
  label?: string;
  size?: SiteplaneControlSize;
  variant?: AnimatedButtonVariant;
};

export function ExpandingLogoutButton({
  "aria-label": ariaLabel,
  className,
  label = "Log out",
  size,
  style,
  variant = "destructive",
  ...props
}: ExpandingLogoutButtonProps): ReactElement {
  const resolvedSize = useResolvedControlSize(size);

  return (
    <span
      data-size={resolvedSize}
      className="sp-expanding-logout-button-root"
      data-slot="expanding-logout-button-root"
    >
      {/* The open width fits the label; animated-buttons.css turns its length
          into the width. */}
      <span
        className="sp-expanding-logout-slot"
        style={
          {
            "--sp-expanding-logout-label-length": label.length,
          } as CSSProperties
        }
      >
        <KitButton
          {...props}
          aria-label={ariaLabel ?? label}
          className={cn("sp-expanding-logout-button", className)}
          data-variant={
            variant === "destructive" ? "outline-destructive" : variant
          }
          profile="animated-expand"
          size={resolvedSize}
          style={style}
          variant={variant === "destructive" ? "outline-destructive" : variant}
        >
          <span aria-hidden="true" className="sp-expanding-logout-sign">
            <LogOutIcon aria-hidden="true" focusable="false" />
          </span>
          <span className="sp-expanding-logout-label">{label}</span>
        </KitButton>
      </span>
    </span>
  );
}
