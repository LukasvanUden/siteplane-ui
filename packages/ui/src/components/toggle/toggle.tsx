"use client";

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { cva, type VariantProps } from "class-variance-authority";

import {
  siteplaneUIDefaults,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import { cn, type WithStringClassName } from "../../system/utils/cn";
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
        comfortable: "px-3",
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
    VariantProps<typeof toggleVariants>,
) {
  // ToggleGroup and the theme toggles pass their internal profiles through
  // KitToggle (toggle-internal.ts), the same function.
  const {
    className,
    padding = "default",
    profile = "default",
    variant,
    size,
    ...props
  } = toggleProps as KitToggleProps;
  const resolvedSize = useResolvedControlSize(size);
  return (
    <TogglePrimitive
      className={cn(
        toggleVariants({ padding, size: resolvedSize, variant }),
        profile === "group" && toggleGroupProfileClassName,
        "siteplane-toggle-motion",
        className,
      )}
      data-foundation="toggle"
      data-padding={padding}
      data-profile={profile}
      data-size={resolvedSize}
      data-slot="toggle"
      data-variant={variant ?? "default"}
      {...props}
    />
  );
}

export { TogglePrimitive };
