"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

/**
 * Whether an element shows only part of its content: the content is wider or
 * taller than the element's box, so an ellipsis or a line clamp cuts it. One
 * pixel of slack absorbs the rounding of fractional sizes.
 */
export function isTruncated(element: Element): boolean {
  return (
    element.scrollHeight > element.clientHeight + 1 ||
    element.scrollWidth > element.clientWidth + 1
  );
}

/** Told whether its element is cut, with the element. */
export type TruncationListener = (truncated: boolean, element: Element) => void;

/*
 * One ResizeObserver serves every element the kit watches for a cut, such as a
 * Button label or a Truncate. It reads an element after the element's first
 * layout and whenever its size changes.
 */
let observer: ResizeObserver | null | undefined;
const listeners = new WeakMap<Element, TruncationListener>();

/**
 * Tells `listener` whether `element` is cut, after the element's first layout
 * and whenever its size changes, until the returned function stops it. Where
 * the browser has no ResizeObserver it tells nothing.
 */
export function observeTruncation(
  element: Element,
  listener: TruncationListener,
): () => void {
  if (observer === undefined)
    observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver((entries) => {
            for (const { target } of entries)
              listeners.get(target)?.(isTruncated(target), target);
          });
  if (!observer) return () => {};
  listeners.set(element, listener);
  observer.observe(element);
  return () => {
    observer?.unobserve(element);
    listeners.delete(element);
  };
}

/**
 * Whether the element of the returned ref is cut, for a part that shows its
 * full text only then, such as the tooltip of a Truncate. It is false on the
 * server and in the first render in the browser, so both render the same. The
 * element is measured before the first paint, after every render, since new
 * content can cut it without changing its size, and whenever its size changes.
 * With `enabled` false it measures nothing and stays false.
 */
export function useTruncated<T extends Element>(
  enabled = true,
): [ref: (element: T | null) => (() => void) | void, truncated: boolean] {
  const [truncated, setTruncated] = useState(false);
  const elementRef = useRef<T | null>(null);
  const ref = useCallback(
    (element: T | null): (() => void) | void => {
      if (!element || !enabled) return;
      elementRef.current = element;
      const stop = observeTruncation(element, (cut) => setTruncated(cut));
      return () => {
        stop();
        elementRef.current = null;
      };
    },
    [enabled],
  );
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (element) setTruncated(isTruncated(element));
  });
  return [ref, enabled && truncated];
}
