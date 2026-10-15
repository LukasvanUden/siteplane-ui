/** An x value: category text, or a date for a time axis. */
export type ChartXValue = string | Date;

/** One row of chart data: the x value and one number per series. */
export type ChartDatum = Record<
  string,
  string | number | Date | null | undefined
>;

/**
 * Where a chart takes the colour of a series that names none. `brand` shades
 * the brand colour from strong to light, spread over the number of series (up
 * to eight); `categorical` gives each series its own chart colour, `--chart-1`
 * to `--chart-8` in order. Both start over from the ninth series.
 */
export type ChartPalette = "brand" | "categorical";

/** A series of a Bar, Line or Area chart: the key of its numbers in the data, its name, and optionally its colour. */
export type ChartSeries = {
  key: string;
  label: string;
  /** A CSS colour or token. The chart's `palette` gives one for its place when omitted. */
  color?: string;
  /**
   * Only the Bar Chart uses it: the colour of the bars of this series below 0,
   * which also colours their tooltip row. The bars above 0 keep `color`. Without
   * it a series has one colour whatever its sign.
   */
  negativeColor?: string;
};

/**
 * The words that every chart gives screen readers. `labels` replaces them,
 * merged with the English defaults: pass the translation of each one for an
 * application in another language. An empty text leaves its part out.
 */
export type ChartLabels = {
  /** What screen readers call the plot: its role description. "chart" by default. */
  roleDescription: string;
  /**
   * The hint read after the description of the plot while it is a focus stop:
   * how to move between its items. "Use the arrow keys to move between data
   * points." by default.
   */
  keyboardHint: string;
};

/**
 * The words of a Bar, Line or Area Chart: those of every chart, and the words of
 * the summary of its data that screen readers read, such as "Jan to Jun.
 * Desktop: lowest 73, highest 305."
 */
export type CartesianChartLabels = ChartLabels & {
  /** Joins the first and the last x value: "to" by default. */
  to: string;
  /** Comes before the lowest value of a series: "lowest" by default. */
  lowest: string;
  /** Comes before the highest value of a series: "highest" by default. */
  highest: string;
};

/**
 * How a line or an area connects its points. `monotone`, the default of the
 * Line and the Area Chart, bends through every point and never swings past the
 * data; `smooth` is a natural spline, which bends evenly and can swing a little
 * past the data between two points.
 */
export type ChartCurve = "smooth" | "monotone" | "linear" | "step";

/** Shared by BarChart, LineChart and AreaChart. */
export type CartesianChartProps = {
  data: readonly ChartDatum[];
  /** Key of the x value in the data: category text, or a Date for a time axis. */
  x: string;
  series: readonly ChartSeries[];
  /** The accessible name of the chart. */
  label: string;
  /**
   * The id of an element that describes the chart, read after the summary of
   * its data that the chart gives assistive technology itself.
   */
  "aria-describedby"?: string;
  /** The height of the chart in px, a legend included; the width follows the container. */
  height?: number;
  /** Formats a value in the tooltip, and on the value axis when given. */
  formatValue?: (value: number) => string;
  /** Formats an x value on the axis and in the tooltip heading. */
  formatX?: (value: ChartXValue) => string;
  /** The locale of the numbers and dates. */
  locale?: string;
  /**
   * The colours of the series that name none. `brand` (the default) shades the
   * brand colour from strong to light, spread over the number of series (up to
   * eight); `categorical` gives each series its own chart colour, `--chart-1`
   * to `--chart-8` in order. Both start over from the ninth series. A series
   * that names its `color` keeps it either way.
   */
  palette?: ChartPalette;
  /** Whether to list the series below the plot. On when there is more than one series. */
  legend?: boolean;
  /** Horizontal grid lines. */
  grid?: boolean;
  /** Labels along the x axis. */
  xAxis?: boolean;
  /** Labels along the value axis. */
  yAxis?: boolean;
  /** Shown in place of the marks when there is nothing to draw. */
  emptyLabel?: string;
  /**
   * Replaces words that the chart gives screen readers, merged with the
   * English defaults: its role description, the keyboard hint and the words of
   * the summary of its data.
   */
  labels?: Partial<CartesianChartLabels> | undefined;
  className?: string;
};
