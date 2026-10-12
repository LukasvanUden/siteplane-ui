"use client";

import {
  animate,
  type AnimationPlaybackControls,
  type Transition,
} from "motion/react";
import * as React from "react";

import { useReducedMotionPreference } from "../../system/motion/use-reduced-motion-preference";
import { measureSwapTiming, retargetHeight } from "./motion-presence";

/**
 * How a container follows the height of what it holds when content comes and
 * goes: a swapped pane, a row of wrapping items, a panel that leaves while it
 * stays mounted. It is the one place that animates a container's height, so
 * every part and every component built on them moves it the same way.
 */

export type FollowOptions = {
  /**
   * The element that takes over. It is observed until the swap is over, so
   * content that builds a frame later, such as a collection or an editor, is
   * followed instead of popping into place at the end.
   */
  enter?: Element | null;
  /** The timing of the height animation, measured when the swap starts. */
  timing: Transition;
};

export type HeightFollow = { stop: () => void };

/** The follow that runs in a container, to end it before another starts. */
const follows = new WeakMap<HTMLElement, HeightFollow>();

/** The containers that hold a height of their own while they animate it. */
const held = new Set<HTMLElement>();

/**
 * The height the element has at rest, measured with its own height released.
 * So is the height of a container inside it that follows at the same time (a
 * group of tags that builds in a swapped pane): the element heads for the
 * height the content will have, not for the frame the inner one is at.
 */
function naturalHeight(element: HTMLElement): number {
  const released = [
    element,
    ...[...held].filter(
      (inner) => inner !== element && element.contains(inner),
    ),
  ].map((target) => ({
    height: target.style.height,
    overflowY: target.style.overflowY,
    target,
  }));
  for (const { target } of released) {
    target.style.height = "";
    target.style.overflowY = "";
  }
  const natural = element.getBoundingClientRect().height;
  for (const { height, overflowY, target } of released) {
    target.style.height = height;
    target.style.overflowY = overflowY;
  }
  return natural;
}

/**
 * Animates the container from `from`, the height it had before the content
 * changed, to the height of the new content, and keeps following the entering
 * element until the swap is over: the animation then continues from what is
 * shown towards the real height. With an entering element the height is held
 * where it is until that element has been laid out once, one frame on: content
 * that builds a frame later (a collection, an editor) is then in place, and the
 * height heads for what it really is instead of dipping towards an empty pane.
 * Everything the container is given while it follows (height, clip, position)
 * is handed back when the swap is over, so later changes flow naturally. A
 * container that scrolls keeps its own height, and so does one that had no box
 * before (`from` is `null`).
 */
export function followHeight(
  container: HTMLElement,
  from: number | null,
  { enter, timing }: FollowOptions,
): HeightFollow {
  follows.get(container)?.stop();
  if (from === null) return { stop: () => undefined };

  const styles = getComputedStyle(container);
  const scrolls = /auto|scroll/.test(styles.overflowY);
  const kept = {
    height: container.style.height,
    overflowY: container.style.overflowY,
    position: container.style.position,
  };
  // A pane that leaves is positioned against the container.
  if (styles.position === "static") container.style.position = "relative";

  const total = ((timing as { duration?: number }).duration ?? 0) * 1000;
  const startedAt = performance.now();
  const watch =
    Boolean(enter) && !scrolls && typeof ResizeObserver !== "undefined";
  let target = watch ? from : naturalHeight(container);
  let animation: AnimationPlaybackControls | undefined;
  let observer: ResizeObserver | undefined;
  let pinned = false;
  let done = false;

  const release = () => {
    pinned = false;
    held.delete(container);
    container.style.height = kept.height;
    container.style.overflowY = kept.overflowY;
  };
  const finish = () => {
    if (done) return;
    done = true;
    animation = undefined;
    observer?.disconnect();
    clearTimeout(timer);
    release();
    container.style.position = kept.position;
    if (follows.get(container) === follow) follows.delete(container);
  };
  const follow: HeightFollow = {
    stop: () => {
      animation?.stop();
      finish();
    },
  };
  // A swap that moves no height ends without an animation to say so.
  const timer = setTimeout(() => {
    if (!animation) finish();
  }, total);
  follows.set(container, follow);

  // What leaves is clipped with the container while its height is held.
  const pin = (height: number) => {
    pinned = true;
    held.add(container);
    container.style.overflowY = "clip";
    container.style.height = `${height}px`;
  };
  // The follower animates a number and writes each height itself. Given the
  // container, Motion would keep the height as a value of its own and write the
  // last keyframe once more after the animation has ended, over the height
  // handed back in `finish`.
  const head = (start: number, end: number, duration: number) => {
    if (scrolls) return;
    animation?.stop();
    pin(start);
    animation = animate(start, end, {
      ...timing,
      duration: duration / 1000,
      onComplete: finish,
      onUpdate: (height) => {
        if (!done) container.style.height = `${height}px`;
      },
    });
  };

  if (watch) {
    pin(from);
    observer = new ResizeObserver(() => {
      if (done) return;
      const change = retargetHeight({
        elapsed: performance.now() - startedAt,
        natural: naturalHeight(container),
        shown: animation ? container.getBoundingClientRect().height : target,
        target,
        total,
      });
      if (change) {
        target = change.to;
        head(change.from, change.to, change.duration);
      } else if (pinned && !animation) {
        // Nothing moves: the height is handed back, and still followed.
        release();
      }
    });
    observer.observe(enter!);
  } else if (Math.abs(from - target) >= 1) {
    head(from, target, total);
  }
  return follow;
}

/**
 * Lets a container follow its height when its content changes. Returns
 * `follow`, to call in a layout effect in the commit that changes the content:
 * the container then animates from the height it showed before the commit to
 * the height of the new content. Does nothing when motion is reduced (M5), when
 * the container had no box (hidden) or when `enabled` is false.
 */
export function useHeightFollower(
  ref: React.RefObject<HTMLElement | null>,
  enabled = true,
): (options: FollowOptions) => void {
  const reduced = useReducedMotionPreference();
  const instant = React.useRef(reduced);
  instant.current = reduced;
  const height = React.useRef<number | null>(null);
  const session = React.useRef<HeightFollow | null>(null);

  // The height at the last frame, including frames of a running animation. A
  // passive effect, because the container may be an ancestor, whose ref is set
  // after the layout effects of the component that follows it.
  React.useEffect(() => {
    const element = ref.current;
    if (!enabled || !element || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      height.current =
        element.getClientRects().length > 0
          ? element.getBoundingClientRect().height
          : null;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, ref]);

  React.useEffect(() => () => session.current?.stop(), []);

  return React.useCallback(
    (options: FollowOptions) => {
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

/** The pane's place against the padding box of its container. */
function placeOf(pane: HTMLElement, container: HTMLElement): PanePlace {
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
 * the flow, so the pane that takes over has the place and the pane's container
 * follows the new height; with reduced motion it is hidden at once (M5).
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

  // The pane leaves: its container follows from the height it had to the new one.
  React.useLayoutEffect(() => {
    const element = container.current;
    if (!leaving || !element || !place.current) return;
    latest.current.follow({
      enter: latest.current.enter?.(element) ?? null,
      timing: measureSwapTiming(element).height,
    });
  }, [container, leaving]);

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
