"use client";

/*
 * The renderer behind the Line Chart and the Area Chart. Two ideas are adapted
 * from bklit UI's chart components (MIT): the data point under the pointer is
 * the one nearest to it on the x axis (use-chart-interaction.ts), and the value
 * axis moves with the marks when new data arrives (use-animated-y-domains.ts).
 * Everything else is Siteplane's own, built on d3-scale, the kit Tooltip and
 * the kit's motion hooks.
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

import { cn } from "../../system/utils/cn";
import { useTweenedValues } from "../motion";
import {
  ChartActiveDot,
  ChartCategoryAxis,
  ChartCrosshair,
  ChartEmptyState,
  ChartGrid,
  ChartValueAxis,
  cartesianLayout,
  useCartesianLayout,
  useGlidingLabels,
  useGlidingTicks,
  useLastValue,
} from "./chart-cartesian";
import {
  areaGradientStops,
  curvePath,
  curveTrace,
  heldSampleCount,
  morphSampleCount,
  sampleCurve,
  type ChartPoint,
} from "./chart-curve";
import {
  CHART_DEFAULT_LOCALE,
  chartNumberFormatter,
  chartTickLabels,
  chartXFormatter,
} from "./chart-format";
import { nearestIndex, useChartInteraction } from "./chart-interaction";
import { ChartLegend, useChartSeriesFocus } from "./chart-legend";
import {
  buildCartesianModel,
  cartesianSummary,
  type CartesianModel,
  type CartesianRow,
} from "./chart-model";
import { seriesColors } from "./chart-palette";
import {
  calendarTicks,
  estimateLabelWidth,
  labelStep,
  pointScale,
  timeScale,
  valueScale,
  valueScaleAt,
  valueTicks,
} from "./chart-scales";
import { ChartAxisPill, useCoveredLabels } from "./chart-axis-pill";
import {
  chartDimOpacity,
  seriesSteppedBack,
  useChartDimClassName,
} from "./chart-dimming";
import { ChartHighlight, highlightBand } from "./chart-highlight";
import {
  ChartTooltip,
  ChartTooltipContent,
  chartTooltipText,
} from "./chart-tooltip";
import type {
  CartesianChartProps,
  ChartCurve,
  ChartXValue,
} from "./chart-types";
import { useChartWidth } from "./use-chart-width";
import type { ScaleTime } from "d3-scale";

/** The runs of rows that have a number, so that a gap in the data breaks a line instead of bridging it. */
export function runsOf(values: readonly (number | null)[]): number[][] {
  const runs: number[][] = [];
  let run: number[] = [];
  values.forEach((value, index) => {
    if (value === null) {
      if (run.length > 0) runs.push(run);
      run = [];
    } else run.push(index);
  });
  if (run.length > 0) runs.push(run);
  return runs;
}

/** One curve that glides: the heights of a series along a run of rows. */
export type MorphCurve = {
  place: number;
  heights: readonly (number | null)[];
  run: number[];
};

/**
 * The curves that glide when new data arrives, or null when the data cannot
 * glide: a series with a gap, a point on its own or no points shows at once. A
 * stacked area glides along its top and along its base.
 */
export function morphCurves(
  model: CartesianModel,
  stacked: boolean,
): MorphCurve[] | null {
  const runs = model.tops.map(runsOf);
  if (
    model.empty ||
    !runs.every((own) => own.length === 1 && own[0]!.length > 1)
  )
    return null;
  return runs.flatMap((own, place): MorphCurve[] => {
    const top = { heights: model.tops[place]!, place, run: own[0]! };
    return stacked ? [top, { ...top, heights: model.bases[place]! }] : [top];
  });
}

/**
 * The numbers that glide, in the units of the data, so that what lies between
 * two grid lines stays between them: the two ends of the value axis, then the
 * height of every curve at `count` places along its length. Curves of any
 * length are put into the same number of places, which is how a series of
 * another length morphs into the old one.
 */
export function morphTarget(
  curves: readonly MorphCurve[],
  positions: readonly number[],
  domain: readonly [number, number],
  curve: ChartCurve,
  count: number,
): number[] {
  return [
    domain[0],
    domain[1],
    ...curves.flatMap(({ heights, run }) =>
      sampleCurve(
        run.map((index): ChartPoint => [positions[index]!, heights[index]!]),
        count,
        curve,
      ),
    ),
  ];
}

const hundredths = (value: number) => Math.round(value * 100) / 100;

/**
 * The number of places the curves are sampled at while they glide: the one the
 * width of the plot asks for (`morphSampleCount`), held while that stays about
 * the same, so that a label of another width on the value axis does not leave
 * the curves nothing to glide from.
 */
function useSampleCount(plotWidth: number): number {
  const wanted = morphSampleCount(plotWidth);
  const [held, setHeld] = React.useState(wanted);
  const count = heldSampleCount(held, wanted);
  if (count !== held) setHeld(count);
  return count;
}

/** A label of the x axis: where it sits in the plot and what it says. */
export type AxisLabel = { id: string; position: number; text: string };

/**
 * The labels of the x axis, with an even rhythm and none on top of another.
 * Dates are labelled on the calendar ticks of the time scale (days, weeks,
 * months, ...), which it spaces evenly and which need not sit on data points.
 * Categories show every k-th label, one k for the whole axis: the smallest that
 * leaves them clear.
 */
export function axisLabels({
  format,
  positions,
  rows,
  timeAxis,
}: {
  format: (value: ChartXValue) => string;
  /** Where each row sits, in px. */
  positions: readonly number[];
  rows: readonly CartesianRow[];
  /** The scale of a time axis, null for categories. */
  timeAxis: ScaleTime<number, number> | null;
}): AxisLabel[] {
  if (timeAxis) {
    const labels = calendarTicks(timeAxis, (date) =>
      estimateLabelWidth(format(date)),
    ).map((tick) => ({
      id: tick.toISOString(),
      position: hundredths(timeAxis(tick)),
      text: format(tick),
    }));
    // A calendar finer than the text, such as hours written as days, would repeat it.
    return labels.filter(
      (label, index) => index === 0 || label.text !== labels[index - 1]!.text,
    );
  }
  const labels = rows.map((row, index) => ({
    id: row.id,
    position: positions[index]!,
    text: format(row.x),
  }));
  const step = labelStep(
    labels.map((label) => label.position),
    labels.map((label) => estimateLabelWidth(label.text)),
  );
  return labels.filter((_, index) => index % step === 0);
}

// The room beyond the plot, in px, in which the pointer still finds the first and the last point.
const pointerSlack = 16;
// A static dot of a line: 3 px in the series colour.
const dotRadius = 3;
// A line is 2 px, as shadcn draws its lines (`strokeWidth={2}`). The outline
// along the top of an area is 1 px, which is Recharts' default stroke and what
// shadcn leaves its areas with, over the tint.
const lineWidth = 2;
const areaOutlineWidth = 1;
const noValues: readonly number[] = [];

export type LineAreaChartProps = CartesianChartProps & {
  mode: "line" | "area";
  curve?: ChartCurve;
  /** Draws a dot at every point of a line. A point on its own always has one. */
  dots?: boolean;
  /** Stacks the areas on each other. */
  stacked?: boolean;
  fill?: "gradient" | "solid";
};

// Where a series' marks go as points: a run of rows at the given heights.
type Drawn = { base: ChartPoint[] | null; top: ChartPoint[] };

// The gradient of an area lives with the curves, where the Sparkline takes it
// too; it is still reachable from here.
export { areaGradientStops };

// The path of an area: along the top, back along the base.
function areaPath(
  { base, top }: Drawn,
  curve: ChartCurve,
  floor: number,
): string {
  const along = curvePath(top, curve);
  if (base)
    return `${along} ${curvePath([...base].reverse(), curve).replace(/^M/, "L")} Z`;
  const round = (value: number) => Math.round(value * 100) / 100;
  const first = top[0]!;
  const last = top[top.length - 1]!;
  return `${along} L${round(last[0])},${round(floor)} L${round(first[0])},${round(floor)} Z`;
}

/**
 * A line chart or an area chart: the scales, the axes, the marks, the crosshair
 * and the tooltip. It draws its real SVG on the server at a fixed width, lays
 * out at its measured width once it has mounted, and glides to new data.
 */
export function LineAreaChart({
  mode,
  curve = "smooth",
  dots = false,
  stacked = false,
  fill = "gradient",
  data,
  x,
  series,
  label,
  "aria-describedby": describedBy,
  height = 240,
  formatValue,
  formatX,
  locale = CHART_DEFAULT_LOCALE,
  palette = "brand",
  legend = series.length > 1,
  grid = true,
  xAxis = true,
  yAxis = true,
  emptyLabel = "No data",
  className,
}: LineAreaChartProps): React.ReactElement {
  const root = React.useRef<HTMLElement>(null);
  const svg = React.useRef<SVGSVGElement>(null);
  const gradient = React.useId();
  const width = useChartWidth(root);
  const area = mode === "area";
  const stack = area && stacked;
  const colors = seriesColors(series, palette);
  const showLegend = legend && series.length > 0;
  // The series whose entry the mouse is over in the legend: the chart owns it
  // and hands it to the legend and to its own marks.
  const focus = useChartSeriesFocus(series.map((item) => item.key));

  const model = React.useMemo(
    () => buildCartesianModel({ data, series, stacked: stack, x }),
    [data, series, stack, x],
  );
  const { rows } = model;

  // The value axis the data asks for: a nice domain with ticks on its ends
  // (seven at most), for a plot as tall as the chart less its labels.
  const plotHeight = cartesianLayout({
    height,
    legend: showLegend,
    width,
    xAxis,
    yAxis,
    yLabels: [],
  }).plotHeight;
  const wanted = valueScale(model.extent, [plotHeight, 0]);
  const tickValues = valueTicks(wanted, plotHeight);
  const tickLabels = chartTickLabels(tickValues, locale, formatValue);
  const layout = useCartesianLayout({
    height,
    legend: showLegend,
    width,
    xAxis,
    yAxis,
    yLabels: tickLabels,
  });

  // Where each row sits along the x axis, in hundredths of a pixel, and the time
  // scale that puts it there when the axis counts dates.
  const { positions, timeAxis } = React.useMemo(() => {
    const range: [number, number] = [0, layout.plotWidth];
    if (model.time) {
      const scale = timeScale(
        rows.map((row) => row.x as Date),
        range,
      );
      return {
        positions: rows.map((row) => hundredths(scale(row.x as Date))),
        timeAxis: scale,
      };
    }
    const scale = pointScale(
      rows.map((row) => row.id),
      range,
    );
    return {
      positions: rows.map((row) => hundredths(scale(row.id) ?? 0)),
      timeAxis: null,
    };
  }, [model.time, rows, layout.plotWidth]);

  // New data glides in: the curves morph into the new ones and the value axis
  // moves with them. Data that cannot glide, and a change in the number of
  // series, show at once; at rest the real points are drawn.
  const runs = model.tops.map(runsOf);
  const count = useSampleCount(layout.plotWidth);
  const curves = morphCurves(model, stack);
  const [low, high] = wanted.domain() as [number, number];
  const target = curves
    ? morphTarget(curves, positions, [low, high], curve, count)
    : noValues;
  const tweened = useTweenedValues(target, { container: root });
  const moving = curves !== null && tweened !== target;
  const valueAxis = valueScaleAt(
    moving ? [tweened[0]!, tweened[1]!] : [low, high],
    [layout.plotHeight, 0],
  );
  // A value as a height in the plot, in hundredths of a pixel.
  const yScale = (value: number) => hundredths(valueAxis(value));

  // The marks of each series as points, from the real data at rest and from the
  // samples while they glide.
  const drawn: Drawn[][] = series.map((_, place) =>
    runs[place]!.map((run): Drawn => {
      const first = positions[run[0]!]!;
      const last = positions[run[run.length - 1]!]!;
      const along = (heights: readonly number[]) =>
        heights.map((value, step): ChartPoint => [
          first + ((last - first) * step) / Math.max(1, heights.length - 1),
          yScale(value),
        ]);
      if (moving && curves) {
        const slot = curves.findIndex((item) => item.place === place);
        // The top of the series is its first curve, and its base the next.
        const part = (offset: number) =>
          tweened.slice(
            2 + (slot + offset) * count,
            2 + (slot + offset + 1) * count,
          );
        return {
          base: stack ? along(part(1)) : null,
          top: along(part(0)),
        };
      }
      const at = (heights: readonly (number | null)[]) =>
        run.map((index): ChartPoint => [
          positions[index]!,
          yScale(heights[index]!),
        ]);
      return {
        base: stack ? at(model.bases[place]!) : null,
        top: at(model.tops[place]!),
      };
    }),
  );

  // The dots of the chart: one at every point of a line when `dots` is on, and
  // always one for a point on its own, which has no line to show it. They sit at
  // the real points, so they wait while the marks glide.
  const marks = series.flatMap((item, place) =>
    runs[place]!.flatMap((run, index) =>
      run.length === 1 || dots
        ? run.map((row, step) => ({
            cx: positions[row]!,
            cy: yScale(model.tops[place]![row]!),
            key: `${item.key}-${index}-${step}`,
            place,
            row,
          }))
        : [],
    ),
  );

  // The labels of the axes. Each is keyed, so a label that comes or goes fades
  // through while the others stay: the old labels go out before the new ones
  // come in, and never are two legible on top of each other. The x labels of an
  // axis that new data changes are all replaced, even a date that both axes
  // have, which sits in another place on the new one. The value labels stay by
  // their value and glide with the axis, the grid lines with them; the ones
  // that go fade where they stood, and the axis leaves out any that would
  // touch another while it moves (`ChartValueAxis`).
  const formatText = formatX ?? chartXFormatter(locale, "short");
  const formatHeading = formatX ?? chartXFormatter(locale, "long");
  const xLabels = useGlidingLabels({
    container: root,
    labels:
      xAxis && !model.empty
        ? axisLabels({ format: formatText, positions, rows, timeAxis })
        : [],
    signature: timeAxis
      ? `${rows[0]?.id}|${rows[rows.length - 1]?.id}`
      : rows.map((row) => row.id).join("|"),
  });
  const yTicks = useGlidingTicks({
    container: root,
    length: layout.plotHeight,
    place: yScale,
    ticks:
      (grid || yAxis) && !model.empty
        ? tickValues.map((value, index) => ({
            text: tickLabels[index]!,
            value,
          }))
        : [],
  });

  // The item under the pointer is the row nearest to it along the x axis. A
  // chart with no numbers has no items: nothing to point at, no focus stop.
  const rowAt = (clientX: number): string | null => {
    const box = svg.current?.getBoundingClientRect();
    if (!box || !box.width || model.empty) return null;
    const along =
      ((clientX - box.x) * layout.width) / box.width - layout.margin.left;
    if (along < -pointerSlack || along > layout.plotWidth + pointerSlack)
      return null;
    const index = nearestIndex(positions, along);
    return index < 0 ? null : rows[index]!.id;
  };
  const interaction = useChartInteraction({
    itemAt: (clientX) => rowAt(clientX),
    keys: model.empty ? [] : rows.map((row) => row.id),
  });
  const activeIndex = rows.findIndex((row) => row.id === interaction.activeKey);
  const active = activeIndex >= 0 ? rows[activeIndex] : undefined;
  // The dots and the crosshair wait where they last were while they fade out.
  const lastKey = useLastValue(interaction.activeKey);
  const shownIndex = Math.max(
    0,
    rows.findIndex((row) => row.id === lastKey),
  );

  // The pill sits on the axis at the active row, and the labels it would cover
  // fade out until it has passed.
  const spot =
    xAxis && !model.empty && active
      ? { position: positions[activeIndex]!, text: formatText(active.x) }
      : null;
  const covered = useCoveredLabels(xLabels, spot, "bottom");

  // While a point is active the strokes step back, an area with its fill, and the
  // stretch around the point is drawn again at full strength on top of them. A
  // series steps back as well while another one's entry has the mouse in the
  // legend; either rule is enough, and the stretch of a series that the legend
  // holds back stays at that level.
  const dimmed = active !== undefined && !model.empty;
  const steppedBack = (key: string) =>
    dimmed || seriesSteppedBack(focus.focusedKey, key);
  // A dot steps back with its line: outside the highlighted stretch, one point
  // either side of the active one, and wholly while the legend holds its series
  // back, so that no dot stays in full colour on a line that has stepped back.
  const dotSteppedBack = (mark: (typeof marks)[number]) =>
    seriesSteppedBack(focus.focusedKey, series[mark.place]!.key) ||
    (dimmed && Math.abs(mark.row - activeIndex) > 1);
  const dimKind = area ? "area" : "line";
  const dimClassName = useChartDimClassName("series");
  const strokeWidth = area ? areaOutlineWidth : lineWidth;
  // The dots ride the curves of their series from point to point.
  const traces = drawn.map((own) =>
    curveTrace(
      own.map((part) => part.top),
      curve,
    ),
  );
  const lineDs = drawn.map((own) =>
    own
      .filter((part) => part.top.length > 1)
      .map((part) => curvePath(part.top, curve))
      .join(" "),
  );

  // The card sits beside the crosshair of the row, at the top of the plot.
  const anchorFor = (key: string) => {
    const index = rows.findIndex((row) => row.id === key);
    const box = svg.current?.getBoundingClientRect();
    if (index < 0 || !box || !box.width) return null;
    const scale = box.width / layout.width;
    return {
      x: box.x + (layout.margin.left + positions[index]!) * scale,
      y: box.y + layout.margin.top * scale,
    };
  };
  const formatNumber = formatValue ?? chartNumberFormatter(locale);
  const heading = active ? formatHeading(active.x) : undefined;
  const tooltipRows = active
    ? series.flatMap((item, place) => {
        const value = model.values[place]![activeIndex];
        return value === null || value === undefined
          ? []
          : [
              {
                color: colors[place]!,
                key: item.key,
                label: item.label,
                value: formatNumber(value),
              },
            ];
      })
    : [];
  const content = active && (
    <ChartTooltipContent heading={heading} rows={tooltipRows} />
  );

  return (
    // The figure holds the plot and the legend. The focus stop inside is the
    // chart for assistive technology, named by the label alone.
    <figure
      className={cn("flex w-full flex-col", className)}
      data-slot={area ? "area-chart" : "line-chart"}
      ref={root}
    >
      <ChartTooltip
        anchorFor={anchorFor}
        announcement={
          active ? chartTooltipText(heading, tooltipRows) : undefined
        }
        className="relative block w-full rounded-lg"
        content={content}
        describedBy={describedBy}
        description={cartesianSummary({
          emptyLabel,
          formatValue: formatNumber,
          formatX: formatHeading,
          model,
          series,
        })}
        interaction={interaction}
        label={label}
      >
        {/* The plot is as tall as the chart from the first paint, on the
            server too, and as wide as its box: until the chart has measured
            its width, the drawing scales into that box and the page around it
            does not move. It is a picture that the focus stop describes, so
            it is hidden from assistive technology. */}
        <svg
          aria-hidden="true"
          className="block w-full overflow-visible"
          height={layout.height}
          ref={svg}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          width={layout.width}
        >
          {/* No SVG titles: the browser would show its own tooltip next to the
              chart's. The label names the chart; the tooltip carries the values. */}
          {area && fill === "gradient" && (
            <defs>
              {series.map((item, place) => (
                <linearGradient
                  id={`${gradient}-${place}`}
                  key={item.key}
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  {areaGradientStops(
                    drawn[place]!.flatMap((part) =>
                      [...part.top, ...(part.base ?? [])].map(([, y]) => y),
                    ).concat(stack ? [] : [yScale(0)]),
                    yScale(0),
                  ).map((stop) => (
                    <stop
                      key={stop.offset}
                      offset={stop.offset}
                      stopColor={colors[place]}
                      stopOpacity={stop.opacity}
                    />
                  ))}
                </linearGradient>
              ))}
            </defs>
          )}
          <g
            transform={`translate(${layout.margin.left} ${layout.margin.top})`}
          >
            {grid && !model.empty && (
              <ChartGrid
                layout={layout}
                positions={yTicks.map((tick) => tick.position)}
                presences={yTicks.map((tick) => tick.presence)}
              />
            )}
            {yAxis && !model.empty && (
              <ChartValueAxis layout={layout} side="left" ticks={yTicks} />
            )}
            {xAxis && !model.empty && (
              <ChartCategoryAxis
                fading={covered.fading}
                labels={covered.labels}
                layout={layout}
                side="bottom"
                thin={false}
              />
            )}
            {area &&
              series.map((item, place) => {
                const parts = drawn[place]!.filter(
                  (part) => part.top.length > 1,
                );
                return parts.length > 0 ? (
                  <path
                    d={parts
                      .map((part) => areaPath(part, curve, yScale(0)))
                      .join(" ")}
                    data-slot="chart-area"
                    className={dimClassName}
                    fill={
                      fill === "gradient"
                        ? `url(#${gradient}-${place})`
                        : colors[place]
                    }
                    fillOpacity={fill === "solid" ? 0.18 : undefined}
                    key={item.key}
                    opacity={chartDimOpacity(dimKind, steppedBack(item.key))}
                  />
                ) : null;
              })}
            {series.map((item, place) =>
              lineDs[place] ? (
                <path
                  d={lineDs[place]}
                  data-slot="chart-line"
                  className={dimClassName}
                  fill="none"
                  key={item.key}
                  opacity={chartDimOpacity(dimKind, steppedBack(item.key))}
                  stroke={colors[place]}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={strokeWidth}
                />
              ) : null,
            )}
            {!model.empty && (
              <ChartHighlight
                band={dimmed ? highlightBand(positions, activeIndex) : null}
                container={root}
                height={layout.plotHeight}
                strokes={series.flatMap((item, place) =>
                  lineDs[place]
                    ? [
                        {
                          color: colors[place]!,
                          d: lineDs[place],
                          key: item.key,
                          steppedBack: seriesSteppedBack(
                            focus.focusedKey,
                            item.key,
                          ),
                          width: strokeWidth,
                        },
                      ]
                    : [],
                )}
              />
            )}
            {marks.length > 0 && (
              <g
                className={
                  moving
                    ? "opacity-0"
                    : "transition-opacity duration-(--motion-duration-micro) ease-(--motion-ease-state)"
                }
              >
                {marks.map((mark) => (
                  <circle
                    className={dimClassName}
                    cx={mark.cx}
                    cy={mark.cy}
                    data-slot="chart-dot"
                    fill={colors[mark.place]}
                    key={mark.key}
                    opacity={chartDimOpacity(dimKind, dotSteppedBack(mark))}
                    r={dotRadius}
                  />
                ))}
              </g>
            )}
            {!model.empty && (
              <>
                <ChartCrosshair
                  container={root}
                  layout={layout}
                  position={active ? positions[activeIndex]! : null}
                />
                {series.map((item, place) => {
                  const value = model.tops[place]![shownIndex];
                  return value === null || value === undefined ? null : (
                    <ChartActiveDot
                      color={colors[place]!}
                      container={root}
                      cx={positions[shownIndex]!}
                      trace={traces[place]}
                      cy={yScale(value)}
                      key={item.key}
                      visible={active !== undefined && !moving}
                    />
                  );
                })}
              </>
            )}
          </g>
          {model.empty && (
            <ChartEmptyState label={emptyLabel} layout={layout} />
          )}
        </svg>
        <ChartAxisPill
          container={root}
          layout={layout}
          side="bottom"
          spot={spot}
        />
      </ChartTooltip>
      {showLegend && (
        <ChartLegend
          className="pt-3"
          focus={focus}
          items={series.map((item, place) => ({
            color: colors[place]!,
            key: item.key,
            label: item.label,
          }))}
          layout="row"
        />
      )}
    </figure>
  );
}
