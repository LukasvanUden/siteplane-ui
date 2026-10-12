import type { ChartPalette, ChartSeries } from "./chart-types";

/** The colour of the series at `index`: `--chart-1` to `--chart-5` in order, then round again. */
export function chartSeriesColor(index: number): string {
  return `var(--chart-${(index % 5) + 1})`;
}

/**
 * A brand shade: `share` percent of the chart's brand colour (`--chart-brand`,
 * the lifted brand in Dark), the rest the colour the shades fade towards:
 * `--chart-brand-fade` where a theme sets one, otherwise the card surface.
 */
function brandShade(share: number): string {
  return `color-mix(in oklab, var(--chart-brand) ${share}%, var(--chart-brand-fade, var(--sp-rw-bg-secondary)))`;
}

/**
 * The shares of the brand colour in the shades of a chart of 1 to 5 series,
 * from strong to light. Every count starts at the brand colour itself and
 * spreads its other shades over the range, so that two series stand clearly
 * apart and five take the five steps.
 */
const brandShares = [
  [100],
  [100, 55],
  [100, 70, 45],
  [100, 76, 56, 38],
  [100, 76, 56, 38, 24],
] as const;

/** Brand shades from strong to light, faded into the card (towards a deeper brand in Dark): the five-step order that more than five series go round again. */
export const chartBrandShades: readonly string[] =
  brandShares[4].map(brandShade);

/**
 * The brand shades of `count` series, from strong to light: the first series is
 * the brand colour itself. Up to five series are spread over the range of the
 * shades; more than five repeat the five-step order.
 */
export function chartBrandPalette(count: number): string[] {
  const places = Math.max(0, Math.floor(count));
  if (places <= brandShares.length)
    return places === 0 ? [] : brandShares[places - 1]!.map(brandShade);
  return Array.from(
    { length: places },
    (_, index) => chartBrandShades[index % chartBrandShades.length]!,
  );
}

/** The colours of the `count` series of `palette`, in the order of their places. */
export function chartPaletteColors(
  palette: ChartPalette,
  count: number,
): string[] {
  return palette === "brand"
    ? chartBrandPalette(count)
    : Array.from({ length: Math.max(0, Math.floor(count)) }, (_, index) =>
        chartSeriesColor(index),
      );
}

// The step of the five that the last share of a ring takes when the steps
// would close the ring on the first share's colour: the middle one, which is
// neither the step before it (the fifth) nor the first.
const ringClosingStep = 2;

/**
 * The colours of the `count` filled shares of a ring, in order: the palette's,
 * except that the last share never takes the colour of the first, which it
 * meets where the ring closes. From the sixth share the five steps repeat, so
 * a ring of 6, 11, 16, ... shares would close on two shares of one colour; its
 * last share takes the middle step instead, which differs from both of its
 * neighbours.
 */
export function chartRingColors(
  palette: ChartPalette,
  count: number,
): string[] {
  const colors = chartPaletteColors(palette, count);
  const last = colors.length - 1;
  if (last > ringClosingStep && colors[last] === colors[0])
    colors[last] = colors[ringClosingStep]!;
  return colors;
}

/** An empty share reads as the unfilled rest of the ring. */
export const chartEmptyColor =
  "color-mix(in oklab, var(--sp-rw-fg-quaternary) 26%, var(--sp-rw-bg-secondary))";

/** The colour of every series: the one it names, otherwise the one the palette has for its place. */
export function seriesColors(
  series: readonly ChartSeries[],
  palette: ChartPalette = "brand",
): string[] {
  const colors = chartPaletteColors(palette, series.length);
  return series.map((item, index) => item.color ?? colors[index]!);
}
