"use client";

import * as React from "react";

import { useReducedMotionPreference } from "../../system/motion/use-reduced-motion-preference";
import { cn } from "../../system/utils/cn";
import {
  areaGradientStops,
  naturalPath,
  morphPoints,
  morphSamples,
  sampleCurve,
  type ChartPoint,
} from "../chart/chart-curve";
import { valueExtent } from "../chart/chart-scales";
import { useTweenedValues } from "../motion";

export type SparklineVariant = "line" | "area" | "fill";

export type SparklineProps = Omit<
  React.ComponentPropsWithoutRef<"svg">,
  | "aria-label"
  | "children"
  | "color"
  | "height"
  | "preserveAspectRatio"
  | "role"
  | "viewBox"
> & {
  /**
   * One series of numbers, or several series that share one scale. A value that
   * is not a finite number is left out and its neighbours are joined.
   */
  data: readonly number[] | readonly (readonly number[])[];
  /** The accessible name of the sparkline; it is also its native title. */
  label: string;
  /**
   * `line` is the stroke alone. `area` is the stroke over a fill that fades out
   * towards the baseline. `fill` is that fill alone, which reads best with
   * several overlapping series.
   */
  variant?: SparklineVariant;
  /**
   * A CSS colour or token for the marks. The colour of the surrounding text by
   * default (`currentColor`), so a parent's text colour sets it.
   */
  color?: string;
  /** The height in px. The width follows the room the sparkline is given. */
  height?: number;
  /**
   * Whether the scale takes in 0, so that the height of the line shows the size
   * of the values. `false` spans the scale from the lowest value to the
   * highest, so that a small change still shows its shape; a figure beside the
   * sparkline then tells its size. A series that is the same all along sits in
   * the middle of the box. `true` by default.
   */
  includeZero?: boolean;
};

// The sparkline is drawn in its own units and stretches to its box: the highest
// value sits 8 units below the top and the baseline 4 above the bottom, so the
// stroke is never cut off.
const plotWidth = 300;
const plotHeight = 80;
const plotTop = 8;
const plotBottom = 76;
const noHeights: readonly number[] = [];
// A point on its own is a dot 6 px across, as a dot of the Line Chart is.
const dotSize = 6;

// A list of numbers is one series; a list of lists is several.
function seriesOf(
  data: SparklineProps["data"],
): readonly (readonly number[])[] {
  return data.length > 0 && Array.isArray(data[0])
    ? (data as readonly (readonly number[])[])
    : [data as readonly number[]];
}

/**
 * A small chart of a trend, without axes or tooltip: a line, a line with a fill
 * under it, or the fill alone, for one series or several on one scale. New data
 * glides in: the curves morph into each other, whatever their length.
 */
export function Sparkline({
  data,
  label,
  variant = "line",
  color,
  height = 32,
  includeZero = true,
  className,
  ...props
}: SparklineProps): React.ReactElement {
  const gradient = React.useId();
  const chart = React.useRef<SVGSVGElement>(null);
  const reduced = useReducedMotionPreference();
  const series = seriesOf(data);
  const values = series.flat().filter(Number.isFinite);
  // The smooth curve can swing a little past its points, so the range takes in
  // where it goes as well, and the line stays inside its box.
  const reach = series.flatMap((own) => {
    const finite = own.filter(Number.isFinite);
    return finite.length > 2
      ? sampleCurve(
          finite.map((value, i): ChartPoint => [i, value]),
          morphSamples,
        )
      : [];
  });
  // One scale for every series, the charts' value extent: from 0, or from the
  // lowest value with includeZero false, to the highest. It always has a span,
  // so a series that is the same all along sits in the middle without 0.
  const [min, max] = valueExtent([...values, ...reach], { includeZero });
  const range = max - min;
  const curves = series.map((own) =>
    own
      .filter(Number.isFinite)
      .map((value, i, all): ChartPoint => [
        all.length === 1 ? plotWidth / 2 : (i / (all.length - 1)) * plotWidth,
        plotBottom - ((value - min) / range) * (plotBottom - plotTop),
      ]),
  );
  // New data glides in: every curve is put into the same number of places, so
  // a series of another length morphs into the old one. A curve that is only a
  // point or nothing has no line to morph, and a change in the number of
  // series shows at once. At rest the real points are drawn.
  const morphs =
    curves.length > 0 && curves.every((points) => points.length > 1);
  const target = morphs
    ? curves.flatMap((points) => sampleCurve(points, morphSamples))
    : noHeights;
  const heights = useTweenedValues(target, { container: chart });
  const moving = morphs && heights !== target;
  const filled = variant !== "line";
  // A fill reaches from its line to the 0 line, so a series below 0 hangs down
  // from it and one that crosses it fills towards it from both sides. Where 0
  // is below the scale, as for a series above 0, the fill reaches the bottom of
  // the box; where it is above, the top.
  const zero =
    min >= 0
      ? plotHeight
      : max <= 0
        ? 0
        : plotBottom - ((0 - min) / range) * (plotBottom - plotTop);
  return (
    <svg
      data-slot="sparkline"
      ref={chart}
      role="img"
      aria-label={label}
      viewBox={`0 0 ${plotWidth} ${plotHeight}`}
      preserveAspectRatio="none"
      height={height}
      color={color}
      className={cn(
        "w-full overflow-visible",
        !reduced &&
          "transition-colors duration-(--motion-duration-value) ease-(--motion-ease-standard)",
        className,
      )}
      {...props}
    >
      <title>{label}</title>
      {curves.map((real, index) => {
        const points = moving
          ? morphPoints(
              heights.slice(index * morphSamples, (index + 1) * morphSamples),
              plotWidth,
            )
          : real;
        if (!points.length) return null;
        // A point on its own has no line and no fill: it is a dot, as in the
        // Line Chart. A round cap on a stroke of no length draws it, and the
        // stroke does not scale with the box, so it stays round.
        if (points.length === 1) {
          const [x, y] = points[0]!;
          return (
            <path
              d={`M${x},${y} h0`}
              data-slot="sparkline-dot"
              fill="none"
              key={index}
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth={dotSize}
              vectorEffect="non-scaling-stroke"
            />
          );
        }
        const line = naturalPath(points);
        const first = points[0]!;
        const last = points[points.length - 1]!;
        // Overlapping fills fade out through their gradients, strongest away
        // from the 0 line, as the Area Chart's do. In dark mode the bright
        // tone is weakened so that they do not read as a block.
        return (
          <g key={index}>
            {filled && (
              <>
                <defs>
                  <linearGradient
                    id={`${gradient}-${index}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    {areaGradientStops(
                      [...points.map(([, y]) => y), zero],
                      zero,
                    ).map((stop) => (
                      <stop
                        key={stop.offset}
                        offset={stop.offset}
                        stopColor="currentColor"
                        stopOpacity={stop.opacity}
                      />
                    ))}
                  </linearGradient>
                </defs>
                <path
                  d={`${line} L${last[0]},${zero} L${first[0]},${zero} Z`}
                  fill={`url(#${gradient}-${index})`}
                  className={
                    variant === "fill" ? "dark:opacity-60" : "opacity-80"
                  }
                />
              </>
            )}
            {variant !== "fill" && (
              <path
                d={line}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
