/*
 * What the charts drawn as rings share: the circle a ring is drawn along, from
 * 12 o'clock clockwise, and the rule that fits a figure and its caption into the
 * hole of a ring. The Pie Chart's donut and the Radial Bar Chart's rings both
 * read them, so a share, a bar and a figure in the hole mean the same in each.
 */

import { estimateLabelWidth } from "./chart-scales";

/**
 * The path of the circle of `radius` around `cx`, `cy`, from 12 o'clock
 * clockwise and back, left open. A ring is dashed along it, so a share or a
 * bar starts at 12 o'clock and runs clockwise; a closed circle would let the
 * dasher join the last dash to the first at the closing point.
 */
export function chartCirclePath(
  cx: number,
  cy: number,
  radius: number,
): string {
  const top = cy - radius;
  const bottom = cy + radius;
  return `M ${cx} ${top} A ${radius} ${radius} 0 1 1 ${cx} ${bottom} A ${radius} ${radius} 0 1 1 ${cx} ${top}`;
}

/** Where a figure and its caption sit in the hole of a ring. */
export type ChartRingCenterFit = {
  /** Whether the figure is written in compact notation, such as 1.2M. */
  compact: boolean;
  /** The text size of the figure, in px: one of the steps the chart offers. */
  size: number;
  /** The widest the caption may be, in percent of the hole's width: the chord of the hole at the caption's outer edge. */
  captionWidth: number;
};

/**
 * The step a figure in the hole of a ring takes, and whether it is written in
 * compact notation: the first that fits, in the order of `steps` (largest
 * first), the full figure in the first `fullSteps` steps and then the compact
 * one in every step. A line fits when its corners stay inside the hole, less a
 * margin of 12 % of its radius from the ring (at least 4 px), with the figure
 * and the caption centred in the hole as one block. The widths are the kit's
 * estimate (`estimateLabelWidth`), so that the server and the client pick the
 * same step; it errs on the wide side. A figure that fits in no step takes the
 * smallest, compact.
 */
export function ringCenterFit({
  caption,
  captionGap = 0,
  captionHeight,
  compact,
  figureHeight = (size) => size,
  full,
  fullSteps,
  holeRadius,
  steps,
}: {
  caption?: string | undefined;
  /** The space between the figure and the caption, in px. */
  captionGap?: number;
  /** The height of the caption's line, in px. */
  captionHeight: number;
  /** The figure in compact notation. */
  compact: string;
  /** The height of the figure's line at a step, in px: the step itself by default. */
  figureHeight?: (size: number) => number;
  /** The figure in full. */
  full: string;
  /** How many of the largest steps keep the figure in full before it is written compact. */
  fullSteps: number;
  /** The radius of the hole, in px. */
  holeRadius: number;
  /** The text sizes of the figure in px, from the largest. */
  steps: readonly number[];
}): ChartRingCenterFit {
  const hole = Math.max(0, holeRadius);
  const room = Math.max(0, hole - Math.max(4, hole * 0.12));
  // The width of a line whose corners sit `edge` px above or below the centre.
  const chord = (edge: number) =>
    edge >= room ? 0 : 2 * Math.sqrt(room * room - edge * edge);
  const blockHeight = (size: number) =>
    figureHeight(size) + (caption ? captionGap + captionHeight : 0);
  const width = (text: string, size: number) =>
    (estimateLabelWidth(text) * size) / 12;
  const candidates = [
    ...steps.slice(0, fullSteps).map((size) => ({ compact: false, size })),
    ...steps.map((size) => ({ compact: true, size })),
  ];
  const smallest = steps[steps.length - 1] ?? 12;
  const chosen = candidates.find(
    ({ compact: short, size }) =>
      width(short ? compact : full, size) <= chord(blockHeight(size) / 2),
  ) ?? { compact: true, size: smallest };
  const captionWidth =
    hole > 0 ? (chord(blockHeight(chosen.size) / 2) / (2 * hole)) * 100 : 0;
  return {
    captionWidth: Math.round(captionWidth * 100) / 100,
    compact: chosen.compact,
    size: chosen.size,
  };
}
