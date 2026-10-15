"use client";

import { animate } from "motion/react";

import { getMotionTransitionFromCss } from "../../system/motion/css-transition";

/** A scroll the motion component runs; `stop` ends it where it is. */
export type ScrollMotion = { stop: () => void };

/** Reduced motion scrolls at once (rulebook M5): the document mode, the provider preset and the system setting. */
function scrollsAtOnce(element: HTMLElement): boolean {
  return (
    document.documentElement.dataset.motionReduce === "true" ||
    Boolean(element.closest('[data-sp-motion="reduced"]')) ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Scrolls an element along the inline axis to `left`, its physical
 * scrollLeft, which runs toward negative values in a right-to-left element. It
 * takes the tokens of a list that scrolls to a target (rulebook M1), read when
 * the scroll starts, so a token set on any container around the element
 * applies. With `smooth` false, or under reduced motion, it jumps there at
 * once and returns null.
 */
export function scrollInlineTo(
  element: HTMLElement,
  left: number,
  smooth: boolean,
): ScrollMotion | null {
  if (!smooth || scrollsAtOnce(element)) {
    element.scrollLeft = left;
    return null;
  }
  return animate(element.scrollLeft, left, {
    ...getMotionTransitionFromCss(
      element,
      "--motion-duration-moderate",
      "--motion-ease-standard",
    ),
    onUpdate: (value) => {
      element.scrollLeft = value;
    },
  });
}
