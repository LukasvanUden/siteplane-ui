/*
 * Where the bars of a Bar Chart sit. Three ideas are adapted from bklit UI's
 * chart components (MIT): the bars of one category share its band with a fixed
 * gap between them (bar.tsx), a bar has a width floor (series-bar-layout.ts),
 * and the category under the pointer is the band the pointer is in, held to the
 * ends of the plot (bar-chart.tsx). Everything else is Siteplane's own, on the
 * chart core's scales and stacking.
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

import type { ScaleBand, ScaleLinear } from "d3-scale";

import {
  CHART_LABEL_COLUMN_GAP,
  CHART_LABEL_HEIGHT,
} from "../chart/chart-cartesian";
import { chartValue, chartXKey } from "../chart/chart-data";
import { nearestIndex } from "../chart/chart-interaction";
import {
  estimateLabelWidth,
  labelGap,
  labelStep,
  valueTicks,
} from "../chart/chart-scales";
import { stackSeries } from "../chart/chart-stack";
import type { ChartDatum, ChartXValue } from "../chart/chart-types";

/** The space between the bars of one category, in px, as long as the category has room for it. */
export const BAR_GAP = 4;
/**
 * The radius at the value end of a bar, in px: 8, as shadcn rounds its bars. It
 * is the kit's control radius, `--sp-rw-radius-control`, at the default md
 * radius. An SVG path cannot read a token, so the number is kept here in step
 * with it; a bar keeps it at every provider radius.
 */
export const BAR_RADIUS = 8;

// The room beyond the plot, in px, in which the pointer still finds the first and the last category.
const pointerSlack = 16;

/** A number in hundredths of a pixel, which keeps the markup short and the same on the server and the client. */
export const hundredths = (value: number) => Math.round(value * 100) / 100;

export type BarOrientation = "vertical" | "horizontal";

/** One bar in pixels, in the plot: its top-left corner and its size. */
export type BarRect = {
  /** `x|series`: the key of the bar, which stays with it while the data around it changes. */
  key: string;
  /** The key of its category. */
  x: string;
  series: string;
  /** The number it stands for. */
  value: number;
  x0: number;
  y0: number;
  width: number;
  height: number;
  /**
   * Which end is rounded: `end` is the value end, away from the 0 line, `start`
   * the end at the 0 line. A bar rounds only its value end, and in a stack only
   * the outer segment of each sign; the Bar Chart itself never asks for `start`.
   */
  rounded: "start" | "end" | "none";
};

/**
 * A bar before it has a length: its place across its category, which it keeps
 * while it lives, and the number it has right now. The numbers glide when new
 * data arrives, and the bars are laid out again at every step of the glide.
 */
export type BarSlot = {
  key: string;
  x: string;
  series: string;
  /** The place of the series among the series of the chart, which is the order of a stack. */
  order: number;
  value: number;
  /** Where the bar starts across its category, in px from the start of the category axis. */
  start: number;
  /** How thick the bar is across its category. */
  size: number;
};

/**
 * How thick the bars of a category are and where each starts inside its band.
 * A lone bar and stacked segments take the whole band, and side-by-side bars
 * share it with a gap, so the bars fill their band the way shadcn's do. In a
 * band too narrow for the gap the gap gives way first; a bar is never thinner
 * than 1 px, and bars that the band cannot hold at that thickness are centred
 * on it.
 */
function thickness(band: number, count: number, stacked: boolean) {
  if (stacked || count <= 1) {
    const size = Math.max(1, band);
    return {
      offsets: Array.from({ length: count }, () => (band - size) / 2),
      size,
    };
  }
  let gap = BAR_GAP;
  let size = (band - gap * (count - 1)) / count;
  if (size < 1) {
    size = 1;
    gap = Math.max(0, (band - count) / (count - 1));
  }
  const first = (band - (size * count + gap * (count - 1))) / 2;
  return {
    offsets: Array.from(
      { length: count },
      (_, index) => first + index * (size + gap),
    ),
    size,
  };
}

/**
 * Where the bar of the series at `order` sits in the band of its category, for
 * `count` series side by side or stacked: where it starts across the category
 * axis and how thick it is. The band is where the category is, in px.
 */
export function barPlace(
  band: { start: number; size: number },
  order: number,
  count: number,
  stacked: boolean,
): { start: number; size: number } {
  const { offsets, size } = thickness(band.size, count, stacked);
  return { size, start: hundredths(band.start + (offsets[order] ?? 0)) };
}

/**
 * The bars of the data before any length: one for every finite value, in the
 * order of the data and then of the series. A category that the scale does not
 * know has none, and neither has a missing value, which leaves its slot empty.
 * Categories must be unique; the chart makes repeated ones unique first.
 */
export function barSlots({
  data,
  x,
  seriesKeys,
  stacked,
  categoryScale,
}: {
  data: readonly ChartDatum[];
  x: string;
  seriesKeys: readonly string[];
  stacked: boolean;
  categoryScale: ScaleBand<string>;
}): BarSlot[] {
  const size = categoryScale.bandwidth();
  const slots: BarSlot[] = [];
  for (const datum of data) {
    const category = chartXKey(datum[x]);
    const start = categoryScale(category);
    if (start === undefined) continue;
    seriesKeys.forEach((series, order) => {
      const value = chartValue(datum, series);
      if (value === null) return;
      slots.push({
        ...barPlace({ size, start }, order, seriesKeys.length, stacked),
        key: `${category}|${series}`,
        order,
        series,
        value,
        x: category,
      });
    });
  }
  return slots;
}

/** The band of a category along its axis as fractions of the length of the axis, so that it says where the category is among the others and not how wide the chart is. */
export type BandFraction = { start: number; size: number };

// A fraction is kept to a billionth, so that the rounding noise of a chart that
// is a little wider or narrower does not make it a different fraction.
const billionths = (value: number) => Math.round(value * 1e9) / 1e9;

/**
 * Where the band of a category lies along its axis, as fractions of the axis. The
 * fractions depend on how many categories there are and where this one is, and
 * not on how wide the chart is: a chart that is resized keeps them. Null for a
 * category the scale does not know.
 */
export function categoryFractions(
  scale: ScaleBand<string>,
  key: string,
): BandFraction | null {
  const at = scale(key);
  if (at === undefined) return null;
  const [from = 0, to = 0] = scale.range();
  const length = Math.abs(to - from);
  if (length === 0) return { size: 0, start: 0 };
  return {
    size: billionths(scale.bandwidth() / length),
    start: billionths((at - Math.min(from, to)) / length),
  };
}

/**
 * The slots of the bars as they are drawn at this step of a glide. A bar that is
 * leaving stays where it stood, and a bar in a band that is moving is placed in
 * the band as it is now, so its place and thickness glide with the category; any
 * other bar is where its slot says. `bands` holds the categories whose band is
 * moving, as fractions of the `length` of the category axis, and `count` is the
 * number of series. Each slot gets the number it has at this step.
 */
export function glidingSlots(
  entries: readonly { leaving: boolean; slot: BarSlot; value: number }[],
  bands: ReadonlyMap<string, BandFraction>,
  {
    count,
    length,
    stacked,
  }: { count: number; length: number; stacked: boolean },
): BarSlot[] {
  return entries.map(({ leaving, slot, value }) => {
    const band = leaving ? undefined : bands.get(slot.x);
    return band
      ? {
          ...slot,
          ...barPlace(
            { size: band.size * length, start: band.start * length },
            slot.order,
            count,
            stacked,
          ),
          value,
        }
      : { ...slot, value };
  });
}

// A name for the category in the rows that are stacked, which no series can have.
const categoryField = "\u0000category";

/**
 * Where each bar of a stack starts and ends on the value axis, as `stackSeries`
 * puts them, and which bars end a stack: the outer segment of each sign in each
 * category. A segment of 0 has no extent and takes the end from none.
 */
function stackPlaces(slots: readonly BarSlot[]) {
  const rows = new Map<string, ChartDatum>();
  const orders = new Map<string, number>();
  for (const slot of slots) {
    const row = rows.get(slot.x) ?? { [categoryField]: slot.x };
    row[slot.series] = slot.value;
    rows.set(slot.x, row);
    if (!orders.has(slot.series)) orders.set(slot.series, slot.order);
  }
  // The order of the series, and for series of one place the order of the list.
  const keys = [...orders]
    .sort((a, b) => a[1] - b[1])
    .map(([series]) => series);
  const places = new Map<string, { y0: number; y1: number }>();
  const up = new Map<string, string>();
  const down = new Map<string, string>();
  for (const segment of stackSeries([...rows.values()], categoryField, keys)) {
    const key = `${segment.x}|${segment.series}`;
    places.set(key, { y0: segment.y0, y1: segment.y1 });
    if (segment.value > 0) up.set(segment.x, key);
    else if (segment.value < 0) down.set(segment.x, key);
  }
  return { ends: new Set([...up.values(), ...down.values()]), places };
}

/**
 * The bars at the numbers they have right now, in the order of the slots. Side
 * by side, a bar runs from the 0 line to its value; stacked, positive segments
 * pile up from the 0 line and negative ones down from it, in the order of the
 * series, so a stack stays whole whatever its segments are worth while they
 * glide. A bar of 0 has no extent. `valueScale` maps a number to a position in
 * the plot: from the top down for vertical bars, from the left for horizontal.
 */
export function barsAt(
  slots: readonly BarSlot[],
  {
    stacked,
    orientation,
    valueScale,
  }: {
    stacked: boolean;
    orientation: BarOrientation;
    valueScale: ScaleLinear<number, number>;
  },
): BarRect[] {
  const stack = stacked ? stackPlaces(slots) : null;
  return slots.map((slot) => {
    const place = stack?.places.get(slot.key);
    const from = valueScale(place ? place.y0 : 0);
    const to = valueScale(place ? place.y1 : slot.value);
    const near = hundredths(Math.min(from, to));
    const length = hundredths(Math.abs(to - from));
    const rounded: BarRect["rounded"] = (
      stack ? stack.ends.has(slot.key) : slot.value !== 0
    )
      ? "end"
      : "none";
    const base = {
      key: slot.key,
      rounded,
      series: slot.series,
      value: slot.value,
      x: slot.x,
    };
    return orientation === "vertical"
      ? { ...base, height: length, width: slot.size, x0: slot.start, y0: near }
      : { ...base, height: slot.size, width: length, x0: near, y0: slot.start };
  });
}

/**
 * The bars of the data at rest, in pixels: a band per category and the bars
 * inside it, side by side or stacked. The value end of a bar is rounded, the
 * outer segment of each sign when stacked; a bar takes the thickness of its band
 * (shared by the series side by side, with `BAR_GAP` between the bars of one
 * category) and is at least 1 px thick. A negative value grows from the 0 line
 * away from the positive ones.
 */
export function layoutBars({
  data,
  x,
  seriesKeys,
  stacked,
  orientation,
  categoryScale,
  valueScale,
}: {
  data: readonly ChartDatum[];
  x: string;
  seriesKeys: readonly string[];
  stacked: boolean;
  orientation: BarOrientation;
  categoryScale: ScaleBand<string>;
  valueScale: ScaleLinear<number, number>;
}): BarRect[] {
  return barsAt(barSlots({ categoryScale, data, seriesKeys, stacked, x }), {
    orientation,
    stacked,
    valueScale,
  });
}

type Rounding = readonly [
  topLeft: number,
  topRight: number,
  bottomRight: number,
  bottomLeft: number,
];

// A rectangle with its own radius at each corner. A corner of 0 draws no arc.
function roundedRectangle(
  x: number,
  y: number,
  width: number,
  height: number,
  [topLeft, topRight, bottomRight, bottomLeft]: Rounding,
): string {
  const arc = (radius: number, toX: number, toY: number) =>
    radius > 0 ? ` A${radius},${radius} 0 0 1 ${toX},${toY}` : "";
  return [
    `M${hundredths(x + topLeft)},${hundredths(y)}`,
    ` H${hundredths(x + width - topRight)}`,
    arc(topRight, hundredths(x + width), hundredths(y + topRight)),
    ` V${hundredths(y + height - bottomRight)}`,
    arc(
      bottomRight,
      hundredths(x + width - bottomRight),
      hundredths(y + height),
    ),
    ` H${hundredths(x + bottomLeft)}`,
    arc(bottomLeft, hundredths(x), hundredths(y + height - bottomLeft)),
    ` V${hundredths(y + topLeft)}`,
    arc(topLeft, hundredths(x + topLeft), hundredths(y)),
    " Z",
  ].join("");
}

/**
 * The outline of a bar: a rectangle with the radius at the end that is rounded,
 * which is the far side of the 0 line for `end` (the top of a positive vertical
 * bar, the bottom of a negative one, the right and the left of horizontal ones)
 * and the side at the 0 line for `start`. The radius never exceeds a quarter of
 * the thickness, so a thin bar keeps a light curve, or the length of the bar.
 */
export function barPath(
  { x0, y0, width, height, rounded, value }: BarRect,
  orientation: BarOrientation,
  radius: number = BAR_RADIUS,
): string {
  const vertical = orientation === "vertical";
  const r =
    rounded === "none"
      ? 0
      : Math.max(
          0,
          Math.min(
            radius,
            (vertical ? width : height) / 4,
            vertical ? height : width,
          ),
        );
  // The side of the value end, then of the start when that is the one rounded.
  const positive = value >= 0;
  const end = vertical
    ? positive
      ? "top"
      : "bottom"
    : positive
      ? "right"
      : "left";
  const opposite = {
    bottom: "top",
    left: "right",
    right: "left",
    top: "bottom",
  }[end];
  const side = rounded === "end" ? end : opposite;
  const corners: Rounding =
    side === "top"
      ? [r, r, 0, 0]
      : side === "bottom"
        ? [0, 0, r, r]
        : side === "left"
          ? [r, 0, 0, r]
          : [0, r, r, 0];
  return roundedRectangle(x0, y0, width, height, corners);
}

/** The space of a category along the category axis, in px: where it starts and how wide it is, a whole step between two categories, so that the spaces of all categories tile the plot. Its middle is where the tooltip of a category opens from the keyboard or a tap. Null for a category the scale does not know. */
export function categoryBand(
  scale: ScaleBand<string>,
  key: string,
): { start: number; size: number } | null {
  const at = scale(key);
  if (at === undefined) return null;
  const step = scale.step();
  return {
    size: hundredths(step),
    start: hundredths(at - (step - scale.bandwidth()) / 2),
  };
}

/** The centre of every category along the category axis, in px, in the order of `keys`. */
export function categoryCentres(
  scale: ScaleBand<string>,
  keys: readonly string[],
): number[] {
  return keys.map((key) =>
    hundredths((scale(key) ?? 0) + scale.bandwidth() / 2),
  );
}

/**
 * The category under a point along the category axis: the one whose centre is
 * nearest, which is the band the point is in, for a point anywhere in the plot
 * and a little beyond its ends. -1 for a point further out, and for no category.
 */
export function categoryAt(
  centres: readonly number[],
  along: number,
  length: number,
): number {
  if (along < -pointerSlack || along > length + pointerSlack) return -1;
  return nearestIndex(centres, along);
}

/** A label of the category axis: where it sits and what it says. */
export type CategoryLabel = { id: string; position: number; text: string };

/**
 * The labels of the category axis that are shown: every k-th label, one k for the
 * whole axis, the smallest that leaves none on top of another, so the labels keep
 * an even rhythm however many categories there are. Along the bottom they are as
 * wide as their text; down the left side as tall as a line.
 */
export function categoryLabels({
  centres,
  rows,
  side,
  format,
}: {
  centres: readonly number[];
  rows: readonly { id: string; x: ChartXValue }[];
  side: "bottom" | "left";
  format: (value: ChartXValue) => string;
}): CategoryLabel[] {
  const labels = rows.map((row, index) => ({
    id: row.id,
    position: centres[index] ?? 0,
    text: format(row.x),
  }));
  const step = labelStep(
    labels.map((label) => label.position),
    labels.map((label) =>
      side === "bottom" ? estimateLabelWidth(label.text) : CHART_LABEL_HEIGHT,
    ),
    side === "bottom" ? labelGap : CHART_LABEL_COLUMN_GAP,
  );
  return labels.filter((_, index) => index % step === 0);
}

/**
 * The ticks of a value axis that runs along the bottom, where a label takes the
 * room of its text: the ticks the axis has, or every k-th of them, the smallest
 * k for which no two labels touch. `write` gives the labels of a set of ticks.
 * The ticks that stay are still on the steps of the axis, so they keep the grid
 * lines on the places of the nice domain.
 */
export function fittingTicks(
  scale: ScaleLinear<number, number>,
  length: number,
  write: (ticks: readonly number[]) => string[],
): number[] {
  const ticks = valueTicks(scale, length);
  const step = labelStep(
    ticks.map(scale),
    write(ticks).map(estimateLabelWidth),
  );
  const kept = ticks.filter((_, index) => index % step === 0);
  // An axis keeps its two ends when every other tick has to go.
  return kept.length >= 2 || ticks.length < 2
    ? kept
    : [ticks[0]!, ticks[ticks.length - 1]!];
}
