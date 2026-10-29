"use client";

import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import * as React from "react";

import { useSiteplaneUI } from "../../system/provider/siteplane-ui-provider";
import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { announceCopyStatus } from "../action-icons";
import { Button, type ButtonProps } from "../button";
import { MotionItem, MotionList } from "../motion";
import { ScrollArea, type ScrollAreaProps } from "../scroll-area";
import {
  MessageScrollableContext,
  MessageScrollerContext,
  defaultMessageScrollerLabels,
  useMessageScrollerContext,
  type MessageScrollerLabels,
} from "./message-scroller-context";
import {
  MessageScrollerController,
  type Scrollable,
  type ScrollToOptions,
} from "./message-scroller-controller";
import type { ScrollPosition } from "./message-scroller-math";

import "./message-scroller.css";

export type { MessageScrollerLabels };

const noScrollable: Scrollable = { end: false, start: false };

/** How long the shared live region keeps a status, in milliseconds (rulebook T7). */
const statusHold = 2000;

/** Replaces a ref's value, whether it is a callback or an object. */
function setRef<T>(ref: React.Ref<T> | undefined, value: T | null): void {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as React.RefObject<T | null>).current = value;
}

export type MessageScrollerProps = Omit<ScrollAreaProps, "viewportRef"> & {
  /**
   * Whether a growing thread carries the viewport along while the reader is
   * at the live edge. Off by default: nothing moves unless the reader asked
   * it to. Wheel, touch, keys, the scrollbar or a jump release the follow,
   * and scrolling back to the end, or the button, takes it up again.
   */
  autoScroll?: boolean | undefined;
  /**
   * Where the thread opens: at its `end`, at its `start`, or at the last row
   * that starts a turn (`last-anchor`), which falls back to the end when no
   * row does or the turn already fits.
   */
  defaultScrollPosition?: ScrollPosition | undefined;
  /** Replaces the English words of the scroller. */
  labels?: Partial<MessageScrollerLabels> | undefined;
  /** Whether the row the reader looks at stays in place when older rows are added above it. */
  preserveScrollOnPrepend?: boolean | undefined;
  /** How close to an edge counts as being at it, in pixels. */
  scrollEdgeThreshold?: number | undefined;
  /** How much of the row before a new turn stays visible above it, in pixels. */
  scrollPreviousItemPeek?: number | undefined;
};

function scrollableAttribute(
  scrollable: Scrollable,
): "end" | "start end" | "start" | undefined {
  if (scrollable.start && scrollable.end) return "start end";
  if (scrollable.start) return "start";
  if (scrollable.end) return "end";
  return undefined;
}

/**
 * The scroll area of a conversation: the kit ScrollArea, which keeps the
 * reader's place while a reply streams. A new turn settles near the top, a
 * growing thread is followed only while the reader is at the live edge, older
 * rows added above leave the view where it is, and a button leads back to the
 * latest message.
 *
 * Compose it as `MessageScrollerContent` around `MessageScrollerItem`s, with
 * `MessageScrollerButton` after them. The root fills its container, so give
 * that container a height. `data-scrollable` names the edges that can still be
 * scrolled toward (`start`, `end` or both) and `data-autoscrolling` is present
 * while the scroller scrolls on its own.
 */
export function MessageScroller({
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  autoScroll = false,
  children,
  className,
  defaultScrollPosition = "end",
  labels,
  preserveScrollOnPrepend = true,
  scrollEdgeThreshold = 8,
  scrollPreviousItemPeek = 64,
  ...props
}: MessageScrollerProps): React.ReactElement {
  const text: MessageScrollerLabels = {
    ...defaultMessageScrollerLabels,
    ...labels,
  };
  const [scrollable, setScrollable] = React.useState<Scrollable>(noScrollable);
  const behavior = {
    autoScroll,
    defaultScrollPosition,
    preserveScrollOnPrepend,
    scrollEdgeThreshold,
    scrollPreviousItemPeek,
  };
  // The first behavior is the controller's own: the elements attach during
  // the first commit, before any effect of this component has run.
  const [controller] = React.useState(
    () => new MessageScrollerController(behavior, setScrollable),
  );
  React.useLayoutEffect(() => {
    controller.configure({
      autoScroll,
      defaultScrollPosition,
      preserveScrollOnPrepend,
      scrollEdgeThreshold,
      scrollPreviousItemPeek,
    });
  }, [
    autoScroll,
    controller,
    defaultScrollPosition,
    preserveScrollOnPrepend,
    scrollEdgeThreshold,
    scrollPreviousItemPeek,
  ]);

  const setViewport = React.useCallback(
    (element: HTMLDivElement | null) => controller.attachViewport(element),
    [controller],
  );
  // Keyed on the words, not on the object they arrive in, so a labels prop
  // written inline does not render every part again.
  const context = React.useMemo(
    () => ({ controller, labels: text }),
    [
      controller,
      text.complete,
      text.region,
      text.responding,
      text.scrollToEnd,
      text.scrollToStart,
    ],
  );

  return (
    <MessageScrollerContext.Provider value={context}>
      <MessageScrollableContext.Provider value={scrollable}>
        <ScrollArea
          aria-label={ariaLabelledBy ? undefined : (ariaLabel ?? text.region)}
          aria-labelledby={ariaLabelledBy}
          className={cn(
            slotClass("message-scroller", props),
            // The dock's z-index stays inside the scroller.
            "isolate",
            className,
          )}
          data-scrollable={scrollableAttribute(scrollable)}
          data-slot="message-scroller"
          viewportRef={setViewport}
          {...props}
        >
          {children}
        </ScrollArea>
      </MessageScrollableContext.Provider>
    </MessageScrollerContext.Provider>
  );
}

/**
 * Says "Assistant is responding" when a reply starts and "Response complete"
 * when it is done, once each and never for the text that streams in between.
 * The words go to the kit's shared polite live region, the one that says a
 * copy, which exists before the first reply.
 */
function useStatusAnnouncement(
  busy: boolean,
  labels: Pick<MessageScrollerLabels, "complete" | "responding">,
): void {
  React.useEffect(() => {
    announceCopyStatus("", 0)();
  }, []);
  const spoken = React.useRef(false);
  React.useEffect(() => {
    // A thread that is idle when it mounts has no reply to complete.
    if (!busy && !spoken.current) return;
    spoken.current = true;
    return announceCopyStatus(
      busy ? labels.responding : labels.complete,
      statusHold,
    );
  }, [busy, labels.complete, labels.responding]);
}

export type MessageScrollerContentProps = React.ComponentProps<"div"> & {
  /**
   * Whether a reply is on its way. The log is `aria-busy` meanwhile, so a
   * screen reader reads the finished row once instead of each token, and the
   * shared live region says that the assistant is responding and when it is
   * done.
   */
  busy?: boolean | undefined;
};

/**
 * The rows of the thread, as a log: new rows are announced, text that streams
 * into a row is not. Each direct child is a `MessageScrollerItem`.
 */
export function MessageScrollerContent({
  busy,
  children,
  className,
  ref,
  ...props
}: MessageScrollerContentProps): React.ReactElement {
  const { controller, labels } = useMessageScrollerContext(
    "MessageScrollerContent",
  );
  useStatusAnnouncement(Boolean(busy), labels);
  const setContent = React.useCallback(
    (element: HTMLDivElement | null) => {
      controller.attachContent(element);
      setRef(ref, element);
    },
    [controller, ref],
  );
  const setSpacer = React.useCallback(
    (element: HTMLDivElement | null) => controller.attachSpacer(element),
    [controller],
  );

  return (
    <div
      aria-busy={busy || undefined}
      aria-relevant="additions"
      className={cn(
        slotClass("message-scroller-content", props),
        "relative flex min-w-0 flex-col gap-8",
        className,
      )}
      data-slot="message-scroller-content"
      ref={setContent}
      role="log"
      {...props}
    >
      {children}
      {/* The room a turn that settles near the top needs below it; the scroller
          sizes it as the reply grows. */}
      <div
        aria-hidden="true"
        className={cn(
          slotClass("message-scroller-spacer"),
          "pointer-events-none absolute inset-x-0 top-full",
        )}
        data-slot="message-scroller-spacer"
        ref={setSpacer}
      />
    </div>
  );
}

export type MessageScrollerItemProps = React.ComponentProps<"div"> & {
  /** Names the row, to scroll to it and to keep it in place. Keep it stable. */
  messageId: string;
  /** Whether the row starts a turn: when it arrives, it settles near the top. */
  scrollAnchor?: boolean | undefined;
};

/**
 * One row of the thread: a message, a marker, a typing indicator or a "load
 * earlier" row. A row that arrives after the thread opened fades in with a
 * small rise, and takes its full height at once so that the scroller's
 * measurements stay true. Rows far from the viewport skip their rendering
 * work.
 */
export function MessageScrollerItem({
  messageId,
  scrollAnchor,
  className,
  ...props
}: MessageScrollerItemProps): React.ReactElement {
  const { controller } = useMessageScrollerContext("MessageScrollerItem");
  // A row that mounts with the thread is at rest; one that mounts later enters.
  const entering = React.useRef(controller.ready).current;

  return (
    <div
      className={cn(
        slotClass("message-scroller-item", props),
        "min-w-0 wrap-anywhere",
        className,
      )}
      data-entering={entering ? "" : undefined}
      data-message-id={messageId}
      data-scroll-anchor={scrollAnchor ? "" : undefined}
      data-slot="message-scroller-item"
      {...props}
    />
  );
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

export type MessageScrollerButtonProps = DistributiveOmit<
  ButtonProps,
  "children"
> & {
  /** Scrolls to the latest row (`end`, the default) or back to the first one (`start`). */
  direction?: "end" | "start" | undefined;
};

/**
 * The button that leads back to the latest message, or to the first one. It
 * shows only while there is something to scroll toward, and appears and leaves
 * with the kit's presence. Place it after the content, or before it for
 * `direction="start"`; it floats 16 px inside the edge of the scroller. A
 * keyboard user who presses it keeps their place: focus moves to the scroll
 * region as the button leaves.
 */
export function MessageScrollerButton({
  "aria-label": ariaLabel,
  direction = "end",
  onClick,
  ...props
}: MessageScrollerButtonProps): React.ReactElement {
  const { controller, labels } = useMessageScrollerContext(
    "MessageScrollerButton",
  );
  const scrollable = React.useContext(MessageScrollableContext);
  const { controlSize } = useSiteplaneUI();
  const toEnd = direction === "end";
  const Icon = toEnd ? ArrowDownIcon : ArrowUpIcon;

  return (
    // The dock is as tall as the largest control, whatever the button's size,
    // so the presence has no height to follow: the button fades and scales in
    // place (rulebook M2) and nothing around it moves.
    <MotionList
      className={cn(
        "pointer-events-none absolute inset-x-0 z-10 flex h-(--sp-rw-control-xl) justify-center",
        toEnd ? "bottom-4 items-end" : "top-4 items-start",
      )}
      data-direction={direction}
      data-slot="message-scroller-dock"
      layout="flow"
      render={<div />}
    >
      {(toEnd ? scrollable.end : scrollable.start) ? (
        <MotionItem
          className="pointer-events-auto"
          key="button"
          render={<div />}
        >
          <Button
            shape="pill"
            size={`icon-${controlSize}`}
            {...props}
            aria-label={
              ariaLabel ?? (toEnd ? labels.scrollToEnd : labels.scrollToStart)
            }
            data-direction={direction}
            data-slot="message-scroller-button"
            onClick={(event) => {
              onClick?.(event);
              if (event.defaultPrevented) return;
              const focused =
                event.currentTarget ===
                event.currentTarget.ownerDocument.activeElement;
              if (toEnd) controller.scrollToEnd();
              else controller.scrollToStart();
              // The button leaves with the scroll; the keyboard stays on the thread.
              if (focused) controller.focusViewport();
            }}
          >
            <Icon aria-hidden="true" />
          </Button>
        </MotionItem>
      ) : null}
    </MotionList>
  );
}

export type MessageScrollerApi = {
  /** Scrolls to the latest row, and follows the thread from there. */
  scrollToEnd: (options?: ScrollToOptions) => void;
  /** Scrolls to the first row. */
  scrollToStart: (options?: ScrollToOptions) => void;
  /**
   * Scrolls the row named `messageId` to the top, with the peek of the row
   * before it. Returns false when no such row is mounted.
   */
  scrollToMessage: (messageId: string, options?: ScrollToOptions) => boolean;
  /** The edges the viewport can still scroll toward. */
  scrollable: { end: boolean; start: boolean };
};

/**
 * The commands of the nearest MessageScroller, and the edges it can still
 * scroll toward, for a control that lives inside it, such as a jump menu. The
 * commands are stable; the component renders again only when an edge turns
 * scrollable or stops being so.
 */
export function useMessageScroller(): MessageScrollerApi {
  const { controller } = useMessageScrollerContext("useMessageScroller");
  const scrollable = React.useContext(MessageScrollableContext);
  const commands = React.useMemo(
    () => ({
      scrollToEnd: (options?: ScrollToOptions) =>
        controller.scrollToEnd(options),
      scrollToMessage: (messageId: string, options?: ScrollToOptions) =>
        controller.scrollToMessage(messageId, options),
      scrollToStart: (options?: ScrollToOptions) =>
        controller.scrollToStart(options),
    }),
    [controller],
  );
  return React.useMemo(
    () => ({ ...commands, scrollable }),
    [commands, scrollable],
  );
}
