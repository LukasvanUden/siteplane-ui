"use client";

import type { Transition } from "motion/react";
import * as React from "react";

import { getMotionTransitionFromCss } from "./css-transition";
import { useReducedMotionPreference } from "./use-reduced-motion-preference";

const noLayoutTransition: Transition = { layout: { duration: 0 } };

export function useLayoutTransitionFromCss(
  ref: React.RefObject<Element | null> | null,
  durationVariable: `--motion-${string}`,
  easingVariable: `--motion-${string}`,
): { transition: Transition; reducedMotion: boolean } {
  // Hydration-safe: the server and the hydration pass report motion as not
  // reduced, so nothing that depends on it can mismatch.
  const reduceMotion = useReducedMotionPreference();
  const [transition, setTransition] =
    React.useState<Transition>(noLayoutTransition);

  React.useLayoutEffect(() => {
    const element = ref?.current;

    if (!element || reduceMotion) {
      setTransition(noLayoutTransition);
      return;
    }

    setTransition({
      layout: getMotionTransitionFromCss(
        element,
        durationVariable,
        easingVariable,
      ),
    });
  }, [durationVariable, easingVariable, reduceMotion, ref]);

  return { transition, reducedMotion: reduceMotion };
}
