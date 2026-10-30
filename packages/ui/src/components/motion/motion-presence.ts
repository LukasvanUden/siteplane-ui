"use client";

import { motion, type Transition } from "motion/react";
import * as React from "react";

import { getMotionTransitionFromCss } from "../../system/motion/css-transition";

/**
 * The timing and the moves of the Motion parts, kept apart from the components
 * so they can be checked without a browser. Durations and easings are measured
 * from the `--motion-*` tokens of the element itself when an animation starts
 * (rulebook M1), so a token set on any container around it applies; nothing
 * here invents a timing. Presence and glides run on the Web Animations API from
 * the frame after a change; MotionSwap's fade and the rolling number hand their
 * values to Motion. Reduced motion (M5) makes everything instant.
 */

export type MotionLayout = "stack" | "flow";

/** Used whenever motion is reduced (M5) and on the server. */
export const instantTransition: Transition = { duration: 0 };

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

/**
 * Runs `start` in the frame after the one that renders the current commit and
 * returns its cancel. That first frame shows where a motion starts. A browser
 * can take long to present it (in Chrome the first change after an input
 * waits tens of milliseconds), and a clock started in it is already part-way
 * by the next frame; started a frame later, the motion begins where the first
 * frame left it. Base UI's panels start their transitions a frame later too.
 */
export function inSecondFrame(start: () => void): () => void {
  let id = requestAnimationFrame(() => {
    id = requestAnimationFrame(start);
  });
  return () => cancelAnimationFrame(id);
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
 * The duration and the curve of a keyframe animation, read from the motion
 * tokens of the element when it starts (rulebook M1), so a token set on any
 * container around it applies.
 */
export function keyframeTiming(
  element: Element,
  durationVariable: `--motion-${string}`,
  easingVariable: `--motion-${string}`,
): KeyframeAnimationOptions {
  const styles = getComputedStyle(element);
  const duration = styles.getPropertyValue(durationVariable).trim();
  const easing = styles.getPropertyValue(easingVariable).trim();
  return {
    duration:
      (Number.parseFloat(duration) || 0) * (duration.endsWith("ms") ? 1 : 1000),
    ...(easing ? { easing } : {}),
  };
}

/**
 * Starts a keyframe animation that shows its first keyframe in the frame the
 * commit renders and plays from the frame after (`inSecondFrame`). The Web
 * Animations API runs it: translate, scale and opacity on the compositor,
 * height on the main thread.
 */
export function playFromSecondFrame(
  element: Element,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
): Animation {
  const animation = element.animate(keyframes, options);
  animation.pause();
  inSecondFrame(() => {
    // An animation that was cancelled or replaced meanwhile stays so.
    if (animation.playState === "paused") animation.play();
  });
  return animation;
}

/** The element's own `overflow-y` while a height animation clips it. */
const clipped = new WeakMap<HTMLElement, string>();

function clip(element: HTMLElement) {
  if (clipped.has(element)) return;
  clipped.set(element, element.style.overflowY);
  element.style.overflowY = "clip";
}

function unclip(element: HTMLElement) {
  const own = clipped.get(element);
  if (own === undefined) return;
  clipped.delete(element);
  element.style.overflowY = own;
}

/** A uniform `scale` as getComputedStyle reports it: "none" is 1. */
function scaleOf(value: string): number {
  const scale = Number.parseFloat(value);
  return Number.isFinite(scale) ? scale : 1;
}

/**
 * How an element comes and goes. `height`: a block that opens and closes its
 * height with a fade, a stack item or a reveal; what is below it moves with its
 * height, and it clips its content while the height moves (at rest nothing is
 * clipped, so focus rings, shadows and menus at its edge stay whole). `scale`:
 * an item of a wrapping or horizontal set, a flow list, which fades in and
 * grows from `--motion-presence-scale` and fades and shrinks out, without
 * travel (M2), while its siblings glide (`GlideOnChange`).
 */
export type PresenceKind = "height" | "scale";

/**
 * The keyframe an element shows now: the frame a running motion is at, or,
 * with nothing running, the element at rest.
 */
const presenceNow: Record<PresenceKind, (element: HTMLElement) => Keyframe> = {
  height: (element) => ({
    height: `${element.getBoundingClientRect().height}px`,
    opacity: Number(getComputedStyle(element).opacity),
  }),
  scale: (element) => {
    const styles = getComputedStyle(element);
    return { opacity: Number(styles.opacity), scale: scaleOf(styles.scale) };
  },
};

/** The keyframe of an element that is gone. */
const presenceGone: Record<PresenceKind, (element: HTMLElement) => Keyframe> = {
  height: () => ({ height: "0px", opacity: 0 }),
  scale: (element) => ({
    opacity: 0,
    scale: measureNumber(element, "--motion-presence-scale", 0.96),
  }),
};

/**
 * Starts the presence motion of an element over the expand duration: towards
 * rest when it is present, towards gone when it is not. A motion that still
 * runs is replaced from what it shows, so a change of course does not jump
 * back. `then` runs when the motion has finished.
 */
export function playPresence(
  element: HTMLElement,
  kind: PresenceKind,
  present: boolean,
  running: Animation | null,
  then: () => void,
): Animation {
  const from = running
    ? presenceNow[kind](element)
    : present
      ? presenceGone[kind](element)
      : null;
  running?.cancel();
  const atRest = presenceNow[kind](element);
  if (kind === "height") clip(element);
  const animation = playFromSecondFrame(
    element,
    present ? [from!, atRest] : [from ?? atRest, presenceGone[kind](element)],
    {
      ...keyframeTiming(
        element,
        "--motion-duration-expand",
        "--motion-ease-standard",
      ),
      // A leaving element keeps its last keyframe until it is removed.
      fill: present ? "none" : "forwards",
    },
  );
  animation.onfinish = () => {
    if (present) unclip(element);
    then();
  };
  return animation;
}

/**
 * Plays the presence of an element (rulebook M6, M7) over the expand duration:
 * from gone to rest when it appears or comes back, from rest to gone when it
 * leaves. JavaScript measures and the Web Animations API animates, from the
 * second frame (`playFromSecondFrame`), so a slow first frame never shows the
 * motion half done. A change of course starts from what is shown, so nothing
 * jumps back. `appear` is false for an element that is at rest when it mounts.
 * `onGone` runs when a leaving element has finished, and at once with reduced
 * motion, where nothing animates (M5).
 */
export function usePresenceMotion(
  ref: React.RefObject<HTMLElement | null>,
  kind: PresenceKind,
  {
    appear,
    onGone,
    present,
    reduced,
  }: {
    appear: boolean;
    onGone?: (() => void) | undefined;
    present: boolean;
    reduced: boolean;
  },
): void {
  const state = React.useRef<PresenceMotionState>({ running: null, was: null });
  const gone = React.useRef(onGone);
  gone.current = onGone;

  React.useLayoutEffect(() => {
    updatePresence(
      state.current,
      ref.current,
      { appear, kind, present, reduced },
      () => gone.current?.(),
    );
  }, [appear, kind, present, reduced, ref]);

  React.useEffect(() => {
    const presence = state.current;
    return () => stopPresence(presence);
  }, []);
}

/** What `usePresenceMotion` keeps between the updates of an element. */
export type PresenceMotionState = {
  running: Animation | null;
  /** Whether the element was present at its last update, null before the first. */
  was: boolean | null;
};

/**
 * One update of `usePresenceMotion`: plays the presence when the element
 * appears, comes back or leaves, and does nothing for an element at rest.
 */
export function updatePresence(
  state: PresenceMotionState,
  element: HTMLElement | null,
  {
    appear,
    kind,
    present,
    reduced,
  }: {
    appear: boolean;
    kind: PresenceKind;
    present: boolean;
    reduced: boolean;
  },
  onGone: () => void,
): void {
  const first = state.was === null;
  const wasPresent = state.was;
  state.was = present;
  if (!element) return;
  const current = state.running;
  if (reduced || typeof element.animate !== "function") {
    current?.cancel();
    state.running = null;
    unclip(element);
    if (!present) onGone();
    return;
  }
  if (present && (first ? !appear : wasPresent)) return;
  const animation = playPresence(element, kind, present, current, () => {
    if (state.running !== animation) return;
    state.running = null;
    if (!present) onGone();
  });
  state.running = animation;
}

/**
 * Stops the presence of an element that unmounts. React's Strict Mode runs
 * this between the two mounts of a component in development: the cancel stops
 * the motion before its end, where the element is unclipped, so the state
 * starts over and the second mount plays the presence again and unclips it.
 */
export function stopPresence(state: PresenceMotionState): void {
  state.running?.cancel();
  state.running = null;
  state.was = null;
}

/**
 * Where an element is seen against the box of `origin`. A glide starts where
 * the element was seen, also when the commit scrolled a list that scrolls
 * (scroll anchoring does when items move), so the place is not taken against
 * the scrolled content.
 */
type Place = { height: number; left: number; top: number; width: number };

function placeIn(element: Element, originBox: DOMRect): Place {
  const box = element.getBoundingClientRect();
  return {
    height: box.height,
    left: box.left - originBox.left,
    top: box.top - originBox.top,
    width: box.width,
  };
}

/**
 * Where the parts were before a commit, against the box the origin had then.
 * The origin can move in the commit itself, such as a centred set that loses
 * a part, so a glide adds the origin's own move to start where the part was
 * seen.
 */
type Before = { origin: DOMRect; places: Map<HTMLElement, Place> };

/** The glide that runs on a part, to measure where it stands when it changes. */
const glides = new WeakMap<Element, Animation>();

/** Marks the picture of a part that has left; it is no part itself. */
export const motionGhostAttribute = "data-motion-ghost";

export type GlideOnChangeProps = {
  /** What the set is: a new value means it changed. */
  change: unknown;
  /** The element the parts are placed against; it has a box of its own. */
  origin: () => HTMLElement | null;
  /** The elements that glide. */
  parts: () => Iterable<HTMLElement>;
  /**
   * The set's parts come and go without a presence of their own: a new part
   * fades in, and a part that has left stays as a picture that fades out
   * where it was and takes no input.
   */
  presence?: boolean | undefined;
  reduced: boolean;
};

/**
 * Glides the parts of a set to their new place when the set changes (rulebook
 * M7), as a FLIP: Vue's TransitionGroup and Svelte's animate:flip move items
 * the same way. Before the commit it measures where each part is, after it
 * where each one is now; every part then shows at its old place in the frame
 * the commit renders and moves home on the compositor from the frame after
 * (`playFromSecondFrame`), with a translate added to its own. A part that is
 * still on its way glides on from where it stands. Measured in
 * getSnapshotBeforeUpdate, as Motion's layout animations measure, so it
 * renders nothing. The lifecycle methods are marked `override`, so an app
 * that compiles the installed source with `noImplicitOverride` passes.
 */
export class GlideOnChange extends React.Component<GlideOnChangeProps> {
  override getSnapshotBeforeUpdate(
    previous: Readonly<GlideOnChangeProps>,
  ): Before | null {
    if (previous.change === this.props.change || this.props.reduced) {
      return null;
    }
    const origin = this.props.origin();
    if (!origin || typeof origin.animate !== "function") return null;
    const originBox = origin.getBoundingClientRect();
    const places = new Map<HTMLElement, Place>();
    for (const part of this.props.parts())
      places.set(part, placeIn(part, originBox));
    return { origin: originBox, places };
  }

  override componentDidUpdate(
    _previous: Readonly<GlideOnChangeProps>,
    _state: unknown,
    before: Before | null,
  ): void {
    if (before) glideParts(this.props, before);
  }

  override render(): null {
    return null;
  }
}

function glideParts(
  { origin: originOf, parts: partsOf, presence }: GlideOnChangeProps,
  { origin: originBefore, places: before }: Before,
) {
  const origin = originOf();
  if (!origin) return;
  const parts = [...partsOf()];
  // A part that still glides stood where it was measured; it goes on from
  // there, measured now without its glide.
  for (const part of parts) glides.get(part)?.cancel();
  const originBox = origin.getBoundingClientRect();
  // How far the origin itself moved in the commit, in the page.
  const moved = {
    left: originBefore.left - originBox.left,
    top: originBefore.top - originBox.top,
  };
  const timing = keyframeTiming(
    origin,
    "--motion-duration-expand",
    "--motion-ease-standard",
  );
  for (const part of parts) {
    const was = before.get(part);
    if (!was) {
      if (presence) fadeIn(part, timing);
      continue;
    }
    const now = placeIn(part, originBox);
    const x = was.left + moved.left - now.left;
    const y = was.top + moved.top - now.top;
    if (Math.abs(x) < 0.5 && Math.abs(y) < 0.5) continue;
    // A part that is leaving (Motion pops it out of the flow, against the
    // origin) fades where it was seen, without travel (M2), also when the
    // origin moved under it; the others glide home.
    const leaving = part.hasAttribute("data-motion-pop-id");
    const glide = playFromSecondFrame(
      part,
      [
        { translate: `${x}px ${y}px` },
        { translate: leaving ? `${x}px ${y}px` : "0px 0px" },
      ],
      {
        ...timing,
        composite: "add",
        ...(leaving ? { fill: "forwards" as const } : {}),
      },
    );
    glides.set(part, glide);
  }
  if (!presence) return;
  for (const [part, was] of before)
    if (!part.isConnected)
      leavePicture(
        part,
        { ...was, left: was.left + moved.left, top: was.top + moved.top },
        origin,
        timing,
      );
}

function fadeIn(part: HTMLElement, timing: KeyframeAnimationOptions) {
  playFromSecondFrame(
    part,
    [presenceGone.scale(part), presenceNow.scale(part)],
    timing,
  );
}

/**
 * A copy of a part that has left, at the place it had, fading out under its
 * neighbours as they glide over its place; Base UI keeps such a copy of a
 * popup's previous content for the same reason. The part itself is gone at
 * once, so focus, keyboard order and assistive technology move on as they
 * always did.
 */
function leavePicture(
  part: HTMLElement,
  was: Place,
  origin: HTMLElement,
  timing: KeyframeAnimationOptions,
) {
  const picture = part.cloneNode(true) as HTMLElement;
  for (const element of [picture, ...picture.querySelectorAll("[id]")])
    element.removeAttribute("id");
  Object.assign(picture.style, {
    height: `${was.height}px`,
    left: `${was.left}px`,
    margin: "0",
    position: "absolute",
    top: `${was.top}px`,
    width: `${was.width}px`,
  });
  // The holder comes first in the origin, so the picture paints under the
  // parts that glide over its place, and it is no part's neighbour: a rule for
  // what follows a part does not match. It covers the padding box, where an
  // absolute child sits, from the origin's box: the picture stands where the
  // part was seen, and scrolls with the content.
  const holder = origin.ownerDocument.createElement("div");
  holder.setAttribute(motionGhostAttribute, "");
  holder.setAttribute("aria-hidden", "true");
  holder.inert = true;
  Object.assign(holder.style, {
    height: `${origin.clientHeight}px`,
    left: `${origin.scrollLeft - origin.clientLeft}px`,
    pointerEvents: "none",
    position: "absolute",
    top: `${origin.scrollTop - origin.clientTop}px`,
    width: `${origin.clientWidth}px`,
  });
  holder.append(picture);
  origin.prepend(holder);
  const fade = playFromSecondFrame(
    picture,
    [
      { opacity: Number(getComputedStyle(picture).opacity) },
      {
        opacity: 0,
        scale: measureNumber(picture, "--motion-presence-scale", 0.96),
      },
    ],
    { ...timing, fill: "forwards" },
  );
  fade.onfinish = () => holder.remove();
  fade.oncancel = () => holder.remove();
}

type Timed = {
  /** Reduced motion: every animation is instant. */
  reduced: boolean;
  /** The timing of an animation, measured when it starts. */
  resolve: () => Transition;
};

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
export const swapFadeClassName = "sp-swap-fade";

/**
 * A Tabs panel switches at once instead (Lukas, 13 October 2026): the panel that
 * leaves is hidden the moment the new one shows, as tabs do in the WAI-ARIA
 * pattern and most interfaces. A dissolve showed both panels' text at once
 * wherever a panel has no surface of its own, and a fade through of a whole
 * panel leaves a moment with neither. The indicator and the height of the
 * panels' container carry the motion; the height follows over the expand
 * duration (the follow rule in motion.css). The class is the kit's
 * panel-switch rule in motion.css.
 */
export const panelSwitchClassName = "sp-panel-switch";

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
