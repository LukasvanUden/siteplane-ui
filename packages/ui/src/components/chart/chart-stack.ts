import { chartValue, chartXKey } from "./chart-data";
import type { ChartDatum } from "./chart-types";

/** One series' share of one category: its value and the two ends it spans on the value axis. */
export type StackedSegment = {
  /** The key of the category or date, as `chartXKey` reads it. */
  x: string;
  series: string;
  value: number;
  y0: number;
  y1: number;
};

/**
 * A diverging stack: positive values stack up from 0 in series order, negative
 * values stack down from 0, and a missing value adds nothing, with no segment
 * of its own. Each segment spans `y0` to `y1`, so `y1 - y0` is its value.
 */
export function stackSeries(
  data: readonly ChartDatum[],
  x: string,
  seriesKeys: readonly string[],
): StackedSegment[] {
  const segments: StackedSegment[] = [];
  for (const datum of data) {
    const key = chartXKey(datum[x]);
    let up = 0;
    let down = 0;
    for (const series of seriesKeys) {
      const value = chartValue(datum, series);
      if (value === null) continue;
      if (value >= 0) {
        const y0 = up;
        up += value;
        segments.push({ x: key, series, value, y0, y1: up });
      } else {
        const y0 = down;
        down += value;
        segments.push({ x: key, series, value, y0, y1: down });
      }
    }
  }
  return segments;
}
