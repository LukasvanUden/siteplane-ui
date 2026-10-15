"use client";

import * as React from "react";

import { LineAreaChart } from "../chart/chart-line-area";
import type { CartesianChartProps, ChartCurve } from "../chart/chart-types";

export type AreaChartProps = CartesianChartProps & {
  /**
   * How the area joins its points. `monotone` (the default) bends through every
   * point and never swings past the data, so an area that rests on 0 stays on
   * it; `smooth` is a natural spline, which bends evenly and can swing a little
   * past the data between two points; `linear` is straight segments and `step`
   * holds each value until the middle between two points.
   */
  curve?: ChartCurve;
  /** Stacks the areas on each other: positive values up from 0, negative ones down. */
  stacked?: boolean;
  /** A gradient from the series colour to nothing, or a flat tint of it. */
  fill?: "gradient" | "solid";
};

/**
 * One or several areas over categories or dates, with a line along the top of
 * each, a crosshair, a tooltip and arrow-key navigation. The chart core draws
 * it; new data glides in.
 */
export function AreaChart(props: AreaChartProps): React.ReactElement {
  return <LineAreaChart {...props} mode="area" />;
}
