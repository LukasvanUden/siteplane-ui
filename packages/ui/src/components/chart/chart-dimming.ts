"use client";

/*
 * How far the rest of a chart steps back while one item is active: the bars
 * outside the active category, and the lines and areas outside the stretch
 * around the active point. The levels are Siteplane's own and light, so the
 * active item stands out without the rest going pale (80 %, and 90 % for an
 * area). bklit UI steps a bar and a line back to 30 % and an area to 60 %
 * (bar.tsx `fadedOpacity`, the `dimOpacity` of its line and area, all MIT). A
 * Pie Chart steps nothing back: its shares are shades of one hue, and a faded
 * share took the colour of another one. The two speeds are bklit's: a bar steps
 * back quickly, a whole series slowly. They run on the kit's duration tokens
 * and ease in and out; reduced motion is instant.
 *
 * The same levels and speeds serve a series that steps back because the mouse
 * is over another one's entry in the legend, as in bklit UI
 * (series-hover-dim.tsx, bar.tsx `legendHoveredIndex`, chart-legend.tsx
 * `isFaded`, all MIT): the legend's own entries fade to the level of a line,
 * 80 %, where bklit's `opacity-40` fades them to 40 %.
 *
 * MIT License
 *
 * Copyright (c) 2026 uixmat
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { useReducedMotionPreference } from "../../system/motion/use-reduced-motion-preference";

/**
 * What an item that steps back is drawn at, from 0 to 1: the one place that says
 * how far each kind steps back. Lighter than bklit UI's levels, which are given
 * with each kind.
 */
export const CHART_DIM = {
  /** An area, its fill and its outline, outside the highlighted stretch (bklit: 0.6). */
  area: 0.9,
  /** A bar outside the active category (bklit: 0.3). */
  bar: 0.8,
  /** The stroke of a line outside the highlighted stretch (bklit: 0.3). */
  line: 0.8,
} as const;

export type ChartDimKind = keyof typeof CHART_DIM;

/**
 * The opacity of an item of `kind`: `CHART_DIM` while it steps back, nothing
 * (its own, 1) while it does not, so a chart at rest carries no opacity at all.
 */
export function chartDimOpacity(
  kind: ChartDimKind,
  dimmed: boolean,
): number | undefined {
  return dimmed ? CHART_DIM[kind] : undefined;
}

/**
 * How long the step takes, as the classes that carry it, on the kit's tokens:
 * bars and legend entries take `--motion-duration-fast` (150 ms, bklit's 0.15 s) and a
 * series, which has more to lose, `--motion-duration-linger` (380 ms, bklit's
 * 0.4 s), both easing in and out. Spelled out in full, because Tailwind finds a
 * class only where it is written whole.
 */
export const chartDimClassName = {
  mark: "transition-opacity duration-(--motion-duration-fast) ease-(--motion-ease-soft-in-out)",
  series:
    "transition-opacity duration-(--motion-duration-linger) ease-(--motion-ease-soft-in-out)",
} as const;

/**
 * Whether a series steps back because another series is the focused one, the
 * series whose entry in the legend has the mouse: every series but that one
 * does, and none does while no series is focused. A chart asks it for each mark
 * next to the rule of its active item, and a mark steps back when either rule
 * says so.
 */
export function seriesSteppedBack(
  focusedKey: string | null,
  key: string,
): boolean {
  return focusedKey !== null && focusedKey !== key;
}

/**
 * The level of a legend entry that steps back: the level of a line
 * (`CHART_DIM.line`, 80 %, where bklit's `opacity-40` fades its legend entries to
 * 40 %). An entry is HTML, which takes no `opacity` attribute, so the level is a
 * class, written whole for Tailwind; its test holds it to `CHART_DIM.line`. The
 * entry steps back over the `mark` speed.
 */
export const chartLegendDimClassName = "opacity-80";

/** The class of a step back of `speed`, or none when motion is reduced (rulebook M5). */
export function useChartDimClassName(
  speed: keyof typeof chartDimClassName,
): string | undefined {
  const reduced = useReducedMotionPreference();
  return reduced ? undefined : chartDimClassName[speed];
}
