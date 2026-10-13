"use client";

import { motion, type Transition } from "motion/react";
import * as React from "react";

import { getMotionTransitionFromCss } from "../../system/motion/css-transition";

/**
 * What the Motion parts hand to Motion, kept apart from the components so the
 * values can be checked without a DOM. Durations and easings are measured from
 * the `--motion-*` tokens of the element itself when an animation starts
 * (rulebook M1), so a token set on any container around it applies; nothing
 * here invents a timing. Reduced motion (M5) makes every value instant.
 */

export type MotionLayout = "stack" | "flow";

/** Used whenever motion is reduced (M5) and on the server. */
export const instantTransition: Transition = { duration: 0 };

/**
 * A stack item is clipped only while it changes height (`useClipWhileAnimating`
 * follows the height). At rest nothing is clipped, so focus rings, shadows and
 * menus at the item's edge stay whole.
 */
const collapsed = { height: 0, opacity: 0 } as const;
const expanded = { height: "auto", opacity: 1 } as const;

/**
 * The timing of an animation, measured from the element when it starts, which
 * applies a token set on any container around it. Without a document (server
 * rendering) nothing animates.
 */
export function measureTiming(
  element: Element | null,
  durationVariable: `--motion-${string}`,
  easingVariable: `--motion-${string}`,
): Transition {
  if (typeof document === "undefined") return instantTransition;
  return getMotionTransitionFromCss(
    element ?? document.documentElement,
    durationVariable,
    easingVariable,
  );
}

/** A unitless token such as a scale, with the value the kit ships as fallback. */
export function measureNumber(
  element: Element | null,
  variable: `--motion-${string}`,
  fallback: number,
): number {
  if (typeof document === "undefined") return fallback;
  const parsed = Number.parseFloat(
    getComputedStyle(element ?? document.documentElement).getPropertyValue(
      variable,
    ),
  );
  return parsed > 0 && parsed <= 1 ? parsed : fallback;
}

/**
 * A transition whose duration and easing are measured at the moment Motion
 * reads them, which is when a layout animation starts. A plain object would
 * freeze the tokens at the render that created it.
 */
export function lazyTransition(resolve: () => Transition): Transition {
  const read = (key: "duration" | "ease") =>
    (resolve() as Record<string, unknown>)[key];
  return Object.defineProperties(
    {},
    {
      duration: { enumerable: true, get: () => read("duration") },
      ease: { enumerable: true, get: () => read("ease") },
    },
  ) as Transition;
}

type Timed = {
  /** Reduced motion: every animation is instant. */
  reduced: boolean;
  /** The timing of an animation, measured when it starts. */
  resolve: () => Transition;
};

/**
 * The stack presence of a single block, timed when each animation starts:
 * expand from height 0 with a fade; collapse the same way.
 */
export function revealPresence({ reduced, resolve }: Timed) {
  const timing = () => (reduced ? instantTransition : resolve());
  const variants = {
    collapsed: () => ({ ...collapsed, transition: timing() }),
    expanded: () => ({ ...expanded, transition: timing() }),
  };
  if (reduced) {
    return { animate: "expanded", initial: false, variants } as const;
  }
  return {
    animate: "expanded",
    exit: "collapsed",
    initial: "collapsed",
    variants,
  } as const;
}

/**
 * An item of a stack list: the same expand and collapse as a reveal. The item
 * is not held by `AnimatePresence`: the list keeps a leaving item in place
 * itself (`nextLeaving`) and plays the collapse with `leaving`, so it sits
 * right after the item it followed. `appear` is false for the items of the
 * first render, which are at rest from the start. A reorder glides with the
 * same timing.
 */
export function stackPresence({
  appear,
  leaving,
  reduced,
  resolve,
}: Timed & { appear: boolean; leaving: boolean }) {
  const timing = () => (reduced ? instantTransition : resolve());
  const variants = {
    collapsed: () => ({ ...collapsed, transition: timing() }),
    expanded: () => ({ ...expanded, transition: timing() }),
  };
  if (reduced) {
    return { animate: "expanded", initial: false, variants } as const;
  }
  return {
    animate: leaving ? "collapsed" : "expanded",
    initial: appear ? "collapsed" : false,
    transition: { layout: lazyTransition(resolve) },
    variants,
  } as const;
}

/** An item of a flow list: fade and scale slightly; the siblings glide by position. */
export function flowPresence({
  reduced,
  resolve,
  resolveScale,
}: Timed & { resolveScale: () => number }) {
  const timing = () => (reduced ? instantTransition : resolve());
  const variants = {
    hidden: () => ({ opacity: 0, scale: resolveScale(), transition: timing() }),
    shown: () => ({ opacity: 1, scale: 1, transition: timing() }),
  };
  if (reduced) {
    return { animate: "shown", initial: false, variants } as const;
  }
  return {
    animate: "shown",
    exit: "hidden",
    initial: "hidden",
    transition: { layout: lazyTransition(resolve) },
    variants,
  } as const;
}

/**
 * A character of a rolling number: it opens its width and fades in when it
 * appears and closes its width and fades out when it goes, so the characters
 * beside it glide instead of jumping. The cells of the first render are at
 * rest, and a cell that has left plays its collapse while it stays in place.
 */
export function glyphPresence({
  appear,
  leaving,
  reduced,
  resolve,
}: Timed & { appear: boolean; leaving: boolean }) {
  const timing = () => (reduced ? instantTransition : resolve());
  const variants = {
    collapsed: () => ({ opacity: 0, width: 0, transition: timing() }),
    expanded: () => ({ opacity: 1, width: "auto", transition: timing() }),
  };
  if (reduced) {
    return { animate: "expanded", initial: false, variants } as const;
  }
  return {
    animate: leaving ? "collapsed" : "expanded",
    initial: appear ? "collapsed" : false,
    variants,
  } as const;
}

export type SwapTiming = {
  /** The new content: starts late enough that the old content is nearly gone. */
  enter: Transition;
  /** The container height, over the whole swap. */
  height: Transition;
  /** The old content. */
  leave: Transition;
};

/**
 * A swap takes `--motion-duration-base` in all: the old content fades out
 * within `--motion-duration-micro` and the new content fades in during the last
 * `--motion-duration-micro`, so the two overlap only where each is nearly
 * invisible (2 x micro - base, 20 ms by default). The container's height follows
 * over the whole swap. If the tokens leave no room, both fades run together.
 */
export function measureSwapTiming(element: Element | null): SwapTiming {
  const leave = measureTiming(
    element,
    "--motion-duration-micro",
    "--motion-ease-soft-in-out",
  );
  const enter = measureTiming(
    element,
    "--motion-duration-micro",
    "--motion-ease-standard",
  );
  const height = measureTiming(
    element,
    "--motion-duration-base",
    "--motion-ease-standard",
  );
  const delay = Math.max(
    0,
    ((height as { duration?: number }).duration ?? 0) -
      ((enter as { duration?: number }).duration ?? 0),
  );
  return { enter: { ...enter, delay }, height, leave };
}

/**
 * The same fade through for a pane that Base UI mounts and unmounts and fades
 * with CSS transitions, such as a Tabs panel: the pane that takes over fades in
 * during the last micro duration of the base duration, the pane that leaves
 * fades out at once. The class is the kit's swap-fade rule in motion.css, which
 * names the tokens `measureSwapTiming` measures, so a swap looks the same
 * whichever way it is driven, and which is instant with reduced motion (M5).
 */
export const swapFadeClassName = "siteplane-swap-fade";

/**
 * A Tabs panel dissolves instead (Lukas, 13 October 2026: the fade through of a
 * whole panel flickered): the panel that takes over fades in over
 * `--motion-duration-expand` on top of the one that leaves, which stays below
 * and fades out during the last `--motion-duration-micro`. The class is the
 * kit's panel-dissolve rule in motion.css; reduced motion makes it instant (M5).
 */
export const panelDissolveClassName = "siteplane-panel-dissolve";

/** The height follow of a panel that dissolves: over the panel's whole fade in. */
export function measurePanelDissolveHeight(
  element: Element | null,
): Transition {
  return measureTiming(
    element,
    "--motion-duration-expand",
    "--motion-ease-standard",
  );
}

const instantSwap: SwapTiming = {
  enter: instantTransition,
  height: instantTransition,
  leave: instantTransition,
};

/**
 * Fade through: the old pane fades out quickly, the new pane fades in after it,
 * so the two texts are never legible on top of each other.
 */
export function swapPresence({
  reduced,
  resolve,
}: {
  reduced: boolean;
  resolve: () => SwapTiming;
}) {
  const timing = () => (reduced ? instantSwap : resolve());
  const variants = {
    hidden: () => ({ opacity: 0, transition: timing().leave }),
    shown: () => ({ opacity: 1, transition: timing().enter }),
  };
  if (reduced) {
    return { animate: "shown", initial: false, variants } as const;
  }
  return {
    animate: "shown",
    exit: "hidden",
    initial: "hidden",
    variants,
  } as const;
}

type Keyed = { key: React.Key | null };

/**
 * An item that has left the list and still plays its exit. `after` is the key
 * of the item that preceded it when it left (`null` for the first), `last`
 * whether it was the last one, and `element` what it rendered.
 */
export type Leaving<T = unknown> = {
  after: React.Key | null;
  element: T;
  key: React.Key;
  last: boolean;
};

/**
 * The keys in the order they render: the present items, with each leaving item
 * right after the item it followed. Where the present items moved or others
 * were inserted before it, a leaving item stays with its neighbour instead of
 * keeping its old index, so it never glides across the item beside it.
 */
export function mergeLeaving(
  present: readonly React.Key[],
  leaving: ReadonlyArray<Pick<Leaving, "after" | "key">>,
): React.Key[] {
  const order = [...present];
  const pending = leaving.filter((entry) => !order.includes(entry.key));
  while (pending.length > 0) {
    // An item waits until the item it followed is placed; chains are acyclic.
    const ready = pending.findIndex(
      (entry) => entry.after === null || order.includes(entry.after),
    );
    const [entry] = pending.splice(Math.max(0, ready), 1);
    order.splice(
      entry!.after === null ? 0 : order.indexOf(entry!.after) + 1,
      0,
      entry!.key,
    );
  }
  return order;
}

/**
 * The leaving items after an update. `previous` is what the list rendered
 * before it (the present items of the last commit) and `leaving` what was
 * leaving then. An item that is no longer present starts to leave, remembering
 * the item it followed; an item that came back stops. The same array comes back
 * when nothing changed.
 */
export function nextLeaving<T extends Keyed>(
  leaving: ReadonlyArray<Leaving<T>>,
  previous: readonly T[],
  present: readonly T[],
): ReadonlyArray<Leaving<T>> {
  const presentKeys = new Set(present.map((item) => item.key as React.Key));
  const next = leaving.filter((entry) => !presentKeys.has(entry.key));
  const known = new Set(next.map((entry) => entry.key));
  const order = mergeLeaving(
    previous.map((item) => item.key as React.Key),
    leaving,
  );
  const lastKey = previous.at(-1)?.key;
  const byKey = new Map(previous.map((item) => [item.key, item]));
  order.forEach((key, index) => {
    if (presentKeys.has(key) || known.has(key)) return;
    const element = byKey.get(key as string);
    if (!element) return;
    known.add(key);
    next.push({
      after: index > 0 ? order[index - 1]! : null,
      element,
      key,
      last: key === lastKey,
    });
  });
  return next.length === leaving.length &&
    next.every((entry, index) => entry === leaving[index])
    ? leaving
    : next;
}

/** One entry of a stack list as it renders: a present item or a leaving one. */
export type StackEntry<T> = {
  element: T;
  key: React.Key;
  /** Whether no other present item follows, so no space is needed after it. */
  last: boolean;
  leaving: boolean;
};

/**
 * Every entry of a stack list in render order, with the leaving items in their
 * place. A leaving item keeps the `last` it had when it left, so the space after
 * it does not open or close during its exit.
 */
export function stackEntries<T extends Keyed>(
  present: readonly T[],
  leaving: ReadonlyArray<Leaving<T>>,
): StackEntry<T>[] {
  const lastKey = present.at(-1)?.key;
  const byKey = new Map(present.map((item) => [item.key, item]));
  const held = new Map(leaving.map((entry) => [entry.key, entry]));
  return mergeLeaving(
    present.map((item) => item.key as React.Key),
    leaving,
  ).map((key) => {
    const element = byKey.get(key as string);
    if (element) return { element, key, last: key === lastKey, leaving: false };
    const entry = held.get(key)!;
    return { element: entry.element, key, last: entry.last, leaving: true };
  });
}

/**
 * The leaving items once one has finished its exit. Items that followed it
 * follow what it followed, so the order of the others does not change.
 */
export function dropLeaving<T>(
  leaving: ReadonlyArray<Leaving<T>>,
  key: React.Key,
): ReadonlyArray<Leaving<T>> {
  const gone = leaving.find((entry) => entry.key === key);
  if (!gone) return leaving;
  return leaving
    .filter((entry) => entry !== gone)
    .map((entry) =>
      entry.after === key ? { ...entry, after: gone.after } : entry,
    );
}

/**
 * The entries of a keyed list, leaving ones included. An item that is no longer
 * given stays in the list until its exit has played, in the place after the
 * item it followed; `remove` drops it once it has gone. `track` is off for
 * lists whose items leave at once, and for reduced motion, where nothing stays.
 */
export function useLeavingEntries<T extends Keyed>(
  present: readonly T[],
  track: boolean,
) {
  const [leaving, setLeaving] = React.useState<ReadonlyArray<Leaving<T>>>([]);
  // What the list rendered in the last commit; a leaving item shows it again.
  const committed = React.useRef(present);
  React.useLayoutEffect(() => {
    committed.current = present;
  });

  const next = track
    ? nextLeaving(leaving, committed.current, present)
    : leaving.length > 0
      ? []
      : leaving;
  if (next !== leaving) setLeaving(next);

  const remove = React.useCallback(
    (key: React.Key) => setLeaving((entries) => dropLeaving(entries, key)),
    [],
  );
  return { entries: stackEntries(present, next), remove };
}

/**
 * What to do when the new content of a swap has another height than the one the
 * running height animation heads for (content that builds a frame later, such
 * as a collection or an editor): continue from what is shown now towards the
 * real height, in the time that is left. `null` when nothing changed.
 */
export function retargetHeight({
  elapsed,
  natural,
  shown,
  target,
  total,
}: {
  /** Milliseconds since the swap started. */
  elapsed: number;
  /** The height the container would have at rest now. */
  natural: number;
  /** The height the user sees now. */
  shown: number;
  /** The height the animation heads for. */
  target: number;
  /** Milliseconds the swap takes in all. */
  total: number;
}): { duration: number; from: number; to: number } | null {
  if (Math.abs(natural - target) < 1) return null;
  return { duration: Math.max(0, total - elapsed), from: shown, to: natural };
}

/**
 * Clips the element while its height (or its width, for the characters of a
 * rolling number) moves and releases the clip at rest. Motion keeps `auto` in
 * the element's style at rest and a pixel value while it moves, so the style
 * itself says which. `overflow` is not a Motion target: Motion writes back every
 * value it knows on each frame and would undo the release. A style observer,
 * unlike a completion callback, cannot miss the end of an interrupted
 * animation. The returned `ref` belongs on the animated element.
 */
export function useClipWhileAnimating<T extends HTMLElement = HTMLElement>(
  axis: "height" | "width" = "height",
) {
  const ref = React.useRef<T | null>(null);
  React.useEffect(() => {
    const element = ref.current;
    if (!element || typeof MutationObserver === "undefined") return;
    const overflow = axis === "height" ? "overflowY" : "overflowX";
    const follow = () => {
      const size = element.style[axis];
      const next = size === "" || size === "auto" ? "" : "clip";
      if (element.style[overflow] !== next) element.style[overflow] = next;
    };
    follow();
    const observer = new MutationObserver(follow);
    observer.observe(element, { attributeFilter: ["style"], attributes: true });
    return () => observer.disconnect();
  }, [axis]);
  return { ref };
}

/**
 * A leaving element takes no input and is hidden from assistive technology.
 * While motion is reduced it is hidden at once, in the frame it leaves in,
 * although the element itself is removed a moment later.
 */
export function leavingProps(present: boolean, reduced = false) {
  if (present) return {};
  return {
    "aria-hidden": true,
    inert: true,
    ...(reduced ? { style: { display: "none" } } : {}),
  };
}

type MotionTag = "div" | "li" | "ul";

const wrapped = new WeakMap<object, React.ElementType>();

/**
 * The `render` element, upgraded to a Motion element so that it can animate:
 * a DOM element (`<div />`) becomes its `motion.*` counterpart, a component
 * element (`<Card />`) is wrapped with `motion.create`. Without `render` the
 * default tag is used. Props, key and ref of the element are kept.
 */
export function toMotionElement(
  render: React.ReactElement | undefined,
  defaultTag: MotionTag,
): React.ReactElement {
  if (!render)
    return React.createElement(motion[defaultTag] as React.ElementType);

  const type = render.type;
  let component: React.ElementType;
  if (typeof type === "string") {
    component = (motion as unknown as Record<string, React.ElementType>)[type]!;
  } else {
    let existing = wrapped.get(type as object);
    if (!existing) {
      existing = motion.create(type as React.ElementType) as React.ElementType;
      wrapped.set(type as object, existing);
    }
    component = existing;
  }
  return React.createElement(
    component,
    render.props as Record<string, unknown>,
  );
}
