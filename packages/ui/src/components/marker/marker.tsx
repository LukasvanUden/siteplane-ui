import type React from "react";

import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { Separator } from "../separator";

import "./marker.css";

export type MarkerVariant = "default" | "border" | "separator";

export type MarkerProps = React.ComponentProps<"div"> & {
  /**
   * `default` is an inline line of status or notes; `border` adds a bottom
   * border under the row; `separator` puts the content between two divider
   * lines, for a date, a section break or a checkpoint.
   */
  variant?: MarkerVariant | undefined;
};

/**
 * A line in a conversation that is not a message: a live status, a system
 * note, a labeled divider or a checkpoint. It has no role by default; pass
 * `role="status"` for a live status line. A divider that carries a label needs
 * no role, so the label is read as text.
 */
export function Marker({
  children,
  className,
  variant = "default",
  ...props
}: MarkerProps): React.ReactElement {
  return (
    <div
      className={cn(slotClass("marker", props), className)}
      data-slot="marker"
      data-variant={variant}
      {...props}
    >
      {variant === "separator" ? (
        <>
          {/* The lines are decoration; the label between them is the content. */}
          <Separator role="presentation" />
          <span className="sp-marker-center">{children}</span>
          <Separator role="presentation" />
        </>
      ) : (
        children
      )}
    </div>
  );
}

/** A decorative icon before the content. It is hidden from assistive technology. */
export function MarkerIcon({
  className,
  ...props
}: React.ComponentProps<"span">): React.ReactElement {
  return (
    <span
      aria-hidden="true"
      className={cn(slotClass("marker-icon", props), className)}
      data-slot="marker-icon"
      {...props}
    />
  );
}

/**
 * The text of the marker. Put an action, such as a Button, beside it in the
 * Marker.
 */
export function MarkerContent({
  className,
  ...props
}: React.ComponentProps<"span">): React.ReactElement {
  return (
    <span
      className={cn(slotClass("marker-content", props), className)}
      data-slot="marker-content"
      {...props}
    />
  );
}
