import type React from "react";

import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";

import "./bubble.css";

export type BubbleVariant =
  "default" | "muted" | "tinted" | "outline" | "ghost" | "destructive";

export type BubbleAlign = "start" | "end";

export type BubbleProps = React.ComponentProps<"div"> & {
  /**
   * The look of the surface. `default` is the accent fill, for the current
   * person's own text; `muted` is the quiet neutral fill; `tinted` is an accent
   * tint; `outline` is the bordered message surface of a Card; `ghost` has no
   * surface and takes the full width, for the assistant's text and rich
   * content; `destructive` marks a failure in the error tint. Pair a tone with
   * words, since color alone does not say what happened.
   */
  variant?: BubbleVariant | undefined;
  /**
   * The side of the conversation the bubble sits on. Inside a Message, give
   * the bubble the Message's `align` as well.
   */
  align?: BubbleAlign | undefined;
};

/**
 * The surface of a message. Bubble places it, up to 80% of the width except for
 * `ghost`, and its BubbleContent draws it. Put avatars, names, timestamps and
 * the actions of a turn in a Message, not in the bubble.
 */
export function Bubble({
  align = "start",
  className,
  variant = "muted",
  ...props
}: BubbleProps): React.ReactElement {
  return (
    <div
      className={cn(slotClass("bubble", props), className)}
      data-align={align}
      data-slot="bubble"
      data-variant={variant}
      {...props}
    />
  );
}

/** The text of a bubble, on the surface that the bubble's variant draws. */
export function BubbleContent({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(slotClass("bubble-content", props), className)}
      data-slot="bubble-content"
      {...props}
    />
  );
}

/**
 * Consecutive bubbles from the same sender. Give each bubble its own `align`.
 */
export function BubbleGroup({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(slotClass("bubble-group", props), className)}
      data-slot="bubble-group"
      {...props}
    />
  );
}
