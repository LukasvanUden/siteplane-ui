/** An x value: category text, or a date for a time axis. */
export type ChartXValue = string | Date;

/** One row of chart data: the x value and one number per series. */
export type ChartDatum = Record<
  string,
  string | number | Date | null | undefined
>;

/**
 * Where a chart takes the colour of a series that names none. `brand` shades
 * the brand colour from strong to light, spread over the number of series;
 * `categorical` gives each series its own chart colour, `--chart-1` to
 * `--chart-5` in order.
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
 * How a line or an area connects its points. `smooth` is a natural spline,
 * which bends evenly and can swing a little past the data between two points;
 * `monotone` never does.
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
   * brand colour from strong to light, spread over the number of series;
   * `categorical` gives each series its own chart colour, `--chart-1` to
   * `--chart-5` in order. A series that names its `color` keeps it either way.
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
  className?: string;
};
