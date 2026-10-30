"use client";

import * as React from "react";

import { useReducedMotionPreference } from "../../system/motion/use-reduced-motion-preference";
import { inSecondFrame } from "./motion-presence";

/**
 * How a container follows the height of what it holds when content comes and
 * goes: a swapped pane, a row of wrapping items, a panel that leaves while it
 * stays mounted. It is the one place that moves a container's height, so every
 * part and every component built on them moves it the same way.
 *
 * JavaScript measures and a CSS transition animates, as Base UI's Collapsible
 * and Accordion panels do with the height they measure: the container is held
 * at the height it showed, then given the height of its new content, and the
 * kit's follow rule in motion.css animates between the two. A transition starts
 * with the frame that renders it, however long the commit before that frame
 * took, so the first frame never shows the movement half done; a new height
 * that arrives mid-way retargets it from the height shown.
 */

export type FollowOptions = {
  /**
   * The element that takes over. It is observed until the follow is over, so
   * content that builds a frame later, such as a collection or an editor, is
   * followed instead of popping into place at the end.
   */
  enter?: Element | null;
  /**
   * Whether the container clips what it holds to the height it shows while
   * it follows (the default). An Editable does not: its field's frame grows
   * outward past the row, and every side of it stays in sight.
   */
  clip?: boolean;
};

export type HeightFollow = { stop: () => void };

/** The class of the follow rule (motion.css), while a container follows. */
export const heightFollowClassName = "sp-height-follow";

/**
 * The class of a container whose content swaps, such as a MotionSwap or an
 * Editable: its height follows over the whole swap, the base duration
 * (motion.css), where other follows take the expand duration (rulebook M8).
 */
export const swapContainerClassName = "sp-swap-container";

/** A follow that runs, with the height it heads for. */
type Running = HeightFollow & { target: () => number };

/** The follow that runs in a container, to end it before another starts. */
const follows = new Map<HTMLElement, Running>();

/**
 * How much taller the content of `element` will be than it shows now: the
 * containers that follow inside it head for heights they do not show yet. A
 * container that follows around them heads for the height its content will
 * have, not for the frame they are at (a group of tags that builds in a
 * swapped pane).
 */
function innerGrowth(element: Element): number {
  let growth = 0;
  for (const [inner, follow] of follows)
    if (inner !== element && element.contains(inner))
      growth += follow.target() - inner.getBoundingClientRect().height;
  return growth;
}

/** The longest duration of a computed `transition-duration` list, in ms. */
function longestDuration(value: string): number {
  return Math.max(
    0,
    ...value
      .split(",")
      .map(
        (part) =>
          Number.parseFloat(part) * (part.trim().endsWith("ms") ? 1 : 1000),
      )
      .filter(Number.isFinite),
  );
}

const nothing: HeightFollow = { stop: () => undefined };

/**
 * Moves the container from `from`, the height it showed before its content
 * changed, to the height of the new content, measured now in the commit that
 * changed it. The container is held at `from` for the frame that commit
 * renders, and the frame after hands it the new height, which the follow rule
 * animates (`inSecondFrame`). With an entering element the follow keeps
 * watching it: when it
 * grows or shrinks, the container heads for the new height from the one it
 * shows. That is read from the observed size alone, without releasing the
 * container, so following costs no extra layout. Everything the container is
 * given (height, clip, the class) is handed back when the height has arrived,
 * so later changes flow naturally. A container that scrolls keeps its own
 * height, and so does one that had no box before (`from` is `null`). A pane
 * that leaves is positioned by `holdPanePlace`, which lasts as long as the
 * pane and not as long as the height.
 */
export function followHeight(
  container: HTMLElement,
  from: number | null,
  { clip = true, enter }: FollowOptions = {},
): HeightFollow {
  follows.get(container)?.stop();
  if (from === null || typeof requestAnimationFrame === "undefined") {
    return nothing;
  }
  if (/auto|scroll/.test(getComputedStyle(container).overflowY)) return nothing;

  // The commit has laid out the new content. Besides its height, the follow
  // keeps what the container holds around the entering element (a tab list,
  // padding), so that the container's height can be told from the entering
  // element's size later on.
  let target =
    container.getBoundingClientRect().height + innerGrowth(container);
  const around = enter
    ? target - enter.getBoundingClientRect().height - innerGrowth(enter)
    : 0;

  const kept = {
    height: container.style.height,
    overflowY: container.style.overflowY,
  };
  let pinned = false;
  let pinnedAt = from;
  let started = false;
  let done = false;
  let cancelHead: (() => void) | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  // An entering element is watched; see `measured` below.
  const observer =
    enter && typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(measured)
      : undefined;

  // The container shows the height it had; what leaves is clipped with it.
  const pin = (height: number) => {
    pinned = true;
    pinnedAt = height;
    container.classList.add(heightFollowClassName);
    if (clip) container.style.overflowY = "clip";
    container.style.height = `${height}px`;
  };
  const release = () => {
    pinned = false;
    container.classList.remove(heightFollowClassName);
    container.style.height = kept.height;
    container.style.overflowY = kept.overflowY;
  };
  const finish = () => {
    if (done) return;
    done = true;
    cancelHead?.();
    clearTimeout(timer);
    observer?.disconnect();
    container.removeEventListener("transitionend", arrived);
    release();
    if (follows.get(container) === follow) follows.delete(container);
  };
  // The height has arrived when its transition ends.
  function arrived(event: Event) {
    if (
      event.target === container &&
      (event as TransitionEvent).propertyName === "height"
    )
      finish();
  }
  const follow: Running = { stop: finish, target: () => target };
  follows.set(container, follow);

  pin(from);
  // How long a move takes: the follow rule's duration, or what the app's own
  // transition on the container says. Nothing is held longer than that after
  // the last change, also when no transition runs to say it has ended.
  const duration = longestDuration(
    getComputedStyle(container).transitionDuration,
  );
  const settleBy = () => {
    clearTimeout(timer);
    timer = setTimeout(finish, duration + 100);
  };
  container.addEventListener("transitionend", arrived);
  settleBy();

  // The new height, which the rule animates from the one held. When nothing
  // moves, an entering element is still watched for as long as a move takes;
  // the container meanwhile has its own height again.
  const head = () => {
    cancelHead = undefined;
    if (done) return;
    if (!enter && Math.abs(target - from) < 1) {
      finish();
      return;
    }
    if (Math.abs(target - pinnedAt) < 1) release();
    else container.style.height = `${target}px`;
    settleBy();
  };

  if (!observer || !enter) {
    cancelHead = inSecondFrame(head);
    return follow;
  }
  observer.observe(enter);
  return follow;

  // With an entering element the height is held until that element has been
  // laid out once, at the end of the frame the commit renders: content that
  // builds a moment later (a collection, an editor) is then in place, and the
  // new height follows in the frame after. The observer only reads: after
  // layout, the sizes are known without forcing another layout.
  function measured() {
    if (done || !enter) return;
    // Held, the container shows its pin or the transition's frame; handed back,
    // it showed the height it settled at until this layout grew or shrank it.
    const shown = pinned ? container.getBoundingClientRect().height : target;
    const natural =
      enter.getBoundingClientRect().height + innerGrowth(enter) + around;
    // An entering element that fills all the room the container gives it may
    // be stretched to it (a Tabs panel grows into its root): its size says
    // nothing about its content until it no longer fits.
    const fills = Math.abs(natural - shown) < 1;
    if (!started) {
      started = true;
      if (!fills) target = natural;
      cancelHead = inNextFrame(head);
      return;
    }
    if (fills || Math.abs(natural - target) < 1) return;
    target = natural;
    if (cancelHead) return;
    if (pinned) {
      container.style.height = `${target}px`;
      settleBy();
    } else {
      // The container rests at its own height. Held at what it shows, it
      // heads for the new height in the next frame, so the move has a height
      // to start from.
      pin(shown);
      cancelHead = inNextFrame(head);
    }
  }
}

function inNextFrame(start: () => void): () => void {
  const id = requestAnimationFrame(start);
  return () => cancelAnimationFrame(id);
}

/**
 * Lets a container follow its height when its content changes. Returns
 * `follow`, to call in a layout effect in the commit that changes the content:
 * the container then moves from the height it showed before the commit to the
 * height of the new content. Does nothing when motion is reduced (M5), when the
 * container had no box (hidden) or when `enabled` is false.
 */
export function useHeightFollower(
  ref: React.RefObject<HTMLElement | null>,
  enabled = true,
): (options?: FollowOptions) => void {
  const reduced = useReducedMotionPreference();
  const instant = React.useRef(reduced);
  instant.current = reduced;
  const height = React.useRef<number | null>(null);
  const session = React.useRef<HeightFollow | null>(null);

  // The height at the last frame, including frames of a running follow. A
  // passive effect, because the container may be an ancestor, whose ref is set
  // after the layout effects of the component that follows it. The observer
  // reads in the rendering steps of a frame, from the first frame on, so the
  // height is one the page has shown: a commit that never reached the screen,
  // such as the empty first pass of a React Aria collection, is no height to
  // follow from.
  React.useEffect(() => {
    const element = ref.current;
    if (!enabled || !element || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      height.current =
        element.getClientRects().length > 0
          ? element.getBoundingClientRect().height
          : null;
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, ref]);

  React.useEffect(() => () => session.current?.stop(), []);

  return React.useCallback(
    (options?: FollowOptions) => {
      const container = ref.current;
      if (!enabled || !container || instant.current) return;
      // A follow that still runs shows its own height; at rest it is the one
      // seen at the last frame before this commit.
      const from = follows.has(container)
        ? container.getBoundingClientRect().height
        : height.current;
      session.current = followHeight(container, from, options);
    },
    [enabled, ref],
  );
}

/** Where a pane sits in its container. */
export type PanePlace = {
  height: number;
  left: number;
  top: number;
  width: number;
};

/** The style that keeps a leaving pane where it is, out of the flow. */
export function panePin(place: PanePlace): React.CSSProperties {
  return {
    height: place.height,
    left: place.left,
    margin: 0,
    position: "absolute",
    top: place.top,
    width: place.width,
  };
}

/** The containers panes are pinned in: how many, and the position they had. */
const placeHolders = new WeakMap<
  HTMLElement,
  { panes: number; position: string }
>();

/**
 * Makes the container the box a leaving pane is pinned against (`panePin`): a
 * container that is not positioned becomes `relative`. Returns the release, to
 * call when the pane is gone; the container gets its own position back when the
 * last pane pinned in it is gone. The hold lasts as long as the pane, which can
 * outlast its container's height follow.
 */
export function holdPanePlace(container: HTMLElement): () => void {
  const held = placeHolders.get(container);
  if (held) {
    held.panes += 1;
  } else {
    placeHolders.set(container, {
      panes: 1,
      position: container.style.position,
    });
    if (getComputedStyle(container).position === "static") {
      container.style.position = "relative";
    }
  }
  let released = false;
  return () => {
    const entry = placeHolders.get(container);
    if (released || !entry) return;
    released = true;
    entry.panes -= 1;
    if (entry.panes > 0) return;
    placeHolders.delete(container);
    container.style.position = entry.position;
  };
}

/**
 * The pane's place against the padding box of its container, where `panePin`
 * keeps it while it leaves.
 */
export function placeOf(pane: HTMLElement, container: HTMLElement): PanePlace {
  const box = pane.getBoundingClientRect();
  const containerBox = container.getBoundingClientRect();
  return {
    height: box.height,
    left:
      box.left -
      containerBox.left -
      container.clientLeft +
      container.scrollLeft,
    top: box.top - containerBox.top - container.clientTop + container.scrollTop,
    width: box.width,
  };
}

/**
 * A pane that leaves while it stays mounted, as a Base UI panel does until its
 * exit transition has run, instead of being replaced by a `MotionSwap` (which
 * would remount a pane that is kept mounted, together with the state in it).
 * `open` says the pane is shown, `leaving` that it is on its way out. The
 * returned style, for the pane while it leaves, keeps it where it was, out of
 * the flow and against its container until it is gone (`holdPanePlace`), so the
 * pane that takes over has the place and the pane's container follows the new
 * height over the expand duration (the follow rule in motion.css); the panel
 * switch rule (panelSwitchClassName) hides it at once. With reduced motion the
 * height changes at once (M5).
 * `enter` finds the pane that takes over in the container, so late content in it
 * is followed; give it a stable function.
 */
export function useLeavingPane(
  ref: React.RefObject<HTMLElement | null>,
  {
    enter,
    leaving,
    open,
  }: {
    enter?: (container: HTMLElement) => Element | null;
    leaving: boolean;
    open: boolean;
  },
): React.CSSProperties | undefined {
  const reduced = useReducedMotionPreference();
  const place = React.useRef<PanePlace | null>(null);
  // The container is the element the pane sits in.
  const container = React.useMemo(
    () => ({
      get current() {
        return ref.current?.parentElement ?? null;
      },
    }),
    [ref],
  );
  const follow = useHeightFollower(container);
  const latest = React.useRef({ enter, follow });
  latest.current = { enter, follow };

  // The pane leaves: it is pinned against its container until it is gone, and
  // the container follows from the height it had to the new one.
  React.useLayoutEffect(() => {
    const element = container.current;
    if (!leaving || reduced || !element || !place.current) return;
    const release = holdPanePlace(element);
    latest.current.follow({ enter: latest.current.enter?.(element) ?? null });
    return release;
  }, [container, leaving, reduced]);

  // At rest: where the pane sits, which is where it is pinned when it leaves.
  React.useLayoutEffect(() => {
    const pane = ref.current;
    const element = pane?.parentElement;
    if (!open || !pane || !element || typeof ResizeObserver === "undefined") {
      return;
    }
    place.current = placeOf(pane, element);
    const observer = new ResizeObserver(() => {
      place.current = placeOf(pane, element);
    });
    observer.observe(pane);
    observer.observe(element);
    return () => observer.disconnect();
  }, [open, ref]);

  if (!leaving) return undefined;
  if (reduced) return { display: "none" };
  return place.current ? panePin(place.current) : undefined;
}
