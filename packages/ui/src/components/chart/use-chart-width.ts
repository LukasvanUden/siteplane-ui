"use client";

import * as React from "react";

/**
 * The width a chart lays out at where nothing can be measured: in an
 * environment without `ResizeObserver`, such as a test DOM without layout.
 */
export const CHART_FALLBACK_WIDTH = 640;

/**
 * The width to lay out at after a measurement: the measured width in whole
 * pixels, or the one before it when the element has none to give (hidden, or
 * not laid out yet), which is null while the chart has never been measured.
 */
export function nextChartWidth(
  previous: number | null,
  measured: number,
): number | null {
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

// The height inside the padding, which is the height a chart that fills its
// box draws in.
function contentHeight(element: HTMLElement): number {
  const style = getComputedStyle(element);
  return (
    element.clientHeight -
    (Number.parseFloat(style.paddingTop) || 0) -
    (Number.parseFloat(style.paddingBottom) || 0)
  );
}

/**
 * The content width of the element, so that a chart draws at the width it has,
 * or null until it has been measured. A chart draws its plot only once it has
 * a width, as a chart that sizes to its container must: on the server and in
 * the first client render there is none, so the server markup holds the box of
 * the plot and nothing laid out for another width, and the hydrated markup
 * agrees with it. The width is measured as soon as the element is laid out,
 * before the browser paints, and again whenever the element is resized. An
 * element that is hidden keeps the width it had, and one that has never had a
 * width is measured when it is shown. Where nothing can be measured, without
 * `ResizeObserver`, the chart lays out at `CHART_FALLBACK_WIDTH`.
 *
 * A resize redraws the chart as a transition: while its container keeps
 * changing width, such as beside a sidebar that slides in or out, React may
 * skip the widths in between instead of drawing every frame, and the chart
 * ends at the final width. The first width is drawn at once.
 */
export function useChartWidth(
  ref: React.RefObject<HTMLElement | null>,
): number | null {
  const [width, setWidth] = React.useState<number | null>(null);

  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    let measured = false;
    const measure = (value: number) => {
      if (Number.isFinite(value) && value > 0) measured = true;
      setWidth((previous) => nextChartWidth(previous, value));
    };
    measure(contentWidth(element));
    if (typeof ResizeObserver === "undefined") {
      setWidth((previous) => previous ?? CHART_FALLBACK_WIDTH);
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (!entry) return;
      const value = entry.contentRect.width;
      if (measured) React.startTransition(() => measure(value));
      else measure(value);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}

/**
 * The content height of the element while `enabled`, for a chart that fills
 * the height of its box, or null until it has been measured and while it is
 * not enabled. It is measured as `useChartWidth` measures the width: once the
 * element is laid out, before the browser paints, and again whenever it is
 * resized, a resize as a transition. The element must take its height from its
 * container and not from what the chart draws in it, or the two would chase
 * each other: the chart's box is size-contained while it fills.
 */
export function useChartHeight(
  ref: React.RefObject<HTMLElement | null>,
  enabled: boolean,
): number | null {
  const [height, setHeight] = React.useState<number | null>(null);

  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!enabled || !element) return;
    let measured = false;
    const measure = (value: number) => {
      if (Number.isFinite(value) && value > 0) measured = true;
      setHeight((previous) => nextChartWidth(previous, value));
    };
    measure(contentHeight(element));
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (!entry) return;
      const value = entry.contentRect.height;
      if (measured) React.startTransition(() => measure(value));
      else measure(value);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, ref]);

  return enabled ? height : null;
}
