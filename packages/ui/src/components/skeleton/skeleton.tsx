import type React from "react";

import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";

export function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        slotClass("skeleton", props),
        "sp-skeleton-motion animate-skeleton rounded-sm",
        className,
      )}
      data-slot="skeleton"
      {...props}
    />
  );
}
