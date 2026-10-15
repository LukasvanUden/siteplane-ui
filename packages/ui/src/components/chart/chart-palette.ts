import type { ChartPalette, ChartSeries } from "./chart-types";

// How many colours each palette has before it starts over: `--chart-1` to
// `--chart-8`, and the eight brand shades.
const paletteSize = 8;

/** The colour of the series at `index`: `--chart-1` to `--chart-8` in order, then round again. */
export function chartSeriesColor(index: number): string {
  return `var(--chart-${(index % paletteSize) + 1})`;
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
 * The shares of the brand colour in the shades of a chart of 1 to 8 series,
 * from strong to light. Every count starts at the brand colour itself and
 * spreads its other shades over the range, so that two series stand clearly
 * apart and five take the five steps. Six to eight series share the range of
 * five, 100 down to 24, and keep its curve: their shares are the five steps
 * read at their own places along it (linear between two steps, rounded), so
 * the strong shades stay further apart than the light ones, as with five.
 */
const brandShares = [
  [100],
  [100, 55],
  [100, 70, 45],
  [100, 76, 56, 38],
  [100, 76, 56, 38, 24],
  [100, 81, 64, 49, 35, 24],
  [100, 84, 69, 56, 44, 33, 24],
  [100, 86, 73, 62, 51, 41, 32, 24],
] as const;

/** The brand shades of five series, from strong to light, faded into the card (towards a deeper brand in Dark). The Bar List draws its bars in the lightest. */
export const chartBrandShades: readonly string[] =
  brandShares[4].map(brandShade);

/**
 * The brand shades of `count` series, from strong to light: the first series is
 * the brand colour itself. Up to eight series are spread over the range of the
 * shades; more than eight repeat the eight-step order.
 */
export function chartBrandPalette(count: number): string[] {
  const places = Math.max(0, Math.floor(count));
  if (places <= brandShares.length)
    return places === 0 ? [] : brandShares[places - 1]!.map(brandShade);
  const steps = brandShares[brandShares.length - 1]!.map(brandShade);
  return Array.from(
    { length: places },
    (_, index) => steps[index % steps.length]!,
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

// The step that the last share of a ring takes when the steps would close the
// ring on the first share's colour: the third, which is neither the step
// before it (the last of the round) nor the first.
const ringClosingStep = 2;

/**
 * The colours of the `count` filled shares of a ring, in order: the palette's,
 * except that the last share never takes the colour of the first, which it
 * meets where the ring closes. From the ninth share the eight steps repeat, so
 * a ring of 9, 17, 25, ... shares would close on two shares of one colour; its
 * last share takes the third step instead, which differs from both of its
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
