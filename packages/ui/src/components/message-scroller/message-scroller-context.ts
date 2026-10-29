import * as React from "react";

import type {
  MessageScrollerController,
  Scrollable,
} from "./message-scroller-controller";

/** The words a Message Scroller shows and speaks. */
export type MessageScrollerLabels = {
  /** The name of the scrolling region. */
  region: string;
  /** The name of the button that scrolls to the latest message. */
  scrollToEnd: string;
  /** The name of the button that scrolls to the first message. */
  scrollToStart: string;
  /** Said once when a reply starts, not for each token. */
  responding: string;
  /** Said once when the reply is complete. */
  complete: string;
};

export const defaultMessageScrollerLabels: MessageScrollerLabels = {
  complete: "Response complete",
  region: "Messages",
  responding: "Assistant is responding",
  scrollToEnd: "Scroll to latest",
  scrollToStart: "Scroll to first",
};

/** What the parts need from the scroller; it changes only with the words. */
export type MessageScrollerContextValue = {
  controller: MessageScrollerController;
  labels: MessageScrollerLabels;
};

export const MessageScrollerContext: React.Context<MessageScrollerContextValue | null> =
  React.createContext<MessageScrollerContextValue | null>(null);

/**
 * The edges the viewport can still scroll toward. It sits in a context of its
 * own: rows read the scroller but not this, so they do not render when the
 * flags change.
 */
export const MessageScrollableContext: React.Context<Scrollable> =
  React.createContext<Scrollable>({ end: false, start: false });

export function useMessageScrollerContext(
  part: string,
): MessageScrollerContextValue {
  const context = React.useContext(MessageScrollerContext);
  if (!context)
    throw new Error(`${part} must be rendered inside MessageScroller.`);
  return context;
}
