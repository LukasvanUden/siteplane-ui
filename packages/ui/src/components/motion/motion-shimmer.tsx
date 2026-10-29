import type React from "react";

import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";

export interface MotionShimmerProps extends React.ComponentProps<"span"> {
  /** Whether the highlight sweeps across the text. When false the text shows plain. */
  active?: boolean;
}

/**
 * A highlight that sweeps across live text, such as "Thinking", a step that
 * runs or a file that uploads. The text keeps its colour, so it works on any
 * tone; under reduced motion it stands still at full colour.
 */
export function MotionShimmer({
  active = true,
  className,
  ...props
}: MotionShimmerProps): React.ReactElement {
  return (
    <span
      className={cn(
        slotClass("motion-shimmer", props),
        active && "sp-shimmer",
        className,
      )}
      data-active={active ? "true" : undefined}
      data-slot="motion-shimmer"
      {...props}
    />
  );
}
