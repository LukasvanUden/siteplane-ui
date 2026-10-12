import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import type React from "react";

import { cn, type WithStringClassName } from "../../system/utils/cn";
import type { KitSeparatorProps } from "./separator-internal";

export function Separator(
  separatorProps: WithStringClassName<SeparatorPrimitive.Props>,
): React.ReactElement {
  // Group and ToggleGroup pass their internal profiles through KitSeparator
  // (separator-internal.ts), the same function.
  const {
    className,
    orientation = "horizontal",
    profile = "default",
    role = "separator",
    ...props
  } = separatorProps as KitSeparatorProps;
  // The line's colour, thickness and length come from design-rework.css, where
  // the separator, Toolbar and OTP Field rules refine them.
  return (
    <SeparatorPrimitive
      className={cn(
        "shrink-0",
        profile === "toggle-group" &&
          "pointer-events-none relative before:absolute before:inset-0 dark:before:bg-input/32 dark:has-[+[data-foundation=toggle]:hover]:before:bg-input/64 dark:has-[+[data-foundation=toggle][data-pressed]]:before:bg-input dark:[[data-foundation=toggle]:hover+&]:before:bg-input/64 dark:[[data-foundation=toggle][data-pressed]+&]:before:bg-input",
        className,
      )}
      data-foundation="separator"
      data-profile={profile}
      data-slot="separator"
      orientation={orientation}
      {...props}
      role={role}
      aria-orientation={
        role === "presentation" || role === "none"
          ? undefined
          : (props["aria-orientation"] ?? orientation)
      }
    />
  );
}

export { SeparatorPrimitive };
