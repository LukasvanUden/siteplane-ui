/*
 * The geometry of the Radial Bar Chart: concentric rings, one bar on each, drawn
 * in a box as many px across as the chart. A bar fills its ring from 12 o'clock
 * clockwise by its share of the chart's `max`, and its round ends stay inside
 * that share, so a bar of 40 % covers 40 % of the circle. The rings, the
 * pointer, the tooltip and the figure in the hole all read the same layout.
 */

/**
 * The named sizes of the chart, by the diameter of its outer ring: 176, 220,
 * 264 and 308 px, a lone ring of 80, 100, 120 and 140 px radius at its centre
 * line with a 16 to 28 px bar.
 */
export type RadialBarChartSize = "xs" | "sm" | "md" | "lg";

export const RADIAL_BAR_CHART_SIZES: Readonly<
  Record<RadialBarChartSize, number>
> = {
  xs: 176,
  sm: 220,
  md: 264,
  lg: 308,
};

/** One ring of the chart: the radius of its centre line and its thickness, in px. */
export type RadialRing = { radius: number; width: number };

/** Where the rings of a chart sit, from the outer ring inwards. */
export type RadialLayout = {
  /** The side of the box, in px: the diameter of the outer ring. */
  size: number;
  rings: RadialRing[];
  /** The space between two rings, in px. */
  gap: number;
  /** The radius of the hole inside the inner ring, in px. */
  holeRadius: number;
};

/**
 * The rings of a chart `size` px across with `count` bars, from the outer ring
 * inwards. A lone ring is an eleventh of the size thick, 16, 20, 24 and 28 px
 * at `xs` to `lg`; each further ring thins them all, to a seventeenth of the
 * size for three (10, 13, 16 and 18 px), so that the hole keeps room for its
 * figure. Rings stand a quarter of their thickness apart. Both are whole px,
 * at least 1 px, so every ring paints as thick as the others.
 */
export function radialLayout(size: number, count: number): RadialLayout {
  const box = Math.max(0, size);
  const rings = Math.max(1, Math.floor(count));
  const width = Math.max(1, Math.round(box / (11 + 3 * (rings - 1))));
  const gap = Math.max(1, Math.round(width / 4));
  const outer = box / 2;
  return {
    gap,
    holeRadius: Math.max(0, outer - rings * width - (rings - 1) * gap),
    rings: Array.from({ length: rings }, (_, index) => ({
      radius: outer - index * (width + gap) - width / 2,
      width,
    })),
    size: box,
  };
}

/**
 * The ring under a point, by its distance from the centre: the ring and half the
 * gap on either side of it, so that the pointer finds a ring between two rings.
 * The point is an offset from the centre in px of the box. -1 for none: in the
 * hole or outside the chart.
 */
export function ringAtPoint(
  layout: RadialLayout,
  dx: number,
  dy: number,
): number {
  const distance = Math.hypot(dx, dy);
  return layout.rings.findIndex(
    (ring) =>
      Math.abs(distance - ring.radius) <= ring.width / 2 + layout.gap / 2,
  );
}

/** A share of a ring, 0 to 1, from a value and the value of a full ring: a value beyond either end is held to it. */
export function radialShare(value: number, max: number): number {
  if (!Number.isFinite(value) || !(max > 0)) return 0;
  return Math.min(1, Math.max(0, value / max));
}

// The smallest dash drawn, in percent of the circle: a bar too short for its
// round ends is a dot, which a browser draws for a dash of some length only.
const dotDash = 0.001;

/**
 * The dash of a bar along its ring's circle (drawn with `pathLength` 100 and
 * round ends): where it starts and how long it is, in percent of the circle.
 * The round ends reach half the ring's thickness beyond the dash, so the dash
 * is shortened by them and starts half of one in, and the bar covers its share
 * exactly; a bar shorter than its two ends is a dot in the middle of its share.
 * Null for a bar with nothing in it.
 */
export function barDash(
  share: number,
  ring: RadialRing,
): { dasharray: string; dashoffset: number } | null {
  const percent = Math.min(1, Math.max(0, share)) * 100;
  if (!(percent > 0) || !(ring.radius > 0)) return null;
  const ends = (ring.width / (2 * Math.PI * ring.radius)) * 100;
  const length = Math.max(dotDash, percent - ends);
  const round = (value: number) => Math.round(value * 1000) / 1000;
  return {
    dasharray: `${round(length)} ${round(100 - length)}`,
    dashoffset: round(-Math.min(ends, percent) / 2) || 0,
  };
}

/**
 * Where the tooltip of a bar sits, as fractions of the box: the middle of the
 * bar on its ring's centre line, or 12 o'clock on its ring for a bar with
 * nothing in it.
 */
export function barAnchor(
  share: number,
  ring: RadialRing,
  size: number,
): { x: number; y: number } {
  if (!(size > 0)) return { x: 0.5, y: 0.5 };
  const angle = Math.min(1, Math.max(0, share)) * Math.PI;
  return {
    x: 0.5 + (ring.radius * Math.sin(angle)) / size,
    y: 0.5 - (ring.radius * Math.cos(angle)) / size,
  };
}

/**
 * The text steps of a figure in the hole, in px, from the largest, with the
 * height of its line and the least hole, in px across, that takes it as its
 * largest step: a lone ring at `xs` to `lg` leaves a hole of 144, 180, 216 and
 * 252 px for a figure of 24, 30, 36 and 48 px, and three rings at `xs` leave
 * 104 px for 20 px.
 */
export const RADIAL_CENTER_STEPS = [
  { hole: 240, line: 60, size: 48 },
  { hole: 200, line: 44, size: 36 },
  { hole: 150, line: 38, size: 30 },
  { hole: 128, line: 32, size: 24 },
  { hole: 96, line: 30, size: 20 },
  { hole: 0, line: 24, size: 16 },
  { hole: 0, line: 20, size: 14 },
  { hole: 0, line: 18, size: 12 },
] as const;

export type RadialCenterStep = (typeof RADIAL_CENTER_STEPS)[number]["size"];

/** The least hole, in px across, whose caption is 14 px on a 20 px line; a smaller one's is 12 px on 18. */
export const RADIAL_LARGE_CAPTION_HOLE = 150;

/** The steps a hole of `diameter` px offers its figure: its largest step and every smaller one. */
export function radialCenterSteps(diameter: number): RadialCenterStep[] {
  const first = RADIAL_CENTER_STEPS.findIndex((step) => diameter >= step.hole);
  return RADIAL_CENTER_STEPS.slice(Math.max(0, first)).map((step) => step.size);
}

/** The height of a figure's line at a step, in px. */
export function radialCenterLine(size: number): number {
  return RADIAL_CENTER_STEPS.find((step) => step.size === size)?.line ?? size;
}
