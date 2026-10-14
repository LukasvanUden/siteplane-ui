"use client";

/*
 * The highlighted stretch of a line or an area: while a point is active the
 * strokes step back (chart-dimming.ts) and the stretch around the point is
 * drawn again at full strength, the stroke re-drawn on the same path and clipped
 * to a band that glides after the point. The idea, and the band (one point
 * either side of the active one, held to the ends), are adapted from bklit UI's
 * highlight segment (highlight-segment.tsx, highlight-segment-bounds.ts, MIT);
 * the band's glide is the follow motion, the same that takes the crosshair.
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

import { followed, useFollowValue } from "../motion";
import { useFirstSeen, useLastValue } from "./chart-cartesian";
import { useChartDimClassName } from "./chart-dimming";
import { cn } from "../../system/utils/cn";

/** The band around an active point: from the point before it to the point after it, held to the ends, in px along the axis. Null for no such point. */
export function highlightBand(
  positions: readonly number[],
  index: number,
): { width: number; x: number } | null {
  if (index < 0 || index >= positions.length) return null;
  const start = positions[Math.max(0, index - 1)]!;
  const end = positions[Math.min(positions.length - 1, index + 1)]!;
  return { width: Math.max(0, end - start), x: start };
}

/**
 * Whether the stretch of a stroke is at full strength: the active point has
 * brought it in, it has been drawn for two frames, and no other rule holds the
 * series back. A stroke that the legend holds back keeps the level of the rest
 * of its series, stretch or not.
 */
export function stretchShown({
  active,
  released,
  steppedBack,
}: {
  active: boolean;
  released: boolean;
  steppedBack: boolean;
}): boolean {
  return active && released && !steppedBack;
}

// What the band glides over: the duration the strokes step back over, so they and
// the stretch settle together.
const bandDuration = "--motion-duration-linger";
// The room above and below the plot the band keeps, so that a stroke on the top
// or the bottom edge of the plot is not cut in half by it.
const slack = 4;

/**
 * The stretch around the active point, at full strength: each stroke drawn
 * again on its own path, clipped to the band, which glides to the next point
 * with the follow motion. It is not drawn before the first point is active, and
 * fades in and out with the active point.
 */
export function ChartHighlight({
  band,
  container,
  height,
  strokes,
}: {
  /** The band of the active point, null while nothing is active. */
  band: { width: number; x: number } | null;
  /** The element whose motion tokens set the glide: the chart. */
  container?: React.RefObject<Element | null>;
  /** The height of the plot, in px. */
  height: number;
  strokes: readonly {
    color: string;
    d: string;
    key: string;
    /**
     * The series steps back for another reason as well (it is not the focused
     * series of the legend), so its stretch is not brought back to full
     * strength: a mark is held back when either rule holds it back.
     */
    steppedBack?: boolean;
    width: number;
  }[];
}): React.ReactElement | null {
  const clipId = React.useId();
  const active = band !== null;
  // The band waits where it was while the strokes fade back in. It follows a
  // little slower than the crosshair, as bklit's does, so the stretch trails the
  // point it belongs to; its duration is the series' own, the one the strokes
  // step back over.
  const options = { active, container, duration: bandDuration } as const;
  const x = useFollowValue(useLastValue(band ? band.x : null) ?? 0, options);
  const width = useFollowValue(
    useLastValue(band ? band.width : null) ?? 0,
    options,
  );
  const className = useChartDimClassName("series");
  const { released, seen } = useFirstSeen(active);
  if (!seen) return null;
  return (
    <g className="sp-chart-highlight-clip" data-slot="chart-highlight-clip">
      <clipPath id={clipId}>
        <followed.rect
          height={height + slack * 2}
          width={width}
          x={x}
          y={-slack}
        />
      </clipPath>
      {strokes.map((stroke) => (
        <path
          className={cn("sp-chart-highlight", className)}
          clipPath={`url(#${clipId})`}
          d={stroke.d}
          data-slot="chart-highlight"
          fill="none"
          key={stroke.key}
          opacity={
            stretchShown({
              active,
              released,
              steppedBack: stroke.steppedBack ?? false,
            })
              ? 1
              : 0
          }
          stroke={stroke.color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={stroke.width}
        />
      ))}
    </g>
  );
}
