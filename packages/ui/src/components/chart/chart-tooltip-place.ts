/*
 * Where the tooltip card of a chart sits beside the item it belongs to: to its
 * right at a fixed distance, on the other side once the card would leave the
 * chart, and kept inside the chart vertically. The placement is adapted from
 * bklit UI's tooltip box (tooltip/tooltip-box.tsx, MIT); the card itself, the
 * motion that brings it there and the surface it is drawn on are Siteplane's.
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

/** The distance between the item and the card, in px: bklit's, so a card sits as far from the crosshair as theirs. */
export const CHART_TOOLTIP_OFFSET = 16;

export type ChartPoint2D = { x: number; y: number };
export type ChartBounds = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};
export type ChartCardSize = { height: number; width: number };

/** How the card sits against the vertical of its item: its top at it, or its middle. */
export type ChartTooltipAlign = "center" | "start";

export type ChartTooltipPlace = {
  /** The card is on the left of its item, because the right had no room. */
  flipped: boolean;
  /** The left and the top of the card, in the coordinates of the anchor and the bounds. */
  left: number;
  top: number;
};

/**
 * Whether the card dips: it has changed sides while it is shown and its place is
 * known (a card that is still a guess is put where it belongs, not moved), and
 * motion is not reduced (M5).
 */
export function dipsAtFlip({
  flipped,
  measured,
  open,
  reduced,
  wasFlipped,
}: {
  flipped: boolean;
  measured: boolean;
  open: boolean;
  reduced: boolean;
  wasFlipped: boolean;
}): boolean {
  return flipped !== wasFlipped && open && measured && !reduced;
}

/**
 * The left and the top of a card of `card` size beside an item at `anchor`,
 * which lies inside `bounds`. The card is to the right of the item, `offset`
 * away; where it would cross the right edge of the bounds it is on the left
 * instead, and where it would cross the left edge it is held to it. With
 * `start` its top is the item's (a chart whose crosshair runs top to bottom);
 * with `center` its middle is the item's, and the card is kept `offset` clear
 * of the top and the bottom of the bounds (a bar in a horizontal chart, a share
 * of a ring).
 */
export function placeChartTooltip({
  align,
  anchor,
  bounds,
  card,
  offset = CHART_TOOLTIP_OFFSET,
}: {
  align: ChartTooltipAlign;
  anchor: ChartPoint2D;
  bounds: ChartBounds;
  card: ChartCardSize;
  offset?: number;
}): ChartTooltipPlace {
  const flipped = anchor.x + offset + card.width > bounds.right;
  const left = Math.max(
    bounds.left,
    flipped ? anchor.x - offset - card.width : anchor.x + offset,
  );
  const top =
    align === "start"
      ? anchor.y
      : Math.max(
          bounds.top + offset,
          Math.min(
            anchor.y - card.height / 2,
            bounds.bottom - card.height - offset,
          ),
        );
  return { flipped, left, top };
}
