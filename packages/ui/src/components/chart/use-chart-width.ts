"use client";

import * as React from "react";

/** The width a chart lays out at on the server and in the first client render, before any measuring. */
export const CHART_FALLBACK_WIDTH = 640;

/**
 * The width to lay out at after a measurement: the measured width in whole
 * pixels, or the one before it when the element has none to give (hidden, or
 * not laid out yet).
 */
export function nextChartWidth(previous: number, measured: number): number {
  return Number.isFinite(measured) && measured > 0
    ? Math.round(measured)
    : previous;
}

// The width inside the padding, which is the width the chart draws in.
function contentWidth(element: HTMLElement): number {
  const style = getComputedStyle(element);
  return (
    element.clientWidth -
    (Number.parseFloat(style.paddingLeft) || 0) -
    (Number.parseFloat(style.paddingRight) || 0)
  );
}

/**
 * The content width of the element, so that a chart draws at the width it has.
 * It is `CHART_FALLBACK_WIDTH` on the server and in the first client render,
 * which keeps the server markup and hydration in step, and the measured width
 * as soon as the element is laid out: before the browser paints, and again
 * whenever the element is resized. It is never 0 or NaN: an element that is
 * hidden keeps the width it had.
 */
export function useChartWidth(
  ref: React.RefObject<HTMLElement | null>,
): number {
  const [width, setWidth] = React.useState(CHART_FALLBACK_WIDTH);

  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = (measured: number) =>
      setWidth((previous) => nextChartWidth(previous, measured));
    measure(contentWidth(element));
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (entry) measure(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}
