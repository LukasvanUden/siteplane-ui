"use client";

import * as React from "react";

import { LineAreaChart } from "../chart/chart-line-area";
import type { CartesianChartProps, ChartCurve } from "../chart/chart-types";

export type LineChartProps = CartesianChartProps & {
  /**
   * How the line joins its points. `smooth` (the default) is a natural spline,
   * which bends evenly and can swing a little past the data between two points;
   * `monotone` never does, so use it for data that rests on 0 or must not look
   * higher or lower than it is; `linear` is straight segments and `step` holds
   * each value until the middle between two points.
   */
  curve?: ChartCurve;
  /** Marks every point with a dot. A point on its own always has one. */
  dots?: boolean;
};

/**
 * One or several lines over categories or dates, with a crosshair, a tooltip
 * and arrow-key navigation. The chart core draws it; new data glides in.
 */
export function LineChart(props: LineChartProps): React.ReactElement {
  return <LineAreaChart {...props} mode="line" />;
}
