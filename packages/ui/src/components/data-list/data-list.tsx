import type * as React from "react";

import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";

export type DataListOrientation = "horizontal" | "vertical";

export interface DataListProps extends React.ComponentProps<"dl"> {
  /**
   * Draws the kit's hairline between two items, with 12 px above and below
   * it. The first and the last item keep no space outside their content.
   */
  dividers?: boolean;
  /**
   * `horizontal` (the default) sets each label beside its value, in a label
   * column that all items share. `vertical` sets each label above its value.
   */
  orientation?: DataListOrientation;
}

/**
 * Label and value rows, rendered as a description list (`dl`). In the
 * horizontal orientation the labels share one column: as wide as the widest
 * label, up to 40% of the list, or as wide as `--data-list-label-width` sets
 * it. Long labels and values wrap (rulebook K5). The layout and the text are
 * the rules in design-rework.css.
 */
export function DataList({
  className,
  dividers = false,
  orientation = "horizontal",
  ...props
}: DataListProps): React.ReactElement {
  return (
    <dl
      className={cn(slotClass("data-list", props), className)}
      data-dividers={dividers || undefined}
      data-orientation={orientation}
      data-slot="data-list"
      {...props}
    />
  );
}

/** One row: a `DataListLabel` and its `DataListValue`. */
export function DataListItem({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(slotClass("data-list-item", props), className)}
      data-slot="data-list-item"
      {...props}
    />
  );
}

/** The name of a value, rendered as a `dt`. */
export function DataListLabel({
  className,
  ...props
}: React.ComponentProps<"dt">): React.ReactElement {
  return (
    <dt
      className={cn(slotClass("data-list-label", props), className)}
      data-slot="data-list-label"
      {...props}
    />
  );
}

/**
 * The value of a label, rendered as a `dd`. It holds text or inline parts, such
 * as a Badge, a Code or a link.
 */
export function DataListValue({
  className,
  ...props
}: React.ComponentProps<"dd">): React.ReactElement {
  return (
    <dd
      className={cn(slotClass("data-list-value", props), className)}
      data-slot="data-list-value"
      {...props}
    />
  );
}
