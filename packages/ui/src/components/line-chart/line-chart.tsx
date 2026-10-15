"use client";

import * as React from "react";

import { LineAreaChart } from "../chart/chart-line-area";
import type { CartesianChartProps, ChartCurve } from "../chart/chart-types";

export type LineChartProps = CartesianChartProps & {
  /**
   * How the line joins its points. `monotone` (the default) bends through every
   * point and never swings past the data, so a line never looks higher or lower
   * than its values; `smooth` is a natural spline, which bends evenly and can
   * swing a little past the data between two points; `linear` is straight
   * segments and `step` holds each value until the middle between two points.
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
