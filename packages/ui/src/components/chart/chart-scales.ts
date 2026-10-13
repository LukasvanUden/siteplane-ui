import { extent, tickIncrement } from "d3-array";
import {
  scaleBand,
  scaleLinear,
  scalePoint,
  scaleUtc,
  type ScaleBand,
  type ScaleLinear,
  type ScalePoint,
  type ScaleTime,
} from "d3-scale";

// One tick for about every 48 px of an axis, never fewer than two intervals and
// never more than six (seven tick values), so that a tall chart does not read like
// ruled paper. Two ticks are never closer than 28 px: a label is 14 px tall.
const tickSpacing = 48;
const leastTickSpacing = 28;
const mostIntervals = 6;
const tickCount = (length: number) =>
  Math.min(
    mostIntervals,
    Math.max(2, Math.round(Math.abs(length) / tickSpacing)),
  );

/**
 * [min, max] of the finite values. It includes 0 unless `includeZero` is false,
 * and never has no span: nothing to span gives [0, 1], one equal value on its
 * own gives one unit on either side.
 */
export function valueExtent(
  values: Iterable<number | null>,
  { includeZero = true }: { includeZero?: boolean } = {},
): [number, number] {
  const finite: number[] = [];
  for (const value of values)
    if (typeof value === "number" && Number.isFinite(value)) finite.push(value);
  const [min, max] = extent(finite);
  if (min === undefined || max === undefined) return [0, 1];
  const low = includeZero ? Math.min(min, 0) : min;
  const high = includeZero ? Math.max(max, 0) : max;
  if (low !== high) return [low, high];
  return includeZero ? [0, 1] : [low - 1, high + 1];
}

// A domain with no span cannot be niced or ticked.
function spanning([low, high]: [number, number]): [number, number] {
  if (!Number.isFinite(low) || !Number.isFinite(high)) return [0, 1];
  return low === high ? [low, low + 1] : [low, high];
}

// The ticks that `valueScale` niced a domain for, so that `valueTicks` gives the
// ticks that the domain ends on instead of working them out again.
const niceTicks = new WeakMap<ScaleLinear<number, number>, number[]>();

type Nice = { domain: [number, number]; ticks: number[] };

/**
 * The domain that ends on ticks of the step that `hint` intervals ask for, found
 * in one pass: each end of the data moves out to the next multiple of the step.
 * d3's own nice() repeats this until the step stops changing, and each round can
 * widen the domain: -209 to 214 grows to -400 to 400.
 */
function niceFor(low: number, high: number, hint: number): Nice | null {
  const increment = tickIncrement(low, high, hint);
  // A step below 1 is one over -increment; counting whole steps keeps the sums exact.
  const whole = Math.abs(increment);
  if (!Number.isFinite(whole) || whole === 0) return null;
  const inSteps = (value: number) =>
    increment > 0 ? value / whole : value * whole;
  const inValues = (steps: number) =>
    increment > 0 ? steps * whole : steps / whole;
  const first = Math.floor(inSteps(low) + 1e-9);
  const last = Math.max(first + 1, Math.ceil(inSteps(high) - 1e-9));
  return {
    domain: [inValues(first), inValues(last)],
    ticks: Array.from({ length: last - first + 1 }, (_, index) =>
      inValues(first + index),
    ),
  };
}

/**
 * The nice domain and ticks of a value axis `length` px long: of the steps that
 * ask for one to six intervals, the one that leaves the least of the axis empty,
 * as long as its ticks are at least 28 px apart and at most seven. Among equal
 * ones, the one with about one tick for every 48 px. Null when no step fits.
 */
function niceAxis(low: number, high: number, length: number): Nice | null {
  const ideal = tickCount(length);
  const room = Math.min(
    mostIntervals,
    Math.max(2, Math.floor(Math.abs(length) / leastTickSpacing)),
  );
  let best: { empty: number; far: number; nice: Nice } | null = null;
  for (let hint = 1; hint <= mostIntervals; hint++) {
    const nice = niceFor(low, high, hint);
    if (!nice) continue;
    const intervals = nice.ticks.length - 1;
    if (intervals > room) continue;
    const span = nice.domain[1] - nice.domain[0];
    const empty = (span - (high - low)) / span;
    const far = Math.abs(intervals - ideal);
    const better =
      !best ||
      empty < best.empty - 1e-9 ||
      (Math.abs(empty - best.empty) <= 1e-9 &&
        (far < best.far ||
          (far === best.far && intervals > best.nice.ticks.length - 1)));
    if (better) best = { empty, far, nice };
  }
  return best ? best.nice : null;
}

/**
 * A linear scale onto the pixel range over a nice domain of the values: its ends
 * are ticks, there are at most seven of them, and the data fills most of the
 * axis. The step is picked for the length of the range, from the data itself, so
 * that -209 to 214 on a short axis gives -300 to 300, not -400 to 400.
 */
export function valueScale(
  domain: [number, number],
  range: [number, number],
): ScaleLinear<number, number> {
  const [first, second] = spanning(domain);
  const low = Math.min(first, second);
  const high = Math.max(first, second);
  const nice = niceAxis(low, high, range[1] - range[0]);
  const scale = scaleLinear()
    .domain(nice ? nice.domain : [low, high])
    .range(range);
  if (nice) niceTicks.set(scale, nice.ticks);
  else scale.nice(tickCount(range[1] - range[0]));
  return scale;
}

/**
 * A linear scale over exactly this domain, for a domain that is moving: a
 * domain that glides to a new one is not a nice one on the way.
 */
export function valueScaleAt(
  domain: readonly [number, number],
  range: [number, number],
): ScaleLinear<number, number> {
  return scaleLinear()
    .domain(spanning([domain[0], domain[1]]))
    .range(range);
}

/**
 * The tick values of a value axis `length` px long. For a scale from
 * `valueScale` they are the ticks it was niced for: its two ends and the steps
 * between them, seven values at most. For any other scale, about one tick for
 * every 48 px, at least two intervals and at most six.
 */
export function valueTicks(
  scale: ScaleLinear<number, number>,
  length: number,
): number[] {
  const own = niceTicks.get(scale);
  return own
    ? [...own]
    : scale.ticks(tickCount(length)).filter(Number.isFinite);
}

export function bandScale(
  keys: readonly string[],
  range: [number, number],
  { inner = 0.2, outer = 0.1 }: { inner?: number; outer?: number } = {},
): ScaleBand<string> {
  return scaleBand<string>()
    .domain(keys)
    .range(range)
    .paddingInner(inner)
    .paddingOuter(outer);
}

export function pointScale(
  keys: readonly string[],
  range: [number, number],
): ScalePoint<string> {
  return scalePoint<string>().domain(keys).range(range);
}

/**
 * A time scale from the first to the last date onto the range. One date sits in
 * the middle. It counts in UTC, as the charts write their dates in UTC, so its
 * calendar ticks fall on the same days on the server and in every time zone.
 */
export function timeScale(
  dates: readonly Date[],
  range: [number, number],
): ScaleTime<number, number> {
  const [first, last] = extent(dates);
  return scaleUtc<number, number>()
    .domain([first ?? new Date(0), last ?? new Date(1)])
    .range(range);
}

/** The space kept between the labels of an axis, in px. */
export const labelGap = 12;

// Two labels clear each other when the space between their edges is the gap.
const clear = (
  distance: number,
  width: number,
  neighbour: number,
  gap: number,
) => distance >= (width + neighbour) / 2 + gap;

/**
 * The step of an axis that shows every k-th label: one k for the whole axis, the
 * smallest for which no two labels that are shown overlap, so the labels keep an
 * even rhythm however many there are. `centres` are in px, ascending. When even
 * the widest step leaves no room, the step is the number of labels and only the
 * first is shown.
 */
export function labelStep(
  centres: readonly number[],
  widths: readonly number[],
  gap = labelGap,
): number {
  const count = centres.length;
  for (let step = 1; step < count; step++) {
    let previous = -1;
    let fits = true;
    for (let index = 0; index < count && fits; index += step) {
      fits =
        previous < 0 ||
        clear(
          centres[index]! - centres[previous]!,
          widths[index] ?? 0,
          widths[previous] ?? 0,
          gap,
        );
      previous = index;
    }
    if (fits) return step;
  }
  return Math.max(1, count);
}

/**
 * The labels of a time axis, on the time scale's own calendar ticks (days,
 * weeks, months, ...): as many as fit without any two overlapping, which the
 * calendar spaces evenly. They need not sit on data points. `widthOf` gives the
 * width of the label a date would have. When no tick fits, or the domain has no
 * span, the first date of the domain is the one label.
 */
export function calendarTicks(
  scale: ScaleTime<number, number>,
  widthOf: (date: Date) => number,
  gap = labelGap,
): Date[] {
  const [from = 0, to = 0] = scale.range();
  const fits = (ticks: readonly Date[]) =>
    ticks.every(
      (tick, index) =>
        index === 0 ||
        clear(
          scale(tick) - scale(ticks[index - 1]!),
          widthOf(tick),
          widthOf(ticks[index - 1]!),
          gap,
        ),
    );
  // From the most that could be drawn, one for every 24 px, down to one.
  for (
    let count = Math.max(1, Math.floor(Math.abs(to - from) / 24));
    count >= 1;
    count--
  ) {
    const ticks = scale.ticks(count);
    if (ticks.length > 0 && fits(ticks)) return ticks;
  }
  const [first] = scale.domain();
  return first ? [first] : [];
}

/**
 * Which labels of a moving axis to draw, so that no two that can be read
 * together overlap. A label at rest is always drawn. One that is leaving, and one
 * that is entering, is drawn only while no label it is read with is closer than
 * `gap` plus half the sizes of both: the labels at rest, and the others that go
 * or come with it. The old labels are out before the new ones are in, so a
 * leaving and an entering label are never read together. A set of labels that
 * glides into itself, as the labels of a value axis do while new data stretches
 * it, is therefore left out for as long as it would touch, and is never partly
 * there. `sizes` are the extents of the labels along the axis, in px.
 */
export function readableLabels(
  centres: readonly number[],
  sizes: readonly number[],
  presences: readonly ("entering" | "leaving" | undefined)[],
  gap = labelGap,
): boolean[] {
  return centres.map((centre, index) => {
    const presence = presences[index];
    if (!presence) return true;
    return centres.every((other, neighbour) => {
      const group = presences[neighbour];
      return (
        neighbour === index ||
        (group !== undefined && group !== presence) ||
        clear(
          Math.abs(other - centre),
          sizes[index] ?? 0,
          sizes[neighbour] ?? 0,
          gap,
        )
      );
    });
  });
}

// Measured once in Chromium against Wix Madefor Text at 12 px, the kit font
// before Inter: digits are 7.1 to 7.7 px wide, letters 6.2 to 7.5 px, a space
// or punctuation about 3.4 px, and m, w and % are wider. Inter, at the kit's
// weight and tracking, sets the same labels within 5 % of those widths. The
// estimate still errs on the wide side for numbers, so a label never lands
// closer to its neighbour than planned.
const narrowCharacter = /[ .,:;'!|il]/;
const wideCharacter = /[mwMW%@]/;
const digitCharacter = /[0-9]/;

/**
 * A width estimate for a label at 12 px in the kit font, so that the server and
 * the client lay out alike. Within about 15 % of the measured width.
 */
export function estimateLabelWidth(text: string): number {
  let width = 0;
  for (const character of text) {
    width += characterWidth(character);
  }
  return Math.round(width * 10) / 10;
}

// The ellipsis that ends a cut label, reckoned on the wide side.
const ellipsis = "…";
const ellipsisWidth = 10;

function characterWidth(character: string): number {
  if (character === ellipsis) return ellipsisWidth;
  return narrowCharacter.test(character)
    ? 3.4
    : wideCharacter.test(character)
      ? 9.5
      : digitCharacter.test(character)
        ? 7.3
        : 7;
}

/**
 * A label cut to `width` px as `estimateLabelWidth` reckons it, ending in an
 * ellipsis, or the label itself when it fits. An SVG label cannot truncate
 * itself, so a chart cuts the text before it draws it. The full text stays in
 * the tooltip and in what the chart reads to screen readers.
 */
export function truncateLabel(text: string, width: number): string {
  if (estimateLabelWidth(text) <= width) return text;
  let room = width - ellipsisWidth;
  let kept = "";
  for (const character of text) {
    room -= characterWidth(character);
    if (room < 0) break;
    kept += character;
  }
  return `${kept.trimEnd()}${ellipsis}`;
}
