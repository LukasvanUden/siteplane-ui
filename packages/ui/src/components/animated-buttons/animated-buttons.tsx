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
    <span data-slot="fill-sweep-button-root">
      <style>{fillSweepStyles}</style>
      <KitButton
        {...props}
        className={cn("siteplane-fill-sweep-button", className)}
        profile="animated-fill"
        variant={variant === "destructive" ? "outline-destructive" : variant}
      >
        <span aria-hidden="true" className="siteplane-fill-sweep-fill" />
        <span className="siteplane-fill-sweep-label">{children}</span>
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
    <span data-size={resolvedSize} data-slot="expanding-arrow-button-root">
      <style>{expandingArrowStyles}</style>
      <KitButton
        {...props}
        className={cn("siteplane-expanding-arrow-button", className)}
        profile="animated-arrow"
        size={resolvedSize}
        variant={variant}
      >
        <span aria-hidden="true" className="siteplane-expanding-arrow-circle">
          <span className="siteplane-expanding-arrow-icon" />
        </span>
        <span className="siteplane-expanding-arrow-label">{label}</span>
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
    <span data-size={resolvedSize} data-slot="expanding-logout-button-root">
      <style>{expandingLogoutStyles}</style>
      <span
        className="siteplane-expanding-logout-slot"
        style={
          {
            "--siteplane-expanding-logout-open-width": `max(var(--siteplane-expanding-logout-min-open-width), calc(${label.length}ch + var(--siteplane-expanding-logout-closed-size) + var(--siteplane-expanding-logout-open-buffer)))`,
          } as CSSProperties
        }
      >
        <KitButton
          {...props}
          aria-label={ariaLabel ?? label}
          className={cn("siteplane-expanding-logout-button", className)}
          data-variant={
            variant === "destructive" ? "outline-destructive" : variant
          }
          profile="animated-expand"
          size={resolvedSize}
          style={style}
          variant={variant === "destructive" ? "outline-destructive" : variant}
        >
          <span aria-hidden="true" className="siteplane-expanding-logout-sign">
            <LogOutIcon aria-hidden="true" focusable="false" />
          </span>
          <span className="siteplane-expanding-logout-label">{label}</span>
        </KitButton>
      </span>
    </span>
  );
}

const fillSweepStyles = `
  @layer siteplane {
    [data-slot="fill-sweep-button-root"] {
      --siteplane-fill-sweep-radius: var(--radius-lg);
      --siteplane-fill-sweep-duration: var(--motion-duration-moderate);
      --siteplane-fill-sweep-inset: 0px;
      --siteplane-fill-sweep-hover-width: 100%;
      display: inline-flex;
    }

    [data-radius="xl"] [data-slot="fill-sweep-button-root"] {
      --siteplane-fill-sweep-radius: var(--radius-4xl);
    }

    [data-slot="fill-sweep-button-root"] .siteplane-fill-sweep-fill {
      position: absolute;
      inset: var(--siteplane-fill-sweep-inset) auto var(--siteplane-fill-sweep-inset) var(--siteplane-fill-sweep-inset);
      height: auto;
      width: 0;
      /* The Button clips the sweep once; a second rounded edge leaks its dark base. */
      border-radius: 0;
      background-color: var(--siteplane-fill-sweep-layer);
      z-index: 20;
      transition-property: width;
      transition-duration: var(--siteplane-fill-sweep-duration);
      transition-timing-function: var(--motion-ease-soft-in-out);
    }

    [data-slot="fill-sweep-button-root"] .siteplane-fill-sweep-label {
      position: relative;
      z-index: 30;
    }

    [data-slot="fill-sweep-button-root"] .siteplane-fill-sweep-button:not(:disabled, [aria-disabled="true"]):hover .siteplane-fill-sweep-fill {
      width: var(--siteplane-fill-sweep-hover-width);
    }

    :is(html[data-motion-reduce="true"], [data-sp-motion="reduced"]) [data-slot="fill-sweep-button-root"] .siteplane-fill-sweep-fill {
      transition-duration: 0ms;
    }

    @media (prefers-reduced-motion: reduce) {
      [data-slot="fill-sweep-button-root"] .siteplane-fill-sweep-fill {
        transition-duration: 0ms;
      }
    }
  }
`;

const expandingArrowStyles = `
  @layer siteplane {
    /* The circle is the height of the control size at every viewport, like a
     * Button of that size (S1); the arrow scales with it. */
    [data-slot="expanding-arrow-button-root"] {
      --siteplane-expanding-arrow-circle-size: var(--sp-rw-control-md);
      --siteplane-expanding-arrow-left: 0.4rem;
      --siteplane-expanding-arrow-line-width: 0.75rem;
      --siteplane-expanding-arrow-line-height: 0.125rem;
      --siteplane-expanding-arrow-head-size: 0.4rem;
      --siteplane-expanding-arrow-head-right: 0.0625rem;
      --siteplane-expanding-arrow-hover-x: 0.625rem;
      --siteplane-expanding-arrow-text-size: 0.875rem;
      --siteplane-expanding-arrow-radius: var(--radius-lg);
      display: inline-flex;
    }

    [data-radius="xl"] [data-slot="expanding-arrow-button-root"] {
      --siteplane-expanding-arrow-radius: var(--radius-4xl);
    }

    [data-slot="expanding-arrow-button-root"][data-size="sm"] {
      --siteplane-expanding-arrow-circle-size: var(--sp-rw-control-sm);
      --siteplane-expanding-arrow-left: 0.35rem;
      --siteplane-expanding-arrow-line-width: 0.65625rem;
      --siteplane-expanding-arrow-head-size: 0.35rem;
      --siteplane-expanding-arrow-hover-x: 0.5625rem;
      --siteplane-expanding-arrow-text-size: 0.8125rem;
    }

    [data-slot="expanding-arrow-button-root"][data-size="md"] {
      --siteplane-expanding-arrow-circle-size: var(--sp-rw-control-md);
      --siteplane-expanding-arrow-left: 0.4rem;
      --siteplane-expanding-arrow-line-width: 0.75rem;
      --siteplane-expanding-arrow-head-size: 0.4rem;
      --siteplane-expanding-arrow-hover-x: 0.625rem;
    }

    [data-slot="expanding-arrow-button-root"][data-size="lg"] {
      --siteplane-expanding-arrow-circle-size: var(--sp-rw-control-lg);
      --siteplane-expanding-arrow-left: 0.45rem;
      --siteplane-expanding-arrow-line-width: 0.84375rem;
      --siteplane-expanding-arrow-head-size: 0.45rem;
      --siteplane-expanding-arrow-hover-x: 0.75rem;
    }

    [data-slot="expanding-arrow-button-root"][data-size="xl"] {
      --siteplane-expanding-arrow-circle-size: var(--sp-rw-control-xl);
      --siteplane-expanding-arrow-left: 0.6rem;
      --siteplane-expanding-arrow-line-width: 1.125rem;
      --siteplane-expanding-arrow-head-size: 0.6rem;
      --siteplane-expanding-arrow-hover-x: 1rem;
      --siteplane-expanding-arrow-text-size: 1rem;
    }

    /* Over a surface the fill paints above the Button's finish and below its
     * rim, the label above both (design-rework.css, animated-arrow). */
    [data-slot="expanding-arrow-button-root"] .siteplane-expanding-arrow-circle {
      position: absolute;
      z-index: 20;
      inset: 0 auto 0 0;
      display: block;
      margin: 0;
      width: var(--siteplane-expanding-arrow-circle-size);
      height: 100%;
      overflow: hidden;
      border-radius: var(--siteplane-expanding-arrow-radius);
      background: var(--sp-rw-bg-inverse);
      transition: width var(--motion-duration-slow) var(--motion-ease-soft-in-out);
    }

    /* On a surface the fill starts flush in its corner, so it takes the
     * surface's radius and fits it at rest and filled. */
    [data-slot="expanding-arrow-button-root"] .siteplane-expanding-arrow-button:not([data-variant="text"]) .siteplane-expanding-arrow-circle {
      border-radius: inherit;
    }

    [data-slot="expanding-arrow-button-root"] .siteplane-expanding-arrow-icon {
      position: absolute;
      top: 0;
      bottom: 0;
      left: var(--siteplane-expanding-arrow-left);
      width: var(--siteplane-expanding-arrow-line-width);
      height: var(--siteplane-expanding-arrow-line-height);
      margin: auto;
      border-radius: 999px;
      background: transparent;
      transition: background-color var(--motion-duration-slow) var(--motion-ease-soft-in-out), transform var(--motion-duration-slow) var(--motion-ease-soft-in-out);
    }

    [data-slot="expanding-arrow-button-root"] .siteplane-expanding-arrow-icon::before {
      position: absolute;
      content: "";
      top: 50%;
      right: var(--siteplane-expanding-arrow-head-right);
      width: var(--siteplane-expanding-arrow-head-size);
      height: var(--siteplane-expanding-arrow-head-size);
      border-top: var(--siteplane-expanding-arrow-line-height) solid var(--sp-rw-fg-inverse);
      border-right: var(--siteplane-expanding-arrow-line-height) solid var(--sp-rw-fg-inverse);
      border-radius: 0 var(--siteplane-expanding-arrow-line-height) 0 0;
      transform: translateY(-50%) rotate(45deg);
    }

    [data-slot="expanding-arrow-button-root"] .siteplane-expanding-arrow-label {
      position: relative;
      z-index: 30;
      display: flex;
      align-items: center;
      min-height: var(--siteplane-expanding-arrow-circle-size);
      padding: 0 calc(var(--siteplane-expanding-arrow-left) + var(--siteplane-expanding-arrow-hover-x)) 0 calc(var(--siteplane-expanding-arrow-circle-size) + 0.5rem);
      color: var(--sp-rw-fg-primary);
      font-size: var(--siteplane-expanding-arrow-text-size);
      font-weight: var(--sp-rw-font-weight-default);
      line-height: 1.6;
      text-align: center;
      transition: color var(--motion-duration-slow) var(--motion-ease-soft-in-out);
    }

    [data-slot="expanding-arrow-button-root"] .siteplane-expanding-arrow-button:not(:disabled, [aria-disabled="true"]):hover .siteplane-expanding-arrow-circle {
      width: 100%;
    }

    [data-slot="expanding-arrow-button-root"] .siteplane-expanding-arrow-button:not(:disabled, [aria-disabled="true"]):hover .siteplane-expanding-arrow-icon {
      background: var(--sp-rw-fg-inverse);
      transform: translateX(var(--siteplane-expanding-arrow-hover-x));
    }

    [data-slot="expanding-arrow-button-root"] .siteplane-expanding-arrow-button:not(:disabled, [aria-disabled="true"]):hover .siteplane-expanding-arrow-label {
      color: var(--sp-rw-fg-inverse);
    }

    :is(html[data-motion-reduce="true"], [data-sp-motion="reduced"]) [data-slot="expanding-arrow-button-root"] .siteplane-expanding-arrow-circle,
    :is(html[data-motion-reduce="true"], [data-sp-motion="reduced"]) [data-slot="expanding-arrow-button-root"] .siteplane-expanding-arrow-icon,
    :is(html[data-motion-reduce="true"], [data-sp-motion="reduced"]) [data-slot="expanding-arrow-button-root"] .siteplane-expanding-arrow-label {
      transition-duration: 0ms;
    }

    @media (prefers-reduced-motion: reduce) {
      [data-slot="expanding-arrow-button-root"] .siteplane-expanding-arrow-circle,
      [data-slot="expanding-arrow-button-root"] .siteplane-expanding-arrow-icon,
      [data-slot="expanding-arrow-button-root"] .siteplane-expanding-arrow-label {
        transition-duration: 0ms;
      }
    }
  }
`;

const expandingLogoutStyles = `
  @layer siteplane {
    /* The closed button is the square of the control size at every viewport,
     * like a Button of that size (S1); the icon and the open width scale with
     * it. */
    [data-slot="expanding-logout-button-root"] {
      --siteplane-expanding-logout-closed-size: var(--sp-rw-control-md);
      --siteplane-expanding-logout-min-open-width: 6rem;
      --siteplane-expanding-logout-icon-size: 0.875rem;
      --siteplane-expanding-logout-duration: var(--motion-duration-slow);
      --siteplane-expanding-logout-open-buffer: 1rem;
      --siteplane-expanding-logout-sign-hover-width: 30%;
      --siteplane-expanding-logout-sign-padding-left: 0.75rem;
      --siteplane-expanding-logout-text-hover-width: 70%;
      --siteplane-expanding-logout-text-padding-right: 0.375rem;
      --siteplane-expanding-logout-text-size: 0.875rem;
      --siteplane-expanding-logout-radius: var(--radius-lg);
      display: inline-flex;
    }

    [data-radius="xl"] [data-slot="expanding-logout-button-root"] {
      --siteplane-expanding-logout-radius: var(--radius-4xl);
    }

    [data-slot="expanding-logout-button-root"][data-size="sm"] {
      --siteplane-expanding-logout-closed-size: var(--sp-rw-control-sm);
      --siteplane-expanding-logout-min-open-width: 5.5rem;
      --siteplane-expanding-logout-icon-size: 0.75rem;
      --siteplane-expanding-logout-open-buffer: 0.875rem;
      --siteplane-expanding-logout-sign-padding-left: 0.625rem;
      --siteplane-expanding-logout-text-padding-right: 0.3125rem;
      --siteplane-expanding-logout-text-size: 0.8125rem;
    }

    [data-slot="expanding-logout-button-root"][data-size="md"] {
      --siteplane-expanding-logout-closed-size: var(--sp-rw-control-md);
      --siteplane-expanding-logout-min-open-width: 6rem;
      --siteplane-expanding-logout-icon-size: 0.875rem;
      --siteplane-expanding-logout-open-buffer: 1rem;
      --siteplane-expanding-logout-sign-padding-left: 0.75rem;
      --siteplane-expanding-logout-text-padding-right: 0.375rem;
    }

    [data-slot="expanding-logout-button-root"][data-size="lg"] {
      --siteplane-expanding-logout-closed-size: var(--sp-rw-control-lg);
      --siteplane-expanding-logout-min-open-width: 6.625rem;
      --siteplane-expanding-logout-icon-size: 0.9375rem;
      --siteplane-expanding-logout-open-buffer: 1.25rem;
      --siteplane-expanding-logout-sign-padding-left: 0.875rem;
      --siteplane-expanding-logout-text-padding-right: 0.4375rem;
    }

    [data-slot="expanding-logout-button-root"][data-size="xl"] {
      --siteplane-expanding-logout-closed-size: var(--sp-rw-control-xl);
      --siteplane-expanding-logout-min-open-width: 8.5rem;
      --siteplane-expanding-logout-icon-size: 1.125rem;
      --siteplane-expanding-logout-open-buffer: 2rem;
      --siteplane-expanding-logout-sign-padding-left: 1.25rem;
      --siteplane-expanding-logout-text-padding-right: 0.625rem;
      --siteplane-expanding-logout-text-size: 1rem;
    }

    [data-slot="expanding-logout-button-root"] .siteplane-expanding-logout-slot {
      display: flex;
      width: var(--siteplane-expanding-logout-open-width);
      justify-content: center;
    }

    [data-slot="expanding-logout-button-root"] .siteplane-expanding-logout-sign {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: currentColor;
      transition-property: width, padding-left;
      transition-duration: var(--siteplane-expanding-logout-duration);
      transition-timing-function: var(--motion-ease-soft-in-out);
    }

    [data-slot="expanding-logout-button-root"] .siteplane-expanding-logout-sign svg {
      width: var(--siteplane-expanding-logout-icon-size);
      height: var(--siteplane-expanding-logout-icon-size);
    }

    [data-slot="expanding-logout-button-root"] .siteplane-expanding-logout-label {
      position: absolute;
      right: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 0;
      opacity: 0;
      color: currentColor;
      font-size: var(--siteplane-expanding-logout-text-size);
      font-weight: 600;
      transition-property: opacity, width, padding-right;
      transition-duration: var(--siteplane-expanding-logout-duration);
      transition-timing-function: var(--motion-ease-soft-in-out);
    }

    [data-slot="expanding-logout-button-root"] .siteplane-expanding-logout-button:not(:disabled, [aria-disabled="true"]):is(:hover, :focus-visible) .siteplane-expanding-logout-sign {
      width: var(--siteplane-expanding-logout-sign-hover-width);
      padding-left: var(--siteplane-expanding-logout-sign-padding-left);
    }

    [data-slot="expanding-logout-button-root"] .siteplane-expanding-logout-button:not(:disabled, [aria-disabled="true"]):is(:hover, :focus-visible) .siteplane-expanding-logout-label {
      opacity: 1;
      width: var(--siteplane-expanding-logout-text-hover-width);
      padding-right: var(--siteplane-expanding-logout-text-padding-right);
    }

    :is(html[data-motion-reduce="true"], [data-sp-motion="reduced"]) [data-slot="expanding-logout-button-root"] .siteplane-expanding-logout-sign,
    :is(html[data-motion-reduce="true"], [data-sp-motion="reduced"]) [data-slot="expanding-logout-button-root"] .siteplane-expanding-logout-label {
      transition-duration: 0ms;
    }

    @media (prefers-reduced-motion: reduce) {
      [data-slot="expanding-logout-button-root"] .siteplane-expanding-logout-sign,
      [data-slot="expanding-logout-button-root"] .siteplane-expanding-logout-label {
        transition-duration: 0ms;
      }

    }
  }
`;
