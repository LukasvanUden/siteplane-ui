import type React from "react";

import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";

import "./message.css";

export type MessageAlign = "start" | "end";

export type MessageProps = React.ComponentProps<"div"> & {
  /**
   * The side of the conversation the turn belongs to: `start` for the other
   * party or the assistant, `end` for the person who is writing. The avatar,
   * the content and the footer follow it; the header stays at the start.
   * Give a Bubble in the turn the same `align`.
   */
  align?: MessageAlign | undefined;
};

/**
 * One turn of a conversation: an avatar column beside a content column that
 * holds a header, the bubbles or other content, and a footer. The stylesheet
 * (message.css) places the parts; the text surface is a Bubble and the scroll
 * region around the turns is a Message Scroller.
 */
export function Message({
  align = "start",
  className,
  ...props
}: MessageProps): React.ReactElement {
  return (
    <div
      className={cn(slotClass("message", props), className)}
      data-align={align}
      data-slot="message"
      {...props}
    />
  );
}

/**
 * Consecutive turns from the same sender. Give the earlier turns an empty
 * `MessageAvatar`, so that their content lines up with the turn that shows the
 * avatar.
 */
export function MessageGroup({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(slotClass("message-group", props), className)}
      data-slot="message-group"
      {...props}
    />
  );
}

/**
 * The avatar column. It ends with the last bubble, above the footer when there
 * is one, and the turn grows to fit an avatar taller than the content. It
 * keeps its width when it is empty. An absent `MessageAvatar` leaves no column
 * behind.
 */
export function MessageAvatar({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(slotClass("message-avatar", props), className)}
      data-slot="message-avatar"
      {...props}
    />
  );
}

/** A line above the content, such as the sender's name. It stays at the start. */
export function MessageHeader({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(slotClass("message-header", props), className)}
      data-slot="message-header"
      {...props}
    />
  );
}

/** The content column: the header, the bubbles or other content, and the footer. */
export function MessageContent({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(slotClass("message-content", props), className)}
      data-slot="message-content"
      {...props}
    />
  );
}

/**
 * A line under the content: a status such as "Delivered", or the actions of
 * the turn. It follows the side of the message. Icon-only actions need an
 * `aria-label` each.
 */
export function MessageFooter({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(slotClass("message-footer", props), className)}
      data-slot="message-footer"
      {...props}
    />
  );
}
