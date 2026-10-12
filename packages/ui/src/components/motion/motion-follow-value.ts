"use client";

import {
  animate,
  motion,
  useMotionValue,
  type MotionValue,
} from "motion/react";
import * as React from "react";

import { useReducedMotionPreference } from "../../system/motion/use-reduced-motion-preference";
import { measureTiming } from "./motion-presence";

/**
 * Something that follows a target: the crosshair of a chart that glides to the
 * next item, the card of a tooltip that trails it, a pill under the axis. A
 * component hands over where the target is now and binds what it gets back to
 * an element; it writes no animation loop of its own. The glide is a spring
 * that never overshoots, timed by a `--motion-duration-*` token of the chart's
 * own container, read when a glide starts (rulebook M1). Reduced motion (M5)
 * puts every follower at its target at once, and the first render shows the
 * target, so the server and the client agree.
 */

/** The token the pointer's followers take: the crosshair, the dots and the pill of a chart. */
export const FOLLOW_DURATION = "--motion-duration-follow";
/** The token a card takes that trails them, so it visibly lags the item it belongs to. */
export const FOLLOW_TRAIL_DURATION = "--motion-duration-follow-trail";

/** A spring that Motion's `animate` takes: stiffness and damping instead of a duration, so a value that is sent to a new target on the way keeps its speed. */
export type FollowSpring = {
  damping: number;
  mass: 1;
  restDelta: number;
  restSpeed: number;
  stiffness: number;
  type: "spring";
};

/**
 * The spring that brings a value to its target in `seconds` without bouncing:
 * critically damped, with the frequency Motion's own `visualDuration` gives a
 * spring of that duration (`2π / 1.2 seconds`), so the value is at 97 % of the
 * way after `seconds` and sits on the target soon after. Motion's duration-based
 * springs forget the speed of a value that is retargeted on the way; these keep
 * it, and a pointer that sweeps across items moves the follower on without
 * stopping at each of them.
 */
export function followSpring(seconds: number): FollowSpring {
  const frequency = (2 * Math.PI) / (1.2 * seconds);
  return {
    damping: 2 * frequency,
    mass: 1,
    // A hundredth of a pixel and a tenth of a pixel a second: still for the eye.
    restDelta: 0.01,
    restSpeed: 0.1,
    stiffness: frequency * frequency,
    type: "spring",
  };
}

/** How a change of the target is shown. */
export type FollowMode = "glide" | "jump";

/**
 * A follower glides only while it is active and was active before: one that
 * comes in is put where its target is, instead of gliding from where it was
 * last seen. It also jumps when motion is reduced and when the token gives it
 * no time.
 */
export function followMode({
  active,
  reduced,
  seconds,
  wasActive,
}: {
  active: boolean;
  reduced: boolean;
  seconds: number;
  wasActive: boolean;
}): FollowMode {
  return active && wasActive && !reduced && seconds > 0 ? "glide" : "jump";
}

/**
 * Sends a follower to its target: puts the value there at once (`jump`), or
 * glides it there and returns what stops the glide. A glide that has nothing to
 * cover is not started.
 */
export function startFollow(
  value: MotionValue<number>,
  target: number,
  mode: FollowMode,
  seconds: number,
): (() => void) | undefined {
  if (mode === "jump") {
    value.jump(target);
    return undefined;
  }
  if (value.get() === target) return undefined;
  const controls = animate(value, target, followSpring(seconds));
  return () => controls.stop();
}

export type FollowValueOptions = {
  /** The element whose motion tokens set the timing: the chart. The document root by default. */
  container?: React.RefObject<Element | null> | undefined;
  /** The token that sets how long a glide takes: `FOLLOW_DURATION` by default. */
  duration?: `--motion-duration-${string}` | undefined;
  /**
   * Whether the follower is in use. One that is not sits at its target; when it
   * becomes active it is already in its place, and glides from there on. A part
   * that fades out waits where it was and stays inactive until it is needed.
   */
  active?: boolean | undefined;
};

/**
 * A number that glides to its target when the target changes, as a motion value
 * to bind to an element (`followed.line`, `followed.circle`, ...): the element
 * moves frame by frame and the component does not render again. At rest the
 * value is the target itself.
 */
export function useFollowValue(
  target: number,
  {
    active = true,
    container,
    duration = FOLLOW_DURATION,
  }: FollowValueOptions = {},
): MotionValue<number> {
  const reduced = useReducedMotionPreference();
  const value = useMotionValue(target);
  const wasActive = React.useRef(active);

  React.useLayoutEffect(() => {
    const seconds =
      (
        measureTiming(
          container?.current ?? null,
          duration,
          "--motion-ease-standard",
        ) as { duration?: number }
      ).duration ?? 0;
    const mode = followMode({
      active,
      reduced,
      seconds,
      wasActive: wasActive.current,
    });
    wasActive.current = active;
    return startFollow(value, target, mode, seconds);
  }, [active, container, duration, reduced, target, value]);

  return value;
}

/**
 * Keeps `target` at what `derive` makes of `source`, now and every time `source`
 * moves, and returns what ends it. `derive` is read again at each move, so one
 * that changes with the component is always the latest.
 */
export function bindDerived(
  source: MotionValue<number>,
  target: MotionValue<number>,
  derive: () => (value: number) => number,
): () => void {
  const follow = (value: number) => target.set(derive()(value));
  follow(source.get());
  return source.on("change", follow);
}

/**
 * A motion value that is a function of another and moves with it: a mark that
 * rides a curve while it glides along it, whose height is the curve's at the
 * place it has reached. It starts at what `derive` makes of the source.
 */
export function useFollowDerived(
  source: MotionValue<number>,
  derive: (value: number) => number,
): MotionValue<number> {
  const derived = useMotionValue(derive(source.get()));
  const latest = React.useRef(derive);
  latest.current = derive;
  React.useLayoutEffect(
    () => bindDerived(source, derived, () => latest.current),
    [derived, source],
  );
  // A `derive` that changes while the source stands still moves the value too.
  React.useLayoutEffect(() => {
    derived.set(derive(source.get()));
  });
  return derived;
}

/** Two numbers that glide to the place of a point; see `useFollowValue`. */
export function useFollowPoint(
  target: { x: number; y: number },
  options?: FollowValueOptions,
): { x: MotionValue<number>; y: MotionValue<number> } {
  return {
    x: useFollowValue(target.x, options),
    y: useFollowValue(target.y, options),
  };
}

/**
 * Renders the component again at every frame in which one of the values moves.
 * For a part that has to hand the numbers on as props, such as the anchor of a
 * floating element; anything that can bind the motion values to an element
 * should do that instead, and not render.
 */
export function useFollowFrames(values: readonly MotionValue<number>[]): void {
  const [, render] = React.useReducer((count: number) => count + 1, 0);
  React.useEffect(() => {
    const stops = values.map((value) => value.on("change", render));
    return () => {
      for (const stop of stops) stop();
    };
    // The motion values are the same ones for as long as the component lives.
  }, values);
}

/**
 * The elements that follow a motion value from `useFollowValue`: an attribute
 * or the style of one takes the value, and the element moves with it. A path
 * has no position attribute, so it moves through its style: `style={{ x, y }}`
 * translates it.
 */
export const followed = {
  circle: motion.circle,
  div: motion.div,
  line: motion.line,
  path: motion.path,
  rect: motion.rect,
} as const;
