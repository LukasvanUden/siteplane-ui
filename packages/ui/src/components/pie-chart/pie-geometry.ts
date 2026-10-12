/*
 * The geometry of the Pie Chart. It is drawn in a 200 x 200 box around its
 * centre. A share is a number of percent of the circle, counted from 12 o'clock
 * clockwise, so the ring, the wedges, the pointer and the tooltip all agree on
 * where a share is.
 *
 * The way the active share steps out, along its middle angle by a fixed
 * distance, is adapted from bklit UI's pie-slice.tsx (`getSliceOffset`) and
 * pie-chart.tsx (`DEFAULT_HOVER_OFFSET`), MIT. Everything else is Siteplane's
 * own.
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

/** The side of the box the chart is drawn in: the view box of its SVG. */
export const PIE_BOX = 200;
const CENTER = PIE_BOX / 2;
/** The radius of the rim. The ring and the pie both reach the edge of the box. */
export const PIE_OUTER_RADIUS = 100;
/** The radius of the hole of a donut. A pie has none. */
export const DONUT_INNER_RADIUS = 50;

/**
 * The centre line and the width of the stroke that draws a ring from the inner
 * radius out to the rim. With no inner radius the stroke fills the disc.
 */
export function ringOf(innerRadius: number): { radius: number; width: number } {
  return {
    radius: (PIE_OUTER_RADIUS + innerRadius) / 2,
    width: PIE_OUTER_RADIUS - innerRadius,
  };
}

/**
 * The path that a share of the ring is dashed along: the circle of `radius`,
 * from 12 o'clock clockwise and back, left open. A closed circle would let the
 * dasher join the last dash to the first at the closing point, and a share that
 * ends exactly there then showed a stray wedge for some data.
 */
export function ringPath(radius: number): string {
  const top = CENTER - radius;
  const bottom = CENTER + radius;
  return `M ${CENTER} ${top} A ${radius} ${radius} 0 1 1 ${CENTER} ${bottom} A ${radius} ${radius} 0 1 1 ${CENTER} ${top}`;
}

/** A coordinate as short as it needs to be: three decimals, and none that are 0. */
function coordinate(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/** The point on the rim `percent` of the way round, as the two numbers of a path. */
function rimPoint(percent: number): string {
  const angle = (percent / 100) * 2 * Math.PI;
  const x = CENTER + PIE_OUTER_RADIUS * Math.sin(angle);
  const y = CENTER - PIE_OUTER_RADIUS * Math.cos(angle);
  return `${coordinate(x)} ${coordinate(y)}`;
}

// A share this close to the whole is drawn as the disc. A wedge that ends where
// it began has an arc of no length, which a browser leaves out: the share would
// vanish instead of filling the circle.
const WHOLE = 99.999;

/**
 * The path of the wedge that fills the disc from `start` to `start + value`
 * percent of the circle: from the centre out to the rim, along the rim, and
 * back. An empty string when the share has nothing in it.
 */
export function wedgePath(start: number, value: number): string {
  if (!(value > 0) || !Number.isFinite(start)) return "";
  const radius = PIE_OUTER_RADIUS;
  if (value >= WHOLE) {
    return `M ${CENTER} 0 A ${radius} ${radius} 0 1 1 ${CENTER} ${PIE_BOX} A ${radius} ${radius} 0 1 1 ${CENTER} 0 Z`;
  }
  const longWay = value > 50 ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${rimPoint(start)} A ${radius} ${radius} 0 ${longWay} 1 ${rimPoint(start + value)} Z`;
}

/** A share as it is drawn now: where it starts and how much of the circle it holds. */
export type PieArc = {
  key: string;
  start: number;
  value: number;
  /** A share that has left the data and is shrinking away. */
  leaving: boolean;
};

/**
 * The share under a point, found by the angle of the point within the ring, or
 * the disc when `innerRadius` is 0. The point is an offset from the centre in
 * the box, with y growing downwards. Null outside the rim and in a hole. One
 * lookup for the whole chart keeps the active share steady while the pointer
 * crosses from one share to the next; it reads the shares as they are drawn, so
 * the share under the pointer is the one seen.
 */
export function shareAtPoint(
  arcs: readonly PieArc[],
  dx: number,
  dy: number,
  innerRadius: number,
): string | null {
  const distance = Math.hypot(dx, dy);
  if (distance < innerRadius || distance > PIE_OUTER_RADIUS) return null;
  const turn = ((Math.atan2(dx, -dy) / (2 * Math.PI) + 1) % 1) * 100;
  for (const arc of arcs) {
    if (
      !arc.leaving &&
      arc.value > 0 &&
      turn >= arc.start &&
      turn < arc.start + arc.value
    )
      return arc.key;
  }
  return null;
}

/**
 * The direction a share points in: the angle of the middle of its arc, in
 * radians from 12 o'clock, clockwise.
 */
export function middleAngle(start: number, value: number): number {
  return ((start + value / 2) / 100) * 2 * Math.PI;
}

/**
 * Where the tooltip sits for a share from the keyboard or a tap, as fractions
 * of the box: the middle of its arc, halfway between the inner radius and the
 * rim. `out` is how far the share has stepped out (`popOffset`, in the units of
 * the box): the tooltip sits beside the share where it stands.
 */
export function shareAnchor(
  start: number,
  value: number,
  innerRadius: number,
  out: { x: number; y: number } = { x: 0, y: 0 },
): { x: number; y: number } {
  // From 12 o'clock, as `middleAngle` counts, to the 3 o'clock of the circle's own maths.
  const angle = middleAngle(start, value) - Math.PI / 2;
  const reach = (PIE_OUTER_RADIUS + innerRadius) / 2 / PIE_BOX;
  return {
    x: 0.5 + reach * Math.cos(angle) + out.x / PIE_BOX,
    y: 0.5 + reach * Math.sin(angle) + out.y / PIE_BOX,
  };
}

/** How far the active share steps out of the ring, in px: bklit UI's `hoverOffset`. */
export const PIE_POP_OUT = 10;

/**
 * How far that is in the units of the box, for a chart drawn `size` px across:
 * the box is scaled to the size, so the step stays `PIE_POP_OUT` px whatever
 * the size of the chart is.
 */
export function popDistance(size: number): number {
  return (PIE_POP_OUT * PIE_BOX) / Math.max(1, size);
}

/**
 * Where the active share moves to: `distance` along its middle angle, away from
 * the centre, as a translate in the units of `distance`, with y growing
 * downwards (bklit's `getSliceOffset`: x is the sine of the angle and y minus
 * its cosine, from 12 o'clock). A share that is the whole has nowhere outside
 * itself to go and stays.
 */
export function popOffset(
  start: number,
  value: number,
  distance: number,
): { x: number; y: number } {
  if (!(value > 0) || value >= WHOLE) return { x: 0, y: 0 };
  const angle = middleAngle(start, value);
  // `|| 0` keeps a minus sign off a zero that the rounding leaves.
  return {
    x: coordinate(Math.sin(angle) * distance) || 0,
    y: coordinate(-Math.cos(angle) * distance) || 0,
  };
}
