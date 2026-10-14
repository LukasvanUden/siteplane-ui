import type * as React from "react";

import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";

const kbdClassName =
  "pointer-events-none inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-sans [&_svg:not([class*='size-'])]:size-3";

export function Kbd({
  className,
  ...props
}: React.ComponentProps<"kbd">): React.ReactElement {
  return (
    <kbd
      className={cn(slotClass("kbd", props), kbdClassName, className)}
      data-slot="kbd"
      {...props}
    />
  );
}

export function KbdGroup({
  className,
  ...props
}: React.ComponentProps<"kbd">): React.ReactElement {
  return (
    <kbd
      className={cn(
        slotClass("kbd-group", props),
        "inline-flex shrink-0 items-center whitespace-nowrap",
        className,
      )}
      data-slot="kbd-group"
      {...props}
    />
  );
}
