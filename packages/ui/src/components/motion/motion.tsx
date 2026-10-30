"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import {
  AnimatePresence,
  MotionConfig,
  PresenceContext,
  useIsPresent,
  usePresence,
} from "motion/react";
import * as React from "react";

import { useReducedMotionPreference } from "../../system/motion/use-reduced-motion-preference";
import { useSiteplaneNonce } from "../../system/provider/siteplane-ui-provider";
import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { swapContainerClassName, useHeightFollower } from "./motion-follow";
import {
  GlideOnChange,
  leavingProps,
  measureSwapTiming,
  swapPresence,
  toMotionElement,
  useLeavingEntries,
  usePresenceMotion,
  type MotionLayout,
  type SwapTiming,
} from "./motion-presence";

export type { MotionLayout };
// Components whose panes stay mounted while they leave (Tabs) take their pin
// and height follow from useLeavingPane (motion-follow) and their switch rule
// from panelSwitchClassName (motion-presence). Both are kit internals, imported
// by file path, not part of the public Motion API.

type NativeProps<Tag extends "div" | "li" | "ul"> = Omit<
  React.ComponentPropsWithRef<Tag>,
  // Motion owns these handlers; React's versions have a different signature.
  "onAnimationStart" | "onDrag" | "onDragEnd" | "onDragStart"
>;

type MotionEntryValue = {
  /** The entry holds a MotionItem, which plays the exit. */
  claim: () => void;
  /** Whether no other item follows, so no space is needed after it. */
  last: boolean;
  /** The item has left the list and plays its exit. */
  leaving: boolean;
  /** The exit is over: drop the entry. */
  remove: () => void;
};

const MotionEntryContext = React.createContext<MotionEntryValue | null>(null);

/**
 * Presence that takes a leaving child out of the flow while it plays its exit.
 * Motion pins that child with a `<style>` element; under a Content Security
 * Policy with nonces it carries the provider's nonce. MotionConfig merges with
 * any MotionConfig of the application around it, so its transition and
 * reduced-motion settings still apply.
 */
function PopLayoutPresence({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const nonce = useSiteplaneNonce();
  const presence = (
    <AnimatePresence initial={false} mode="popLayout">
      {children}
    </AnimatePresence>
  );
  return nonce ? (
    <MotionConfig nonce={nonce}>{presence}</MotionConfig>
  ) : (
    presence
  );
}

/**
 * What a stack item knows about its place in the list. A leaving item stays in
 * the list until its exit has played, right after the item it followed.
 */
function MotionEntry({
  children,
  entryKey,
  last,
  leaving,
  onGone,
}: {
  children: React.ReactNode;
  entryKey: React.Key;
  last: boolean;
  leaving: boolean;
  onGone: (key: React.Key) => void;
}): React.ReactElement {
  const claimed = React.useRef(false);
  const value = React.useMemo<MotionEntryValue>(
    () => ({
      claim: () => {
        claimed.current = true;
      },
      last,
      leaving,
      remove: () => onGone(entryKey),
    }),
    [entryKey, last, leaving, onGone],
  );
  // Without a MotionItem there is no exit to play: the entry goes at once.
  React.useLayoutEffect(() => {
    if (leaving && !claimed.current) onGone(entryKey);
  }, [entryKey, leaving, onGone]);
  return (
    <MotionEntryContext.Provider value={value}>
      {children}
    </MotionEntryContext.Provider>
  );
}

type MotionListContextValue = {
  gap: boolean;
  layout: MotionLayout;
  /** True from the list's first frame: items that mount later animate in. */
  mounted: React.RefObject<boolean>;
  reduced: boolean;
  separator: React.ReactNode;
};

const MotionListContext = React.createContext<MotionListContextValue | null>(
  null,
);

function useMotionList(part: string): MotionListContextValue {
  const context = React.useContext(MotionListContext);
  if (!context) throw new Error(`${part} must be rendered inside MotionList.`);
  return context;
}

export interface MotionListProps extends useRender.ComponentProps<"ul"> {
  /**
   * `stack` (default) is for vertical lists: an item expands from height 0 and
   * fades in, leaves by fading and collapsing, and the items below glide.
   * `flow` is for wrapping or horizontal sets such as chips, tags and tiles: an
   * item fades and scales slightly and its siblings glide to their new place.
   */
  layout?: MotionLayout;
  /**
   * The space between the items of a `stack`, in steps of the spacing scale (3
   * is 12 px). There is none above the first item or below the last. It opens
   * with an item that is added after another and closes when an item becomes
   * the last, together with that item's own expand or collapse. A CSS `gap` on
   * the list would leave a hole that closes only after the item has left. In
   * `flow` set the spacing with CSS `gap` instead.
   */
  gap?: number;
  /**
   * Drawn in the space between two items, such as a divider or a connecting
   * line, and shown and hidden with it. Needs `gap`. The content may be
   * positioned against the item (it is the item's positioning context if the
   * item is `relative`) or lay out inside the space.
   */
  separator?: React.ReactNode;
  /**
   * `flow` only: the element whose height follows when a row of items appears
   * or goes, so what is below it glides instead of jumping. It is the list
   * itself by default. A list that is `display: contents` has no box of its
   * own: pass the element that wraps its items.
   */
  container?: React.RefObject<HTMLElement | null> | undefined;
}

/**
 * A list whose items animate in, out and into their new place. Children are
 * `MotionItem`s with a stable `key`. Owns the presence for the whole kit.
 */
export function MotionList({
  children,
  className,
  container,
  gap,
  layout = "stack",
  render,
  separator,
  ...props
}: MotionListProps): React.ReactElement {
  const listRef = React.useRef<HTMLUListElement>(null);
  const reduced = useReducedMotionPreference();
  const stack = layout === "stack";
  const present = React.Children.toArray(children).filter(React.isValidElement);
  const { entries, remove } = useLeavingEntries(present, stack && !reduced);
  // Items glide to their new place when the set or the order of keys changes.
  const layoutDependency = present.map((child) => String(child.key)).join("|");
  // The items of the first frame are at rest; items that come later animate
  // in. A collection that renders its items one commit after the list, as
  // React Aria's do, renders them before that frame, so they are at rest too.
  const mounted = React.useRef(false);
  React.useEffect(() => {
    if (typeof requestAnimationFrame === "undefined") {
      mounted.current = true;
      return;
    }
    const frame = requestAnimationFrame(() => {
      mounted.current = true;
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // A flow list moves its container's height when a row appears or goes. The
  // items of a stack bring their own height, so nothing else has to follow.
  const followed = container ?? listRef;
  const follow = useHeightFollower(followed, !stack);
  const settled = React.useRef(layoutDependency);
  React.useLayoutEffect(() => {
    if (settled.current === layoutDependency) return;
    settled.current = layoutDependency;
    if (stack) return;
    follow();
  }, [follow, layoutDependency, stack]);
  const hasGap = stack && gap !== undefined && gap > 0;
  const context = React.useMemo<MotionListContextValue>(
    () => ({
      gap: hasGap,
      layout,
      mounted,
      reduced,
      separator,
    }),
    [hasGap, layout, reduced, separator],
  );

  const defaultProps = {
    children: (
      <>
        {stack ? (
          entries.map((entry) => (
            <MotionEntry
              entryKey={entry.key}
              key={entry.key}
              last={entry.last}
              leaving={entry.leaving}
              onGone={remove}
            >
              {entry.element}
            </MotionEntry>
          ))
        ) : (
          // A leaving item is taken out of the flow and positioned from the
          // list.
          <PopLayoutPresence>{present}</PopLayoutPresence>
        )}
        {/* After the items, whose presence has started by then: an item that
            enters a stack takes no height yet, so the others do not move. */}
        <GlideOnChange
          change={layoutDependency}
          origin={() => followed.current}
          parts={() => listItems(listRef.current)}
          reduced={reduced}
        />
      </>
    ),
    className: cn(
      slotClass("motion-list", props, render),
      !stack && "relative",
      className,
    ),
    "data-layout": layout,
    "data-slot": "motion-list",
    style: hasGap
      ? ({
          "--sp-motion-gap": `calc(var(--spacing) * ${gap})`,
        } as React.CSSProperties)
      : undefined,
  };
  const element = useRender({
    defaultTagName: "ul",
    props: mergeProps<"ul">(defaultProps, props),
    ref: listRef,
    render,
  });

  return (
    <MotionListContext.Provider value={context}>
      {element}
    </MotionListContext.Provider>
  );
}

/** The elements of a list's items: its children in the DOM. */
function listItems(list: HTMLElement | null): HTMLElement[] {
  return list
    ? [...list.children].filter(
        (child): child is HTMLElement => child instanceof HTMLElement,
      )
    : [];
}

export interface MotionItemProps extends NativeProps<"li"> {
  /**
   * Replaces the element, `li` by default. Pass an element (`<div />`) or a
   * component element (`<Row />`) that forwards its ref; it gains the motion
   * behavior. The element is the clipping box of a `stack` item, so give it no
   * padding or border and put those on the content inside.
   */
  render?: React.ReactElement;
}

/**
 * One entry of a `MotionList`. Give it a stable `key`. While it leaves, it is
 * inert and hidden from assistive technology.
 */
export function MotionItem({
  children,
  className,
  render,
  ...props
}: MotionItemProps): React.ReactElement {
  const list = useMotionList("MotionItem");
  const entry = React.useContext(MotionEntryContext);
  const ref = React.useRef<HTMLLIElement>(null);
  const stack = list.layout === "stack";
  // A stack keeps its leaving items itself (MotionEntry) and collapses them; a
  // flow list holds them in AnimatePresence, out of the flow, until their exit
  // has played. A stack item never holds the presence of a swap or a reveal
  // around it, but it is inert while that presence leaves.
  const inPresence = useIsPresent();
  const [inFlow, safeToRemove] = usePresence(!stack);
  const shown = stack ? !entry?.leaving : inFlow;
  const present = shown && inPresence;
  // The items of the first render are at rest; later ones animate in.
  const appear = React.useRef(list.mounted.current).current;
  const claim = entry?.claim;
  React.useLayoutEffect(() => {
    claim?.();
  }, [claim]);
  usePresenceMotion(ref, stack ? "height" : "scale", {
    appear,
    onGone: stack ? entry?.remove : (safeToRemove ?? undefined),
    present: shown,
    reduced: list.reduced,
  });

  const defaultProps = {
    ...leavingProps(present, list.reduced),
    // The space after the item is a block inside it, so it collapses with the
    // item, and it is open only while another item follows.
    children:
      stack && list.gap ? (
        <>
          {children}
          <MotionReveal data-slot="motion-gap" open={!(entry?.last ?? true)}>
            <div aria-hidden="true" className="h-(--sp-motion-gap)" />
            {list.separator}
          </MotionReveal>
        </>
      ) : (
        children
      ),
    // The render element keeps its own props as a motion element, a data-slot
    // among them.
    className: cn(
      slotClass("motion-item", props, render),
      stack && "flow-root",
      className,
    ),
    "data-layout": list.layout,
    "data-slot": "motion-item",
  };

  return useRender({
    defaultTagName: "li",
    props: mergeProps<"li">(defaultProps, props),
    ref,
    render,
  });
}

export interface MotionRevealProps extends NativeProps<"div"> {
  /** Shows the block. It expands with a fade; hiding collapses it. */
  open: boolean;
  /**
   * Replaces the element, `div` by default. It is the clipping box, so give it
   * no padding or border and put those on the content inside.
   */
  render?: React.ReactElement;
}

/**
 * One block that shows or hides with `open`, for messages, field errors,
 * alerts and save bars. Nothing is rendered while it is closed, so it adds no
 * space to the layout around it.
 */
export function MotionReveal({
  children,
  open,
  ...props
}: MotionRevealProps): React.ReactElement {
  return (
    <AnimatePresence initial={false}>
      {open ? (
        <MotionRevealPanel key="panel" {...props}>
          {children}
        </MotionRevealPanel>
      ) : null}
    </AnimatePresence>
  );
}

function MotionRevealPanel({
  children,
  className,
  render,
  ...props
}: Omit<MotionRevealProps, "open">): React.ReactElement {
  const [present, safeToRemove] = usePresence();
  const reduced = useReducedMotionPreference();
  const ref = React.useRef<HTMLDivElement>(null);
  // A reveal that is open when it mounts (initial={false}) is at rest.
  const appear = React.useContext(PresenceContext)?.initial !== false;
  usePresenceMotion(ref, "height", {
    appear,
    onGone: safeToRemove ?? undefined,
    present,
    reduced,
  });
  const defaultProps = {
    ...leavingProps(present, reduced),
    children,
    className: cn(
      slotClass("motion-reveal", props, render),
      "flow-root",
      className,
    ),
    "data-slot": "motion-reveal",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    ref,
    render,
  });
}

export interface MotionSwapProps extends useRender.ComponentProps<"div"> {
  /**
   * Identifies the content. When it changes, the old content fades out, the
   * new content fades in after it and the container's height follows.
   */
  swapKey: React.Key;
}

/**
 * Content that replaces other content, for steps, states and panels. The old
 * content fades out quickly and the new content fades in after it, so the two
 * are never legible on top of each other. The container's height follows the
 * new content over the whole swap, so nothing jumps.
 */
export function MotionSwap({
  children,
  className,
  render,
  swapKey,
  ...props
}: MotionSwapProps): React.ReactElement {
  const swapRef = React.useRef<HTMLDivElement>(null);
  // Measured from the container when a swap starts.
  const resolve = React.useCallback(
    () => measureSwapTiming(swapRef.current),
    [],
  );

  // The container follows the height of the new content, and keeps following
  // the entering pane until the swap is over, so content that builds a frame
  // later does not make the height pop at the end.
  const follow = useHeightFollower(swapRef);
  const previousKey = React.useRef(swapKey);
  React.useLayoutEffect(() => {
    if (previousKey.current === swapKey) return;
    previousKey.current = swapKey;
    const container = swapRef.current;
    if (!container) return;
    // The follow rule moves a swap's height over the whole swap, base in all.
    follow({
      enter: container.querySelector(
        ':scope > [data-slot="motion-swap-pane"]:not([inert])',
      ),
    });
  }, [follow, swapKey]);

  const defaultProps = {
    children: (
      <PopLayoutPresence>
        <MotionSwapPane key={swapKey} resolve={resolve}>
          {children}
        </MotionSwapPane>
      </PopLayoutPresence>
    ),
    // The leaving pane is taken out of the flow and positioned from here, and
    // the height follows over the whole swap.
    className: cn(
      slotClass("motion-swap", props, render),
      swapContainerClassName,
      "relative",
      className,
    ),
    "data-slot": "motion-swap",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    ref: swapRef,
    render,
  });
}

function MotionSwapPane({
  children,
  resolve,
  ...props
}: React.ComponentProps<"div"> & {
  resolve: () => SwapTiming;
}): React.ReactElement {
  const present = useIsPresent();
  const reduced = useReducedMotionPreference();
  const defaultProps = {
    ...swapPresence({ reduced, resolve }),
    ...leavingProps(present, reduced),
    children,
    className: cn(slotClass("motion-swap-pane", props), "flow-root"),
    "data-slot": "motion-swap-pane",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render: toMotionElement(undefined, "div"),
  });
}
