"use client";

/*
 * The pill on the axis of a chart: the active item's label in the kit's inverse
 * Badge, sitting on the axis at the item and gliding after it, with the labels
 * of the axis that it would cover fading out until it has passed. The idea and
 * the rule for the labels (a label within reach of the pill goes) are adapted
 * from bklit UI's date ticker (tooltip/date-ticker.tsx, MIT) and the labels of
 * its x axis (x-axis.tsx). The pill itself is the Badge, its digits roll through
 * MotionNumber, and its glide is the follow motion.
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

import * as React from "react";

import { cn } from "../../system/utils/cn";
import { Badge } from "../badge";
import { MotionNumber, followed, useFollowValue } from "../motion";
import {
  CHART_LABEL_HEIGHT,
  CHART_X_LABEL_CENTRE,
  CHART_Y_LABEL_INSET,
  placeAxisLabel,
  useFadeClassName,
  useFirstSeen,
  useLastValue,
  type CartesianLayout,
} from "./chart-cartesian";
import { estimateLabelWidth } from "./chart-scales";

/** What a pill is wider than its text, in px: the padding and the border of the Badge on both sides. */
const pillPadding = 16;
/** How tall the pill is reckoned to be, in px: the Badge at its tallest. */
const pillHeight = 22;
/** The space a label that is left standing keeps from the pill, in px. */
const pillGap = 6;

/** Where the pill is: what it says and where the item is along the axis, in px from the start of the plot. */
export type AxisPillSpot = { position: number; text: string };

/**
 * Which of the labels of an axis the pill sits on: those within reach of it, the
 * half of the pill and the half of the label and a gap. Along the bottom the
 * labels and the pill are as wide as their text; down the left side they are as
 * tall as a line, and the pill as tall as the Badge.
 */
export function coveredLabels(
  labels: readonly { position: number; text: string }[],
  spot: AxisPillSpot | null,
  side: "bottom" | "left",
): boolean[] {
  return labels.map((label) => {
    if (!spot) return false;
    const reach =
      side === "bottom"
        ? (estimateLabelWidth(spot.text) + pillPadding) / 2 +
          estimateLabelWidth(label.text) / 2
        : pillHeight / 2 + CHART_LABEL_HEIGHT / 2;
    return Math.abs(label.position - spot.position) < reach + pillGap;
  });
}

/**
 * The labels of an axis with the ones the pill sits on marked `covered`, and
 * whether they must be drawn ready to fade. The labels at rest carry nothing of
 * a fade; from the first time the pill is shown they carry its classes, and they
 * are covered from two frames later, so that the first label to go fades out
 * instead of snapping out of sight.
 */
export function useCoveredLabels<L extends { position: number; text: string }>(
  labels: readonly L[],
  spot: AxisPillSpot | null,
  side: "bottom" | "left",
): { fading: boolean; labels: (L & { covered: boolean })[] } {
  const { released: armed, seen } = useFirstSeen(spot !== null);
  const covered = coveredLabels(labels, armed ? spot : null, side);
  return {
    fading: seen,
    labels: labels.map((label, index) => ({
      ...label,
      covered: covered[index] ?? false,
    })),
  };
}

/**
 * The pill: the label of the active item in the inverse Badge, on the axis, at
 * the item. It is not drawn until it is first shown. It appears where the item
 * is and glides after it from then on, its digits rolling to the next label's;
 * it fades in and out with the active item and waits where it was while it goes.
 */
export function ChartAxisPill({
  container,
  layout,
  side,
  spot,
}: {
  /** The element whose motion tokens set the glide: the chart. */
  container?: React.RefObject<Element | null>;
  layout: CartesianLayout;
  /** The axis the pill sits on: the bottom of a chart with categories along it, the left side of a horizontal Bar Chart. */
  side: "bottom" | "left";
  /** Null while nothing is active. */
  spot: AxisPillSpot | null;
}): React.ReactElement | null {
  const fade = useFadeClassName();
  const active = spot !== null;
  // The pill waits where it was, saying what it said, while it fades out.
  const held = useLastValue(spot ? spot.text : null) ?? "";
  const heldPosition = useLastValue(spot ? spot.position : null) ?? 0;
  // It says what the label it covers says, cut and kept inside the box as that
  // label is: to the column of labels at the left, and along the bottom moved
  // in from either end of the box.
  const placed = placeAxisLabel(held, heldPosition, layout, side);
  const text = placed.text;
  const place = useFollowValue(
    side === "bottom"
      ? layout.margin.left + placed.x
      : layout.margin.top + heldPosition,
    { active, container },
  );

  // Nothing is drawn until the pill is first shown, and then it is drawn
  // invisible for two frames, so that the browser has a frame to fade in from.
  const { released, seen } = useFirstSeen(active);

  // A label that arrives with the pill is not a change of the one it showed
  // before it went: it does not roll.
  const [wasActive, setWasActive] = React.useState(false);
  const [arrivals, setArrivals] = React.useState(0);
  if (active !== wasActive) {
    setWasActive(active);
    if (active) setArrivals(arrivals + 1);
  }

  if (!seen) return null;
  const bottom = side === "bottom";
  return (
    <div
      aria-hidden="true"
      className="sp-chart-axis-pill-layer pointer-events-none absolute inset-0"
      data-slot="chart-axis-pill-layer"
    >
      <followed.div
        className={cn(
          "sp-chart-axis-pill",
          "absolute top-0 left-0 whitespace-nowrap -translate-y-1/2",
          bottom ? "-translate-x-1/2" : "-translate-x-full",
          fade,
        )}
        data-side={side}
        data-slot="chart-axis-pill"
        data-visible={active && released ? "" : undefined}
        style={
          bottom
            ? {
                x: place,
                y: layout.margin.top + layout.plotHeight + CHART_X_LABEL_CENTRE,
              }
            : {
                x: layout.margin.left - CHART_Y_LABEL_INSET + 4,
                y: place,
              }
        }
      >
        {/* The md Badge sets its text at the 12 px of the labels it covers. */}
        <Badge size="md" variant="inverse">
          <MotionNumber key={arrivals} value={text} />
        </Badge>
      </followed.div>
    </div>
  );
}
