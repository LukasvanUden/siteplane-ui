import type * as React from "react";

import { cn } from "../utils/cn";
import { slotClass } from "../utils/slot-class";

/** The direction in which the three dots of an OverflowGlyph run. */
export type OverflowGlyphOrientation = "horizontal" | "vertical";

export type OverflowGlyphProps = React.ComponentProps<"svg"> & {
  /** `horizontal` (the default) or `vertical`. */
  orientation?: OverflowGlyphOrientation | undefined;
};

/**
 * Phosphor's three dots in the Bold weight, `DotsThree` and
 * `DotsThreeVertical`, in the 256-unit box: dots 32 units across, so 2.5 px at
 * 20 px. They are drawn here, as the Select caret and the CloseGlyph are, so
 * the base files that the Breadcrumb shares need no icon package.
 */
const dots: Record<OverflowGlyphOrientation, string> = {
  horizontal:
    "M144,128a16,16,0,1,1-16-16A16,16,0,0,1,144,128ZM60,112a16,16,0,1,0,16,16A16,16,0,0,0,60,112Zm136,0a16,16,0,1,0,16,16A16,16,0,0,0,196,112Z",
  vertical:
    "M112,60a16,16,0,1,1,16,16A16,16,0,0,1,112,60Zm16,52a16,16,0,1,0,16,16A16,16,0,0,0,128,112Zm0,68a16,16,0,1,0,16,16A16,16,0,0,0,128,180Z",
};

/**
 * The three dots of every trigger that opens more actions, such as the menu
 * of a table row, a list row, a card or the levels a Breadcrumb leaves out:
 * Phosphor's dots in the Bold weight, 20 px at every size, in a bare inline
 * action as in a ghost icon Button (the rule of `sp-overflow-glyph` in
 * design-rework.css; rulebook I3 and I10, Lukas, 3 November 2026: overflow
 * dots in Bold at 20 px). The dots take the colour of the trigger. They are
 * hidden from assistive technology, so the trigger's `aria-label` names its
 * action.
 */
export function OverflowGlyph({
  className,
  orientation = "horizontal",
  ...props
}: OverflowGlyphProps): React.ReactElement {
  return (
    <svg
      aria-hidden="true"
      data-orientation={orientation}
      data-slot="overflow-glyph"
      fill="currentColor"
      height="1em"
      viewBox="0 0 256 256"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      className={cn(slotClass("overflow-glyph", props), className)}
    >
      <path d={dots[orientation]} />
    </svg>
  );
}
