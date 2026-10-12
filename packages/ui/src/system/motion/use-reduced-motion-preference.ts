"use client";

import * as React from "react";

import { useSiteplaneMotionPreset } from "./siteplane-motion-provider";

const systemQuery = "(prefers-reduced-motion: reduce)";

/**
 * Reduced motion as the kit understands it: the system preference or
 * `html[data-motion-reduce="true"]`. `SiteplaneMotionProvider preset="reduced"`
 * is added by the hook, because the provider is context, not a document state.
 * Code that measures or moves an element outside React's render, such as the
 * flip of a popover, passes that element: inside the reduced preset, whose
 * scope a portal carries along, it reads as reduced too.
 */
export function readReducedMotion(element?: Element | null): boolean {
  if (typeof document === "undefined") return false;
  return (
    document.documentElement.dataset.motionReduce === "true" ||
    (typeof window.matchMedia === "function" &&
      window.matchMedia(systemQuery).matches) ||
    Boolean(element?.closest('[data-sp-motion="reduced"]'))
  );
}

function subscribe(onChange: () => void): () => void {
  const cleanups: Array<() => void> = [];
  if (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function"
  ) {
    const query = window.matchMedia(systemQuery);
    query.addEventListener("change", onChange);
    cleanups.push(() => query.removeEventListener("change", onChange));
  }
  if (typeof MutationObserver !== "undefined") {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, {
      attributeFilter: ["data-motion-reduce"],
      attributes: true,
    });
    cleanups.push(() => observer.disconnect());
  }
  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}

/**
 * Whether motion is reduced right now (rulebook M5): the system preference,
 * `html[data-motion-reduce="true"]` or `SiteplaneMotionProvider preset="reduced"`.
 *
 * The server and the hydration pass report `false` unless the provider asks for
 * the reduced preset, so the markup matches what the server rendered; the real
 * value follows in the next render. Markup that depends on it is hydration-safe
 * without any effort of its own, unlike `useReducedMotion()` from `motion/react`,
 * which already returns the client value while hydrating.
 */
export function useReducedMotionPreference(): boolean {
  const preset = useSiteplaneMotionPreset();
  const reduced = React.useSyncExternalStore(
    subscribe,
    readReducedMotion,
    () => false,
  );
  return reduced || preset === "reduced";
}
