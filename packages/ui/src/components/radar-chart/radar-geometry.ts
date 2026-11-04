/*
 * The geometry of the Radar Chart: one spoke per row of the data, from 12
 * o'clock clockwise, the values of each series as points along the spokes,
 * joined into a polygon. The plot, the pointer, the labels and the tooltip all
 * read the same layout.
 */

import { CHART_LABEL_HEIGHT } from "../chart/chart-cartesian";
import { estimateLabelWidth } from "../chart/chart-scales";

/** The space between the rim and the name of a spoke, in px. */
export const RADAR_LABEL_GAP = 8;
/**
 * Half the height of a value pill on the vertical spoke, in px: the name of
 * the spoke at 12 o'clock stands clear of the pill at the rim.
 */
export const RADAR_PILL_HALF = 11;
// The room beyond the rim, in px, in which the pointer still finds a spoke.
const pointerSlack = 32;

/** Where the radar sits in its plot: its centre and the radius of its rim, in px. */
export type RadarLayout = { cx: number; cy: number; radius: number };

/**
 * The radar in a plot `width` by `height` px: centred, and as large as the
 * names of its spokes leave room for. The name at 12 o'clock stands above the
 * pill of the rim's value, so the plot keeps that pill, the gap and a line of
 * text above and below the rim; to the sides it keeps the gap and the widest
 * name.
 */
export function radarLayout({
  height,
  labels,
  width,
}: {
  height: number;
  labels: readonly string[];
  width: number;
}): RadarLayout {
  const widest = Math.max(0, ...labels.map(estimateLabelWidth));
  const above = RADAR_PILL_HALF + RADAR_LABEL_GAP + CHART_LABEL_HEIGHT;
  const beside = RADAR_LABEL_GAP + widest;
  return {
    cx: width / 2,
    cy: height / 2,
    radius: Math.max(0, Math.min(height / 2 - above, width / 2 - beside)),
  };
}

/** The angle of spoke `index` of `count`, in radians from 12 o'clock, clockwise. */
export function radarAngle(index: number, count: number): number {
  return count > 0 ? (index / count) * 2 * Math.PI : 0;
}

const round = (value: number) => Math.round(value * 100) / 100;

/** The point `reach` px out along the spoke at `angle`, in px of the plot. */
export function radarPoint(
  layout: RadarLayout,
  angle: number,
  reach: number,
): [x: number, y: number] {
  return [
    round(layout.cx + reach * Math.sin(angle)) || 0,
    round(layout.cy - reach * Math.cos(angle)) || 0,
  ];
}

/** A closed polygon through the points, in order. Empty for none. */
export function radarPolygonPath(
  points: readonly (readonly [number, number])[],
): string {
  if (points.length === 0) return "";
  return `${points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x},${y}`).join(" ")} Z`;
}

/**
 * Where the name of a spoke stands and how it is set: the gap beyond the rim
 * (and beyond the value pill at 12 o'clock), anchored away from the centre, so
 * a name on the right starts there and one on the left ends there, and moved
 * from above the point at the top to below it at the bottom.
 */
export function radarLabelPlace(
  layout: RadarLayout,
  angle: number,
): { anchor: "start" | "middle" | "end"; dy: string; x: number; y: number } {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  const top = cos > 0.999;
  const [x, y] = radarPoint(
    layout,
    angle,
    layout.radius + RADAR_LABEL_GAP + (top ? RADAR_PILL_HALF : 0),
  );
  return {
    anchor: Math.abs(sin) < 0.1 ? "middle" : sin > 0 ? "start" : "end",
    // From the baseline on the point at the top (0.32em less 0.4em: the text
    // stands on it) through the middle of a line at the sides to the top of
    // the text on the point at the bottom.
    dy: `${round(0.32 - 0.4 * cos)}em`,
    x,
    y,
  };
}

/**
 * The spoke nearest to a point by its angle, or -1 in the very centre and
 * beyond the rim and its slack. The point is an offset from the centre in px,
 * with y growing downwards.
 */
export function radarSpokeAt(
  layout: RadarLayout,
  count: number,
  dx: number,
  dy: number,
): number {
  const distance = Math.hypot(dx, dy);
  if (count <= 0 || distance === 0 || distance > layout.radius + pointerSlack)
    return -1;
  const turn = (Math.atan2(dx, -dy) / (2 * Math.PI) + 1) % 1;
  return Math.round(turn * count) % count;
}

/**
 * The angle a follower heads for to reach `angle` from `from` the short way
 * round: `angle` plus the whole turns that bring it nearest to `from`, so the
 * crosshair turns from the last spoke to the first across 12 o'clock and not
 * back round the whole radar.
 */
export function nearestTurn(from: number, angle: number): number {
  const turn = 2 * Math.PI;
  return angle + Math.round((from - angle) / turn) * turn;
}
