import * as React from "react";

import {
  englishMessages,
  type MessageScrollerLabels,
} from "../../system/locale/messages";
import type {
  MessageScrollerController,
  Scrollable,
} from "./message-scroller-controller";

export type { MessageScrollerLabels };

/** The English words of the scroller (its messages without a provider). */
export const defaultMessageScrollerLabels: MessageScrollerLabels =
  englishMessages.messageScroller;

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
