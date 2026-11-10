"use client";

import {
  type RefObject,
  useCallback,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from "react";

// The kit's media utilities (sm:, md:, lg:, ...) use Tailwind's default
// breakpoints, so the JS table names the same widths in the same unit, rem: a
// component that switches in JS (Sidebar's sheet, Header Navigation's menu)
// and its CSS switch at the same width at every default font size of the
// browser. md is 768 px at a 16 px font and 960 px at 20 px. In px the two
// parted at a larger font, and between them neither the sheet nor the desktop
// navigation showed (app finding 33, 10 November 2026).
const BREAKPOINTS = {
  "2xl": 96,
  "3xl": 100,
  "4xl": 125,
  lg: 64,
  md: 48,
  sm: 40,
  xl: 80,
} as const;

type Breakpoint = keyof typeof BREAKPOINTS;

type BreakpointQuery =
  Breakpoint | `max-${Breakpoint}` | `${Breakpoint}:max-${Breakpoint}`;

/** A breakpoint's width in rem, as Tailwind writes it; a number is px. */
function queryWidth(value: Breakpoint | number): string {
  return typeof value === "number" ? `${value}px` : `${BREAKPOINTS[value]}rem`;
}

// The range syntax of Tailwind's own queries, so a width between two whole
// pixels, as at a browser zoom, falls on one side and never between them.
function resolveMin(value: Breakpoint | number): string {
  return `(width >= ${queryWidth(value)})`;
}

function resolveMax(value: Breakpoint | number): string {
  return `(width < ${queryWidth(value)})`;
}

/** The root element's font size in px, which a container query's rem is. */
function rootFontSize(): number {
  const size = Number.parseFloat(
    getComputedStyle(document.documentElement).fontSize,
  );
  return Number.isFinite(size) && size > 0 ? size : 16;
}

function parseQuery(
  query: BreakpointQuery | MediaQueryInput | (string & {}),
): string {
  if (typeof query !== "string") {
    const parts: string[] = [];
    if (query.min != null) parts.push(resolveMin(query.min));
    if (query.max != null) parts.push(resolveMax(query.max));
    if (query.pointer === "coarse") parts.push("(pointer: coarse)");
    if (query.pointer === "fine") parts.push("(pointer: fine)");
    if (parts.length === 0) return "(width >= 0px)";
    return parts.join(" and ");
  }

  if (query.startsWith("(")) return query;

  const parts: string[] = [];
  for (const segment of query.split(":")) {
    if (segment.startsWith("max-")) {
      const bp = segment.slice(4);
      if (bp in BREAKPOINTS) parts.push(resolveMax(bp as Breakpoint));
    } else if (segment in BREAKPOINTS) {
      parts.push(resolveMin(segment as Breakpoint));
    }
  }

  return parts.length > 0 ? parts.join(" and ") : query;
}

function getServerSnapshot(): boolean {
  return false;
}

export type MediaQueryInput = {
  min?: Breakpoint | number;
  max?: Breakpoint | number;
  /** Touch-like input (finger). Use "fine" for mouse/trackpad. */
  pointer?: "coarse" | "fine";
};

export function useMediaQuery(
  query: BreakpointQuery | MediaQueryInput | (string & {}),
): boolean {
  const mediaQuery = parseQuery(query);

  const subscribe = useCallback(
    (callback: () => void) => {
      if (typeof window === "undefined") return () => {};
      const mql = window.matchMedia(mediaQuery);
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    },
    [mediaQuery],
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(mediaQuery).matches;
  }, [mediaQuery]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useIsMobile(): boolean {
  return useMediaQuery("max-md");
}

/**
 * Whether the element in `ref` is narrower than a breakpoint (`max-lg`) or at
 * least that wide (`lg`): the container query of a component that switches in
 * JS at its own width, as Header Navigation does, under the names its
 * container query utilities use. The width is the breakpoint's rem in the root
 * element's font size, as a CSS container query counts it, so the JS and an
 * `@min-[64rem]` utility switch together at every font size. The server and
 * the first render, before the element is measured, get false. The element is
 * measured before the first paint and again whenever its width changes; it
 * renders together with the component that asks, as Header Navigation's row
 * does.
 */
export function useContainerQuery(
  ref: RefObject<Element | null>,
  query: Breakpoint | `max-${Breakpoint}`,
): boolean {
  const [matches, setMatches] = useState(false);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const max = query.startsWith("max-");
    const rem = BREAKPOINTS[(max ? query.slice(4) : query) as Breakpoint];
    const measure = (width: number) => {
      const px = rem * rootFontSize();
      setMatches(max ? width < px : width >= px);
    };
    measure(element.getBoundingClientRect().width);
    if (typeof ResizeObserver === "undefined") return;
    // A change of width is applied in the next frame, outside the observer's
    // callback, so a component that swaps its content never loops it.
    let frame = 0;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const width =
        entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => measure(width));
    });
    observer.observe(element);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [ref, query]);
  return matches;
}
