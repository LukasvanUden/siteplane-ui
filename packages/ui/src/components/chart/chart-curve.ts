import type { ChartCurve } from "./chart-types";

/**
 * The curves of the charts, kept apart from the components so that they can be
 * checked without a DOM: the path through the data (smooth, monotone, straight
 * or stepped), and the same curve as heights at fixed places, which is what a
 * chart morphs when new data arrives.
 */
export type ChartPoint = readonly [x: number, y: number];

const round = (value: number) => Math.round(value * 100) / 100;
const pair = ([x, y]: ChartPoint) => `${round(x)},${round(y)}`;

// Monotone cubic interpolation (Steffen's method, as in d3's curveMonotoneX):
// a smooth path through every point. Each tangent is limited by the
// neighbouring slopes, so the curve never overshoots the data and flattens on
// a local extreme instead of showing a plateau at every point.
function monotoneTangents(points: readonly ChartPoint[]): number[] {
  const last = points.length - 1;
  const width = (i: number) => points[i + 1]![0] - points[i]![0];
  const slope = (i: number) => (points[i + 1]![1] - points[i]![1]) / width(i);
  const tangents: number[] = [];
  for (let i = 1; i < last; i++) {
    const before = slope(i - 1);
    const after = slope(i);
    const weighted =
      (before * width(i) + after * width(i - 1)) / (width(i - 1) + width(i));
    tangents[i] =
      (Math.sign(before) + Math.sign(after)) *
        Math.min(Math.abs(before), Math.abs(after), Math.abs(weighted) / 2) ||
      0;
  }
  tangents[0] = (3 * slope(0) - tangents[1]!) / 2;
  tangents[last] = (3 * slope(last - 1) - tangents[last - 1]!) / 2;
  return tangents;
}

// Natural cubic spline (d3's curveNatural for evenly spaced points, which is
// what shadcn's charts draw with `type="natural"`): the smooth path through
// every point whose bend runs on across each point, so that it never changes
// abruptly, and is straight at both ends. A monotone curve bends at each point
// on its own, which shows as a knee wherever the data turns from steep to flat.
// The price is that the spline can swing a little past the data between two
// points. Its tangents come from one tridiagonal system over the whole run
// (Thomas's algorithm), for points at any distance apart.
function naturalTangents(points: readonly ChartPoint[]): number[] {
  const last = points.length - 1;
  const width = (i: number) => points[i + 1]![0] - points[i]![0];
  const slope = (i: number) => (points[i + 1]![1] - points[i]![1]) / width(i);
  // Row i: below[i] * t[i - 1] + middle[i] * t[i] + above[i] * t[i + 1] = right[i].
  const below: number[] = [0];
  const middle: number[] = [2];
  const above: number[] = [1];
  const right: number[] = [3 * slope(0)];
  for (let i = 1; i < last; i++) {
    below[i] = width(i);
    middle[i] = 2 * (width(i - 1) + width(i));
    above[i] = width(i - 1);
    right[i] = 3 * (width(i) * slope(i - 1) + width(i - 1) * slope(i));
  }
  below[last] = 1;
  middle[last] = 2;
  above[last] = 0;
  right[last] = 3 * slope(last - 1);
  for (let i = 1; i <= last; i++) {
    const factor = below[i]! / middle[i - 1]!;
    middle[i] = middle[i]! - factor * above[i - 1]!;
    right[i] = right[i]! - factor * right[i - 1]!;
  }
  const tangents: number[] = [];
  tangents[last] = right[last]! / middle[last]!;
  for (let i = last - 1; i >= 0; i--)
    tangents[i] = (right[i]! - above[i]! * tangents[i + 1]!) / middle[i]!;
  return tangents;
}

// The tangents of a curve that bends: the natural spline for `smooth`, the
// monotone curve for `monotone`. Two points at the same x have no slope between
// them: a plot too narrow to part its points puts them there, and so do two
// rows on one date. The curve breaks at such a place into pieces that bend on
// their own, joined by a straight step from one point to the other, so no
// tangent divides by a width of 0. A piece of two points is a straight line,
// and a point on its own is level. A tangent that is still not a number is
// level as well, so that the curve stays drawable whatever the points are.
function tangentsOf(
  points: readonly ChartPoint[],
  curve: "smooth" | "monotone",
): number[] {
  const tangents: number[] = [];
  let from = 0;
  for (let i = 1; i <= points.length; i++) {
    if (i < points.length && points[i]![0] !== points[i - 1]![0]) continue;
    const piece = points.slice(from, i);
    if (piece.length > 2)
      tangents.push(
        ...(curve === "monotone"
          ? monotoneTangents(piece)
          : naturalTangents(piece)),
      );
    else if (piece.length === 2) {
      const [[x0, y0], [x1, y1]] = piece as [ChartPoint, ChartPoint];
      const slope = (y1 - y0) / (x1 - x0);
      tangents.push(slope, slope);
    } else tangents.push(0);
    from = i;
  }
  return tangents.map((tangent) => (Number.isFinite(tangent) ? tangent : 0));
}

// The control points of the cubic between point i and the next.
function segmentControls(
  points: readonly ChartPoint[],
  tangents: readonly number[],
  i: number,
): [out: ChartPoint, into: ChartPoint] {
  const [x0, y0] = points[i]!;
  const [x1, y1] = points[i + 1]!;
  const reach = (x1 - x0) / 3;
  return [
    [x0 + reach, y0 + reach * tangents[i]!],
    [x1 - reach, y1 - reach * tangents[i + 1]!],
  ];
}

// The path of cubics through the points along the given tangents, or straight
// lines for fewer than three points.
function bentPath(
  points: readonly ChartPoint[],
  curve: "smooth" | "monotone",
): string {
  const last = points.length - 1;
  if (last < 2)
    return points.map((point, i) => `${i ? "L" : "M"}${pair(point)}`).join(" ");
  const tangents = tangentsOf(points, curve);
  let path = `M${pair(points[0]!)}`;
  for (let i = 0; i < last; i++) {
    const [out, into] = segmentControls(points, tangents, i);
    path += ` C${pair(out)} ${pair(into)} ${pair(points[i + 1]!)}`;
  }
  return path;
}

/** The path through the points: a natural spline, or straight lines for fewer than three. */
export function naturalPath(points: readonly ChartPoint[]): string {
  return bentPath(points, "smooth");
}

/** The path through the points: a monotone curve, or straight lines for fewer than three. */
export function monotonePath(points: readonly ChartPoint[]): string {
  return bentPath(points, "monotone");
}

/** The path of straight lines through every point. */
export function linearPath(points: readonly ChartPoint[]): string {
  return points.map((point, i) => `${i ? "L" : "M"}${pair(point)}`).join(" ");
}

/**
 * The path of a step through every point: level from each point to the middle
 * between it and the next, then a vertical step to the height of the next
 * (d3's curveStep). It runs along horizontals and verticals only.
 */
export function stepPath(points: readonly ChartPoint[]): string {
  if (!points.length) return "";
  let path = `M${pair(points[0]!)}`;
  for (let i = 1; i < points.length; i++) {
    const [x0] = points[i - 1]!;
    const [x1, y1] = points[i]!;
    path += ` H${round((x0 + x1) / 2)} V${round(y1)} H${round(x1)}`;
  }
  return path;
}

/** The path through the points in the given curve. */
export function curvePath(
  points: readonly ChartPoint[],
  curve: ChartCurve,
): string {
  if (curve === "linear") return linearPath(points);
  if (curve === "step") return stepPath(points);
  if (curve === "monotone") return monotonePath(points);
  return naturalPath(points);
}

/**
 * The height of the curve its path draws at `count` evenly spaced places from
 * its first point to its last, in the same curve (`smooth` by default). Curves
 * of any length put into the same number of places can be mixed, which is how
 * a chart glides to a series of another length. Needs two points or more.
 * Points that share an x are joined by a straight step, as the path joins
 * them, so every height is a number.
 */
export function sampleCurve(
  points: readonly ChartPoint[],
  count: number,
  curve: ChartCurve = "smooth",
): number[] {
  const last = points.length - 1;
  const tangents =
    (curve === "smooth" || curve === "monotone") && last >= 2
      ? tangentsOf(points, curve)
      : [];
  const start = points[0]![0];
  const span = points[last]![0] - start;
  let segment = 0;
  return Array.from({ length: count }, (_, k) => {
    const x = count > 1 ? start + (span * k) / (count - 1) : start;
    while (segment < last - 1 && x > points[segment + 1]![0]) segment++;
    const [x0, y0] = points[segment]!;
    const [x1, y1] = points[segment + 1]!;
    const t = x1 === x0 ? 0 : (x - x0) / (x1 - x0);
    // A step holds the height of its point until the middle, then the next one.
    if (curve === "step") return t < 0.5 ? y0 : y1;
    if (curve === "linear" || last < 2) return y0 + (y1 - y0) * t;
    // The control points sit a third of the way apart, so x moves evenly with t.
    const [out, into] = segmentControls(points, tangents, segment);
    const u = 1 - t;
    return (
      u ** 3 * y0 +
      3 * u ** 2 * t * out[1] +
      3 * u * t ** 2 * into[1] +
      t ** 3 * y1
    );
  });
}

/**
 * The height of the curves a series is drawn in, at any x, for a mark that rides
 * along them: each run of points is sampled once, at about one place for every
 * px, in the curve it is drawn in, and the height between two places is read by
 * interpolation. Null for an x that no run reaches, such as the gap between two
 * runs, where the series is not drawn.
 */
export function curveTrace(
  runs: readonly (readonly ChartPoint[])[],
  curve: ChartCurve,
): (x: number) => number | null {
  const traces = runs
    .filter((run) => run.length > 1)
    .map((run) => {
      const start = run[0]![0];
      const end = run[run.length - 1]![0];
      const count = Math.min(1200, Math.max(2, Math.ceil(end - start) + 1));
      return { end, heights: sampleCurve(run, count, curve), start };
    });
  return (x) => {
    const run = traces.find(({ end, start }) => x >= start && x <= end);
    if (!run) return null;
    // A run whose points all share one x has no length to move along.
    const span = run.end - run.start;
    const along =
      span > 0 ? ((x - run.start) / span) * (run.heights.length - 1) : 0;
    const index = Math.min(run.heights.length - 2, Math.floor(along));
    const t = along - index;
    return (
      run.heights[index]! + (run.heights[index + 1]! - run.heights[index]!) * t
    );
  };
}

/**
 * The stops of the gradient that fills an area, from the top of its box to the
 * bottom: strongest at the edge away from 0 and gone at the 0 line, so an area
 * below 0 fades towards 0 as an area above 0 does, and one that crosses 0 fades
 * into it from both sides. `heights` are the heights of the area's edges in the
 * plot and `zero` the height of the 0 line; an area above 0 keeps the plain
 * fade from its top to its bottom.
 */
export function areaGradientStops(
  heights: readonly number[],
  zero: number,
): { offset: number; opacity: number }[] {
  const top = Math.min(...heights);
  const bottom = Math.max(...heights);
  const at = bottom > top ? (zero - top) / (bottom - top) : 1;
  if (at >= 1)
    return [
      { offset: 0, opacity: 0.2 },
      { offset: 1, opacity: 0 },
    ];
  if (at <= 0)
    return [
      { offset: 0, opacity: 0 },
      { offset: 1, opacity: 0.2 },
    ];
  const offset = Math.round(at * 1000) / 1000;
  return [
    { offset: 0, opacity: 0.2 },
    { offset, opacity: 0 },
    { offset: 1, opacity: 0.2 },
  ];
}

/**
 * The places a morphing curve is sampled at. Dense enough that the curve
 * through them is the real one to a fraction of a pixel, so the chart shows no
 * step when a morph starts or ends.
 */
export const morphSamples = 48;

/**
 * The places a wide chart is sampled at: one for about every 4 px, never fewer
 * than `morphSamples`, so a long series keeps its shape through the morph.
 */
export function morphSampleCount(width: number): number {
  return Math.min(240, Math.max(morphSamples, Math.round(width / 4)));
}

// How far the wanted count may move, in samples (48 px of plot), before a held
// count gives way.
const sampleSlack = 12;

/**
 * The count a chart keeps sampling at: the one it holds while the wanted count
 * stays within a few samples of it. A label of the value axis in another width
 * moves the edge of the plot by a few px, and a count that followed it would
 * leave the new curves no old ones of the same length to glide from: they would
 * snap in. A plot that really changes size, as on a resize, takes the wanted
 * count.
 */
export function heldSampleCount(held: number, wanted: number): number {
  return Math.abs(wanted - held) <= sampleSlack ? held : wanted;
}

/** The points of a sampled curve, spread over the width of the chart (300 by default). */
export const morphPoints = (
  heights: readonly number[],
  width = 300,
): ChartPoint[] =>
  heights.map((y, k): ChartPoint => [
    (width * k) / Math.max(1, heights.length - 1),
    y,
  ]);
