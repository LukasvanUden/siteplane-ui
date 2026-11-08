"use client";

import type { Transition } from "motion/react";
import * as React from "react";

import { getMotionTransitionFromCss } from "../../system/motion/css-transition";

/**
 * The timing and the moves of the Motion parts, kept apart from the components
 * so they can be checked without a browser. Durations and easings are measured
 * from the `--motion-*` tokens of the element itself when an animation starts
 * (rulebook M1), so a token set on any container around it applies; nothing
 * here invents a timing. Presence and glides run on the Web Animations API from
 * the frame after a change, and the rolling number hands its values to Motion.
 * A swap switches its content at once and moves only its container's height,
 * as a CSS transition (motion-follow.ts). Reduced motion (M5) makes everything
 * instant.
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
 * Handles the end of an animation the kit may cancel. A cancelled Web
 * Animation rejects its `finished` with an AbortError ("The animation was
 * canceled"); the kit cancels on purpose, on a change of course and on
 * unmount, so the rejection is expected. Browsers stay silent about it, while
 * a test runner such as Vitest reports it as unhandled. An animation without
 * `finished`, as some test doubles are, passes through.
 */
export function handleAnimationEnd<T extends Animation>(animation: T): T {
  const finished = animation.finished as Promise<Animation> | undefined;
  finished?.catch(() => undefined);
  return animation;
}

/**
 * Starts a keyframe animation that shows its first keyframe in the frame the
 * commit renders and plays from the frame after (`inSecondFrame`). The Web
 * Animations API runs it: translate, scale and opacity on the compositor,
 * height on the main thread. Every animation the kit creates starts here, so
 * the end of each is handled (`handleAnimationEnd`).
 */
export function playFromSecondFrame(
  element: Element,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
): Animation {
  const animation = handleAnimationEnd(element.animate(keyframes, options));
  animation.pause();
  inSecondFrame(() => {
    // An animation that was cancelled or replaced meanwhile stays so.
    if (animation.playState === "paused") animation.play();
  });
  return animation;
}

/**
 * The clip of an element while its height moves (rulebook M6-M8): its bottom
 * edge, past which content taller than the height shown would reach, and
 * nothing else, so a ring, a shadow or a focus ring that the content draws
 * outside its box at the top or the sides stays whole. The inset reaches a
 * viewport past the element on those three sides. `overflow-y: clip` cut the
 * top edge as well: a Card's ring at the top of a MotionSwap was gone for the
 * whole swap (4 November 2026). Being the clip of the whole element, it also
 * cuts the element's own shadow at its bottom edge, so a shadow belongs on the
 * content inside.
 */
export const heightClipPath = "inset(-100vmax -100vmax 0px -100vmax)";

/** The element's own `clip-path` while a height animation clips it. */
const clipped = new WeakMap<HTMLElement, string>();

function clip(element: HTMLElement) {
  if (clipped.has(element)) return;
  clipped.set(element, element.style.clipPath);
  element.style.clipPath = heightClipPath;
}

function unclip(element: HTMLElement) {
  const own = clipped.get(element);
  if (own === undefined) return;
  clipped.delete(element);
  element.style.clipPath = own;
}

/** A uniform `scale` as getComputedStyle reports it: "none" is 1. */
function scaleOf(value: string): number {
  const scale = Number.parseFloat(value);
  return Number.isFinite(scale) ? scale : 1;
}

/**
 * How an element comes and goes. `height`: a block that opens and closes its
 * height with a fade, a stack item or a reveal; what is below it moves with its
 * height, and it clips its content at its bottom edge while the height moves
 * (`heightClipPath`; at rest nothing is clipped, so focus rings, shadows and
 * menus at its edge stay whole). `scale`:
 * an item of a wrapping or horizontal set, a flow list, which fades in and
 * grows from `--motion-presence-scale` around its centre and fades and
 * shrinks out, without travel (M2), while its siblings glide
 * (`GlideOnChange`).
 */
export type PresenceKind = "height" | "scale";

/**
 * The curve each kind of presence takes, over the expand duration: a block
 * that opens its height takes the standard curve, and an item of a flow list
 * grows in from 80 % and shrinks out on the presence curve, `ease`, as
 * AlignUI's and HeroUI's tags do (Lukas, 8 November 2026: from 96 % on the
 * standard curve it hardly showed and read as hectic).
 */
const presenceEasing: Record<PresenceKind, `--motion-${string}`> = {
  height: "--motion-ease-standard",
  scale: "--motion-ease-presence",
};

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
    scale: measureNumber(element, "--motion-presence-scale", 0.8),
  }),
};

/**
 * Starts the presence motion of an element over the expand duration, on the
 * curve of its kind (`presenceEasing`): towards rest when it is present,
 * towards gone when it is not. A motion that still runs is replaced from what
 * it shows, so a change of course does not jump back. `then` runs when the
 * motion has finished.
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
        presenceEasing[kind],
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
export type Place = {
  height: number;
  left: number;
  top: number;
  width: number;
};

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
  /**
   * The set is a flow list, such as the tags of a Tag Group: its parts glide
   * on the presence curve, as the parts that come and go grow in on it, so
   * the whole set moves on one curve (Lukas, 8 November 2026, lab
   * "Animationen": Recommended). A stack glides on the standard curve.
   */
  flow?: boolean | undefined;
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
  { flow, origin: originOf, parts: partsOf, presence }: GlideOnChangeProps,
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
  // The parts of a flow list, and of a set whose parts grow in as flow items
  // do, glide on the presence curve, so the set moves on one curve; the parts
  // of a stack glide on the standard one.
  const timing = keyframeTiming(
    origin,
    "--motion-duration-expand",
    flow || presence ? presenceEasing.scale : "--motion-ease-standard",
  );
  // A part that comes or goes grows in or shrinks out as an item of a flow
  // list does, on the presence curve.
  const presenceTiming = presence
    ? keyframeTiming(origin, "--motion-duration-expand", presenceEasing.scale)
    : timing;
  for (const part of parts) {
    const was = before.get(part);
    if (!was) {
      if (presence) fadeIn(part, presenceTiming);
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
        presenceTiming,
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
 * A picture of a part: a copy of it without the ids, which would repeat the
 * part's, standing out of the flow at `was`, against the box of the ghost
 * holder it goes into. It is no part itself; its holder hides it from
 * assistive technology and keeps it from input.
 */
export function pictureOf(part: HTMLElement, was: Place): HTMLElement {
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
  return picture;
}

/**
 * The holder of the pictures of parts that have left, in `origin`, covering
 * `box` against the origin's padding box, where an absolute child sits. It
 * comes first in the origin, so the pictures paint under the parts that glide
 * over their place, and it is no part's neighbour: a rule for what follows a
 * part does not match. It is hidden from assistive technology, inert and takes
 * no pointer, and it clips what it holds to `box` when `clip` is set.
 */
export function ghostHolder(
  origin: HTMLElement,
  box: Place,
  clip = false,
): HTMLElement {
  const holder = origin.ownerDocument.createElement("div");
  holder.setAttribute(motionGhostAttribute, "");
  holder.setAttribute("aria-hidden", "true");
  holder.inert = true;
  Object.assign(holder.style, {
    height: `${box.height}px`,
    left: `${box.left}px`,
    pointerEvents: "none",
    position: "absolute",
    top: `${box.top}px`,
    width: `${box.width}px`,
    ...(clip ? { overflow: "clip" } : {}),
  });
  origin.prepend(holder);
  return holder;
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
  const picture = pictureOf(part, was);
  // The holder covers the padding box from the origin's box: the picture
  // stands where the part was seen, and scrolls with the content.
  const holder = ghostHolder(origin, {
    height: origin.clientHeight,
    left: origin.scrollLeft - origin.clientLeft,
    top: origin.scrollTop - origin.clientTop,
    width: origin.clientWidth,
  });
  holder.append(picture);
  const fade = playFromSecondFrame(
    picture,
    [
      { opacity: Number(getComputedStyle(picture).opacity) },
      {
        opacity: 0,
        scale: measureNumber(picture, "--motion-presence-scale", 0.8),
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

/**
 * The timing of a swap (rulebook M8): `--motion-duration-base` on the standard
 * curve, over which a swap container's height follows its new content (the
 * follow rule in motion.css). The content itself switches at once, so what
 * leaves and what takes over are never seen together and there is never a
 * moment with neither (Lukas, 4 November 2026: the fade through, the old
 * content out within the micro duration and the new content in during the last
 * micro duration of the base duration, read as a flash). A part that plays
 * beside a swap, such as the frame of an Editable's field, ends within it.
 */
export function measureSwapTiming(element: Element | null): Transition {
  return measureTiming(
    element,
    "--motion-duration-base",
    "--motion-ease-standard",
  );
}

/**
 * The switch of content that a component keeps mounted while it leaves, as
 * Base UI keeps a Tabs panel until its exit transition has run: the part that
 * leaves (`data-ending-style`) is hidden the moment the part that takes over
 * shows, as tabs do in the WAI-ARIA pattern and most interfaces, and as a
 * MotionSwap replaces its content (rulebook M8). Tabs panels take it (Lukas,
 * 13 October 2026: a dissolve showed both panels' text at once wherever a
 * panel has no surface of its own), and so do the Filter Bar's tab list and
 * search field, an Editable's pencil and optional triggers, and the axis labels
 * and grid lines that new data brings to a chart, which faded through until
 * 4 November 2026. The height of the container carries the motion (the follow
 * rule in motion.css), a Tabs indicator glides and a chart's axis moves with
 * its data. The class is the kit's panel-switch rule in motion.css.
 */
export const panelSwitchClassName = "sp-panel-switch";

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
 * A block of a vertical stack as it is seen against the element the stack
 * stands in: where it starts and how much of its height shows.
 */
export type StackBlock = { height: number; key: React.Key; top: number };

/**
 * Where a block of a stack starts and how much of it shows, at the start of a
 * step (`from`) and at its end (`to`).
 */
export type StackMove = {
  from: { height: number; top: number };
  key: React.Key;
  to: { height: number; top: number };
};

/**
 * One step of a vertical stack whose blocks leave, enter and move at once,
 * played as a stack whose blocks open and close their height in the flow
 * (rulebook M6, M7): a block that leaves closes where it was, after the block
 * it followed (`mergeLeaving`), a block that enters opens after the block
 * before it, and every block after them moves with them. `before` lists the
 * blocks as they were seen and `after` the blocks there are now, each from the
 * top; a block keeps its key. A block that stays moves from where it was seen
 * to where it is. A block that enters starts with no height where the stack
 * had room for it, and a block that leaves ends with none where the stack
 * closes over it; the space before either is the one it has in the stack it is
 * part of. Played over one duration on one curve, every block meets the next
 * at each frame, as in a FLIP of the blocks that stay, which Vue's
 * TransitionGroup and Motion's popLayout play.
 */
export function planStack(
  before: readonly StackBlock[],
  after: readonly StackBlock[],
): StackMove[] {
  const was = new Map(before.map((block) => [block.key, block]));
  const is = new Map(after.map((block) => [block.key, block]));
  // Typed here, so that the keys stay React.Key in every program that compiles
  // this file; a `flatMap` over a conditional array let some of them widen.
  const leaving: Array<Pick<Leaving, "after" | "key">> = [];
  before.forEach((block, index) => {
    if (is.has(block.key)) return;
    leaving.push({
      after: index > 0 ? before[index - 1]!.key : null,
      key: block.key,
    });
  });
  const moves: StackMove[] = [];
  let previous: StackMove | undefined;
  for (const key of mergeLeaving(
    after.map((block) => block.key),
    leaving,
  )) {
    const old = was.get(key);
    const now = is.get(key);
    const end = (move: StackMove, at: "from" | "to") =>
      move[at].top + move[at].height;
    let move: StackMove;
    if (old && now) {
      move = {
        from: { height: old.height, top: old.top },
        key,
        to: { height: now.height, top: now.top },
      };
    } else if (now) {
      // The space after the block before it is the one it has now.
      const top = previous
        ? end(previous, "from") + now.top - end(previous, "to")
        : now.top;
      move = {
        from: { height: 0, top },
        key,
        to: { height: now.height, top: now.top },
      };
    } else {
      // The space after the block before it is the one it had.
      const top = previous
        ? end(previous, "to") + old!.top - end(previous, "from")
        : old!.top;
      move = {
        from: { height: old!.height, top: old!.top },
        key,
        to: { height: 0, top },
      };
    }
    moves.push(move);
    previous = move;
  }
  return moves;
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
