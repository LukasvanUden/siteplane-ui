import type React from "react";

import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";

export type SkeletonShape = "circle" | "default";

export interface SkeletonProps extends React.ComponentProps<"div"> {
  /**
   * `circle` rounds the placeholder fully, for an avatar or a status dot in a
   * square box; `default` keeps the kit's small corner (design-rework.css).
   * The box's size stays the consumer's.
   */
  shape?: SkeletonShape | undefined;
}

export function Skeleton({
  className,
  shape = "default",
  ...props
}: SkeletonProps): React.ReactElement {
  return (
    <div
      className={cn(
        slotClass("skeleton", props),
        "sp-skeleton-motion animate-skeleton",
        className,
      )}
      data-shape={shape}
      data-slot="skeleton"
      {...props}
    />
  );
}
