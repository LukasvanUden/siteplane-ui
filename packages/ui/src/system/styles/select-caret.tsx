import type * as React from "react";

import { cn } from "../utils/cn";
import { slotClass } from "../utils/slot-class";

/**
 * The caret of every select of the kit: the Select trigger's and the Native
 * Select's, so a native select beside a Select ends in the same glyph. It is
 * Phosphor's CaretDown in the Regular weight, the drawing of every trigger
 * chevron of the kit (Lukas, 3 November 2026; it was a narrower drawing of
 * the kit's own), drawn here so that the base files need no icon package.
 * The part that holds it (`sp-select-icon`, design-rework.css) places it as a
 * trailing icon of the field and sizes it, 16 px at every size (I3), and it
 * turns with every trigger chevron ("Trigger chevrons").
 */
export function SelectCaretIcon(
  props: React.ComponentProps<"svg">,
): React.ReactElement {
  return (
    <svg
      aria-hidden="true"
      data-slot="select-caret"
      fill="currentColor"
      height="24"
      viewBox="0 0 256 256"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      className={cn(slotClass("select-caret", props), props.className)}
    >
      <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z" />
    </svg>
  );
}
