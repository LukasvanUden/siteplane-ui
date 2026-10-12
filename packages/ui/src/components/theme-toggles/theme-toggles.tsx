"use client";

import { type ComponentProps, type ReactElement, useId } from "react";
import { MoonIcon, SunIcon } from "lucide-react";

import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import { cn } from "../../system/utils/cn";
import { Toggle } from "../toggle";
import { KitToggle } from "../toggle/toggle-internal";

type ThemeToggleInputProps = Omit<
  ComponentProps<typeof Toggle>,
  "children" | "pressed" | "size"
> & {
  /**
   * `true` means dark mode: unpressed shows the sun, pressed shows the moon.
   * The state keeps Toggle's names: `pressed`, `defaultPressed` and
   * `onPressedChange`.
   */
  pressed?: boolean;
  /** @deprecated Use `pressed`. */
  checked?: boolean;
  /** @deprecated Use `defaultPressed`. */
  defaultChecked?: boolean;
  /** @deprecated Use `onPressedChange`. */
  onCheckedChange?: (checked: boolean) => void;
  size?: SiteplaneControlSize;
};

/** Calls `onPressedChange` and the deprecated `onCheckedChange` alias. */
function pressedChangeHandler(
  onPressedChange: ThemeToggleInputProps["onPressedChange"],
  onCheckedChange: ThemeToggleInputProps["onCheckedChange"],
): ThemeToggleInputProps["onPressedChange"] {
  if (!onCheckedChange) return onPressedChange;
  return (pressed, eventDetails) => {
    onPressedChange?.(pressed, eventDetails);
    onCheckedChange(pressed);
  };
}

export type SunMoonMorphToggleProps = ThemeToggleInputProps;

export function SunMoonMorphToggle({
  "aria-label": ariaLabel = "Dark mode",
  checked,
  className,
  defaultChecked,
  defaultPressed = defaultChecked ?? false,
  disabled,
  id: idProp,
  onCheckedChange,
  onPressedChange,
  pressed = checked,
  size,
  ...props
}: SunMoonMorphToggleProps): ReactElement {
  const generatedId = useId();
  const id = idProp ?? `siteplane-sun-moon-${generatedId.replaceAll(":", "")}`;
  const maskId = `${id}-mask`;
  const resolvedSize = useResolvedControlSize(size);

  return (
    <span
      className={cn("siteplane-sun-moon-morph-root", className)}
      data-size={resolvedSize}
      data-slot="sun-moon-morph-toggle-root"
    >
      <style>{sunMoonMorphStyles}</style>
      <KitToggle
        {...props}
        aria-label={ariaLabel}
        className="siteplane-sun-moon-morph-toggle"
        defaultPressed={defaultPressed}
        disabled={disabled}
        id={id}
        onPressedChange={pressedChangeHandler(onPressedChange, onCheckedChange)}
        padding="icon"
        profile="theme"
        pressed={pressed}
        size={resolvedSize}
        variant="default"
      >
        <svg
          aria-hidden="true"
          className="siteplane-sun-moon-icon opacity-80"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <mask id={maskId}>
            <rect fill="white" height="20" width="20" />
            <circle cx="11" cy="3" fill="black" r="8" />
          </mask>
          <circle
            className="siteplane-sun-moon-shape"
            cx="10"
            cy="10"
            mask={`url(#${maskId})`}
            r="8"
          />
          <g>
            <circle
              className="siteplane-sun-moon-ray siteplane-sun-moon-ray-1"
              cx="18"
              cy="10"
              r="1.5"
            />
            <circle
              className="siteplane-sun-moon-ray siteplane-sun-moon-ray-2"
              cx="14"
              cy="16.928"
              r="1.5"
            />
            <circle
              className="siteplane-sun-moon-ray siteplane-sun-moon-ray-3"
              cx="6"
              cy="16.928"
              r="1.5"
            />
            <circle
              className="siteplane-sun-moon-ray siteplane-sun-moon-ray-4"
              cx="2"
              cy="10"
              r="1.5"
            />
            <circle
              className="siteplane-sun-moon-ray siteplane-sun-moon-ray-5"
              cx="6"
              cy="3.172"
              r="1.5"
            />
            <circle
              className="siteplane-sun-moon-ray siteplane-sun-moon-ray-6"
              cx="14"
              cy="3.172"
              r="1.5"
            />
          </g>
        </svg>
      </KitToggle>
    </span>
  );
}

export type LayeredThemeToggleProps = ThemeToggleInputProps;

export function LayeredThemeToggle({
  "aria-label": ariaLabel = "Dark mode",
  checked,
  className,
  defaultChecked,
  defaultPressed = defaultChecked ?? false,
  disabled,
  id: idProp,
  onCheckedChange,
  onPressedChange,
  pressed = checked,
  size,
  ...props
}: LayeredThemeToggleProps): ReactElement {
  const resolvedSize = useResolvedControlSize(size);

  return (
    <span
      className={cn("siteplane-layered-theme-root", className)}
      data-size={resolvedSize}
      data-slot="layered-theme-toggle-root"
    >
      <style>{layeredThemeToggleStyles}</style>
      <KitToggle
        {...props}
        aria-label={ariaLabel}
        className="siteplane-layered-theme-toggle"
        defaultPressed={defaultPressed}
        disabled={disabled}
        id={idProp}
        onPressedChange={pressedChangeHandler(onPressedChange, onCheckedChange)}
        padding="icon"
        profile="theme"
        pressed={pressed}
        size={resolvedSize}
        variant="default"
      >
        <span className="siteplane-layered-theme-icon siteplane-layered-theme-moon">
          <MoonIcon aria-hidden="true" className="opacity-80" />
        </span>
        <span className="siteplane-layered-theme-icon siteplane-layered-theme-sun">
          <SunIcon aria-hidden="true" className="opacity-80" />
        </span>
      </KitToggle>
    </span>
  );
}

const sunMoonMorphStyles = `
  @layer siteplane {
    [data-slot="sun-moon-morph-toggle-root"] {
      --siteplane-sun-moon-icon-size: 1.5625rem;
      display: inline-flex;
    }

    [data-slot="sun-moon-morph-toggle-root"] .siteplane-sun-moon-morph-toggle {
      position: relative;
      display: grid;
      place-items: center;
    }

    [data-slot="sun-moon-morph-toggle-root"][data-size="sm"] {
      --siteplane-sun-moon-icon-size: 1.375rem;
    }

    [data-slot="sun-moon-morph-toggle-root"][data-size="md"] {
      --siteplane-sun-moon-icon-size: 1.5625rem;
    }

    [data-slot="sun-moon-morph-toggle-root"][data-size="lg"] {
      --siteplane-sun-moon-icon-size: 1.6875rem;
    }

    [data-slot="sun-moon-morph-toggle-root"][data-size="xl"] {
      --siteplane-sun-moon-icon-size: 1.9375rem;
    }

    @media (min-width: 640px) {
      [data-slot="sun-moon-morph-toggle-root"] {
        --siteplane-sun-moon-icon-size: 1.375rem;
      }

      [data-slot="sun-moon-morph-toggle-root"][data-size="sm"] {
        --siteplane-sun-moon-icon-size: 1.25rem;
      }

      [data-slot="sun-moon-morph-toggle-root"][data-size="md"] {
        --siteplane-sun-moon-icon-size: 1.375rem;
      }

      [data-slot="sun-moon-morph-toggle-root"][data-size="lg"] {
        --siteplane-sun-moon-icon-size: 1.5625rem;
      }

      [data-slot="sun-moon-morph-toggle-root"][data-size="xl"] {
        --siteplane-sun-moon-icon-size: 1.6875rem;
      }
    }

    /* Unpressed (light mode) shows the sun. */
    [data-slot="sun-moon-morph-toggle-root"] .siteplane-sun-moon-icon {
      position: absolute;
      width: var(--siteplane-sun-moon-icon-size);
      height: var(--siteplane-sun-moon-icon-size);
      pointer-events: none;
      transform: rotate(90deg);
      transition: transform var(--motion-duration-linger) var(--motion-ease-soft-in-out);
    }

    [data-slot="sun-moon-morph-toggle-root"] .siteplane-sun-moon-shape {
      transform-origin: center;
      transform: scale(0.55);
      transition: transform var(--motion-duration-linger) var(--motion-ease-soft-in-out);
    }

    [data-slot="sun-moon-morph-toggle-root"] mask circle {
      transform: translate(16px, -3px);
      transition: transform var(--motion-duration-linger) var(--motion-ease-standard);
    }

    /* Rays burst out in sequence when the sun returns. Transitions, unlike a
     * keyframe animation, do not replay when a toggle mounts. */
    [data-slot="sun-moon-morph-toggle-root"] .siteplane-sun-moon-ray {
      transform-origin: center;
      transform: scale(1);
      transition: transform var(--motion-duration-linger) var(--motion-ease-standard);
    }

    [data-slot="sun-moon-morph-toggle-root"] .siteplane-sun-moon-ray-2 {
      transition-delay: calc(var(--motion-duration-micro) / 2);
    }

    [data-slot="sun-moon-morph-toggle-root"] .siteplane-sun-moon-ray-3 {
      transition-delay: var(--motion-duration-micro);
    }

    [data-slot="sun-moon-morph-toggle-root"] .siteplane-sun-moon-ray-4 {
      transition-delay: var(--motion-duration-fast);
    }

    [data-slot="sun-moon-morph-toggle-root"] .siteplane-sun-moon-ray-5 {
      transition-delay: var(--motion-duration-base);
    }

    [data-slot="sun-moon-morph-toggle-root"] .siteplane-sun-moon-ray-6 {
      transition-delay: var(--motion-duration-moderate);
    }

    /* Pressed (dark mode) shows the moon. */
    [data-slot="sun-moon-morph-toggle-root"] .siteplane-sun-moon-morph-toggle[data-pressed] svg {
      color: inherit;
      transform: rotate(40deg);
    }

    [data-slot="sun-moon-morph-toggle-root"] .siteplane-sun-moon-morph-toggle[data-pressed] svg mask circle {
      transform: translate(0, 0);
    }

    [data-slot="sun-moon-morph-toggle-root"] .siteplane-sun-moon-morph-toggle[data-pressed] svg .siteplane-sun-moon-shape {
      transform: scale(1);
    }

    /* Rays retract together into the growing disc. */
    [data-slot="sun-moon-morph-toggle-root"] .siteplane-sun-moon-morph-toggle[data-pressed] svg .siteplane-sun-moon-ray {
      transform: scale(0);
      transition-delay: 0ms;
      transition-duration: var(--motion-duration-base);
      transition-timing-function: var(--motion-ease-soft-in-out);
    }

    html[data-motion-reduce="true"] [data-slot="sun-moon-morph-toggle-root"] :is(.siteplane-sun-moon-icon, .siteplane-sun-moon-shape, .siteplane-sun-moon-ray, mask circle),
    :where([data-sp-motion="reduced"]) [data-slot="sun-moon-morph-toggle-root"] :is(.siteplane-sun-moon-icon, .siteplane-sun-moon-shape, .siteplane-sun-moon-ray, mask circle) {
      transition-delay: 0ms !important;
      transition-duration: 0ms !important;
    }

    @media (prefers-reduced-motion: reduce) {
      [data-slot="sun-moon-morph-toggle-root"] :is(.siteplane-sun-moon-icon, .siteplane-sun-moon-shape, .siteplane-sun-moon-ray, mask circle) {
        transition-delay: 0ms !important;
        transition-duration: 0ms !important;
      }
    }
  }
`;

const layeredThemeToggleStyles = `
  @layer siteplane {
    [data-slot="layered-theme-toggle-root"] {
      --siteplane-layered-theme-icon-size: 1.375rem;
      display: inline-flex;
    }

    [data-slot="layered-theme-toggle-root"] .siteplane-layered-theme-toggle {
      position: relative;
      display: grid;
      place-items: center;
      line-height: 1;
    }

    [data-slot="layered-theme-toggle-root"][data-size="sm"] {
      --siteplane-layered-theme-icon-size: 1.25rem;
    }

    [data-slot="layered-theme-toggle-root"][data-size="md"] {
      --siteplane-layered-theme-icon-size: 1.375rem;
    }

    [data-slot="layered-theme-toggle-root"][data-size="lg"] {
      --siteplane-layered-theme-icon-size: 1.5rem;
    }

    [data-slot="layered-theme-toggle-root"][data-size="xl"] {
      --siteplane-layered-theme-icon-size: 1.625rem;
    }

    @media (min-width: 640px) {
      [data-slot="layered-theme-toggle-root"] {
        --siteplane-layered-theme-icon-size: 1.25rem;
      }

      [data-slot="layered-theme-toggle-root"][data-size="sm"] {
        --siteplane-layered-theme-icon-size: 1.125rem;
      }

      [data-slot="layered-theme-toggle-root"][data-size="md"] {
        --siteplane-layered-theme-icon-size: 1.25rem;
      }

      [data-slot="layered-theme-toggle-root"][data-size="lg"] {
        --siteplane-layered-theme-icon-size: 1.375rem;
      }

      [data-slot="layered-theme-toggle-root"][data-size="xl"] {
        --siteplane-layered-theme-icon-size: 1.5rem;
      }
    }

    [data-slot="layered-theme-toggle-root"] .siteplane-layered-theme-icon {
      grid-column: 1;
      grid-row: 1;
      line-height: 0.1;
      transform: rotate(0deg) scale(1);
      transition: transform var(--motion-duration-moderate) var(--motion-ease-soft-in-out);
    }

    [data-slot="layered-theme-toggle-root"] .siteplane-layered-theme-icon svg {
      width: var(--siteplane-layered-theme-icon-size);
      height: var(--siteplane-layered-theme-icon-size);
    }

    /* The sun while unpressed (light mode), the moon while pressed (dark mode). */
    [data-slot="layered-theme-toggle-root"] .siteplane-layered-theme-moon {
      transform: rotate(0deg) scale(0);
    }

    [data-slot="layered-theme-toggle-root"] .siteplane-layered-theme-toggle[data-pressed] .siteplane-layered-theme-moon {
      transform: rotate(360deg) scale(1);
    }

    [data-slot="layered-theme-toggle-root"] .siteplane-layered-theme-toggle[data-pressed] .siteplane-layered-theme-sun {
      transform: rotate(360deg) scale(0);
    }

    html[data-motion-reduce="true"] [data-slot="layered-theme-toggle-root"] .siteplane-layered-theme-icon,
    :where([data-sp-motion="reduced"]) [data-slot="layered-theme-toggle-root"] .siteplane-layered-theme-icon {
      transition-duration: 0ms;
    }

    @media (prefers-reduced-motion: reduce) {
      [data-slot="layered-theme-toggle-root"] .siteplane-layered-theme-icon {
        transition-duration: 0ms;
      }

    }
  }
`;
