"use client";

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import {
  siteplaneUIDefaults,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { baseClass, slotClass } from "../../system/utils/slot-class";
import type { KitToggleProps } from "./toggle-internal";

// The kit stylesheet owns the Toggle's cursor and its disabled fade
// (design-rework.css), so a cursor or opacity utility in `className` wins.
export const toggleVariants = cva(
  "shrink-0 select-none justify-center whitespace-nowrap before:pointer-events-none before:absolute pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 data-pressed:text-accent-foreground [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg]:-mx-0.5 [&_svg]:shrink-0",
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
        // design-rework.css sets the control scale's xl icon and 16 px label.
        xl: "",
      },
      padding: {
        // 12 px at the sides: the [data-padding="comfortable"] rule in
        // design-rework.css.
        comfortable: "",
        default: null,
        icon: "",
      },
      variant: {
        default: "",
        // design-rework.css draws the outline edge as an inset rim.
        outline: "",
      },
    },
  },
);

// ToggleGroup renders its toggles with the internal group profile.
const toggleGroupProfileClassName =
  "focus-visible:z-10 in-data-[orientation=horizontal]:pointer-coarse:after:min-w-auto in-data-[orientation=vertical]:pointer-coarse:after:min-h-auto";

export function Toggle(
  toggleProps: WithStringClassName<TogglePrimitive.Props> &
    VariantProps<typeof toggleVariants> & {
      /**
       * Lifts the icon once each time the toggle turns on: up and back with a
       * slight tilt, for a reaction such as a like. The icon is the toggle's
       * first child; reduced motion keeps it still.
       */
      lift?: boolean;
    },
) {
  // ToggleGroup and the theme toggles pass their internal profiles through
  // KitToggle (toggle-internal.ts), the same function.
  const {
    className,
    lift = false,
    onAnimationEnd,
    onPressedChange,
    padding = "default",
    profile = "default",
    variant,
    size,
    ...props
  } = toggleProps as KitToggleProps;
  const resolvedSize = useResolvedControlSize(size);
  // The lift plays when the toggle turns on, not when it renders pressed, and
  // the attribute clears when it ends, so the next press plays it again
  // (motion.css).
  const [lifting, setLifting] = React.useState(false);
  return (
    <TogglePrimitive
      className={cn(
        slotClass("toggle", props),
        baseClass("toggle", props),
        toggleVariants({ padding, size: resolvedSize, variant }),
        profile === "group" && toggleGroupProfileClassName,
        "sp-toggle-motion",
        className,
      )}
      data-foundation="toggle"
      data-lift={lift ? (lifting ? "on" : "") : undefined}
      data-padding={padding}
      data-profile={profile}
      data-size={resolvedSize}
      data-slot="toggle"
      data-variant={variant ?? "default"}
      onAnimationEnd={(event) => {
        if (event.animationName === "sp-toggle-lift") setLifting(false);
        onAnimationEnd?.(event);
      }}
      onPressedChange={(pressed, eventDetails) => {
        if (lift && pressed) setLifting(true);
        onPressedChange?.(pressed, eventDetails);
      }}
      {...props}
    />
  );
}

export { TogglePrimitive };
