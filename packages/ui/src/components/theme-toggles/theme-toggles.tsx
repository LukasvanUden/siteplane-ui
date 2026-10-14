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

import "./theme-toggles.css";

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
  const id = idProp ?? `sp-sun-moon-${generatedId.replaceAll(":", "")}`;
  const maskId = `${id}-mask`;
  const resolvedSize = useResolvedControlSize(size);

  return (
    <span
      className={cn(
        "sp-sun-moon-morph-toggle-root",
        "sp-sun-moon-morph-root",
        className,
      )}
      data-size={resolvedSize}
      data-slot="sun-moon-morph-toggle-root"
    >
      <KitToggle
        {...props}
        aria-label={ariaLabel}
        className="sp-sun-moon-morph-toggle"
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
          className="sp-sun-moon-icon opacity-80"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <mask id={maskId}>
            <rect fill="white" height="20" width="20" />
            <circle cx="11" cy="3" fill="black" r="8" />
          </mask>
          <circle
            className="sp-sun-moon-shape"
            cx="10"
            cy="10"
            mask={`url(#${maskId})`}
            r="8"
          />
          <g>
            <circle
              className="sp-sun-moon-ray sp-sun-moon-ray-1"
              cx="18"
              cy="10"
              r="1.5"
            />
            <circle
              className="sp-sun-moon-ray sp-sun-moon-ray-2"
              cx="14"
              cy="16.928"
              r="1.5"
            />
            <circle
              className="sp-sun-moon-ray sp-sun-moon-ray-3"
              cx="6"
              cy="16.928"
              r="1.5"
            />
            <circle
              className="sp-sun-moon-ray sp-sun-moon-ray-4"
              cx="2"
              cy="10"
              r="1.5"
            />
            <circle
              className="sp-sun-moon-ray sp-sun-moon-ray-5"
              cx="6"
              cy="3.172"
              r="1.5"
            />
            <circle
              className="sp-sun-moon-ray sp-sun-moon-ray-6"
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
      className={cn(
        "sp-layered-theme-toggle-root",
        "sp-layered-theme-root",
        className,
      )}
      data-size={resolvedSize}
      data-slot="layered-theme-toggle-root"
    >
      <KitToggle
        {...props}
        aria-label={ariaLabel}
        className="sp-layered-theme-toggle"
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
        <span className="sp-layered-theme-icon sp-layered-theme-moon">
          <MoonIcon aria-hidden="true" className="opacity-80" />
        </span>
        <span className="sp-layered-theme-icon sp-layered-theme-sun">
          <SunIcon aria-hidden="true" className="opacity-80" />
        </span>
      </KitToggle>
    </span>
  );
}
