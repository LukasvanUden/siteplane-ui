"use client";

import * as React from "react";

import { cn } from "../../system/utils/cn";
import {
  ChartActiveDot,
  ChartCategoryAxis,
  ChartCrosshair,
  ChartEmptyState,
  ChartGrid,
  ChartValueAxis,
  cartesianLayout,
  chartAxisLabelClassName,
  chartHighlightedTextClassName,
  useCartesianLayout,
  useChartBox,
  useGlidingLabels,
  useGlidingTicks,
  useLastValue,
} from "../chart/chart-cartesian";
import { chartXKey } from "../chart/chart-data";
import {
  CHART_DEFAULT_LOCALE,
  chartLabels,
  chartNumberFormatter,
  chartTickLabels,
  chartXFormatter,
} from "../chart/chart-format";
import { useChartInteraction } from "../chart/chart-interaction";
import { ChartLegend, useChartSeriesFocus } from "../chart/chart-legend";
import {
  buildCartesianModel,
  cartesianSummary,
  type CartesianModel,
} from "../chart/chart-model";
import { seriesColors } from "../chart/chart-palette";
import {
  bandScale,
  valueScale,
  valueScaleAt,
  valueTicks,
} from "../chart/chart-scales";
import { ChartAxisPill, useCoveredLabels } from "../chart/chart-axis-pill";
import {
  chartDimOpacity,
  seriesSteppedBack,
  useChartDimClassName,
} from "../chart/chart-dimming";
import {
  ChartPlotPlaceholder,
  ChartTooltip,
  ChartTooltipContent,
  chartTooltipText,
} from "../chart/chart-tooltip";
import type {
  CartesianChartLabels,
  CartesianChartProps,
  ChartXValue,
} from "../chart/chart-types";
import { useTweenedRows, useTweenedValues } from "../motion";
import {
  barPath,
  barSlots,
  barValueLabels,
  barsAt,
  categoryAt,
  categoryBand,
  categoryCentres,
  categoryFractions,
  categoryLabels,
  fittingTicks,
  glidingSlots,
  hundredths,
  valueLabelRoom,
  valueLabelTexts,
  visibleValueLabels,
  type BandFraction,
  type BarSlot,
} from "./bar-layout";

export type BarChartProps = CartesianChartProps & {
  /**
   * `vertical` draws columns over a category axis along the bottom; `horizontal`
   * puts the categories down the left side and the bars along them, the way a
   * ranking reads. `xAxis` labels the categories and `yAxis` the values in
   * either orientation, so a horizontal chart draws the first at the left and
   * the second along the bottom.
   */
  orientation?: "vertical" | "horizontal";
  /**
   * Stacks the bars of a category on each other, in the order of the series:
   * positive values up from 0 and negative ones down from it. Otherwise the
   * bars stand side by side.
   */
  stacked?: boolean;
  /**
   * Writes the value of each bar at its end: above a column, below one under
   * 0, beside a horizontal bar. A stack shows the sum of each sign at its outer
   * end. The labels are muted 12 px text in the format of the tooltip, and a
   * chart that has no room for all of them shows every k-th category's.
   */
  valueLabels?: boolean;
  /**
   * The x value of one category to set apart, such as a period that is still
   * running: its bars take a hatched fill in their colour, and its label on the
   * axis, and its value labels, the text colour.
   */
  highlight?: ChartXValue;
};

// The stripes of the hatched fill of a highlighted category: a soft stripe of
// the series' colour every 6 px, 2 px wide, at 45 degrees, over a tint of that
// colour. The tint is 40 % of the colour, and the stripe, 60 % of the colour
// drawn over the tint, 76 % in all: half the step between a stripe and its gap
// that full stripes on a 24 % tint had (Lukas, 15 October 2026), while the bar
// as a whole stands out from the card as much as before and stays clearly
// lighter than a plain bar. The tile counts in the units of the plot, so the
// stripes stay put while a bar grows or shrinks across them.
const hatchPitch = 6;
const hatchStripe = 2;
const hatchTint = 40;
const hatchStripeStrength = 60;

// A bar as the chart keeps it: its place and number, and the colours it keeps
// even while it shrinks away after its series has gone.
type BarRow = {
  id: string;
  slot: BarSlot;
  color: string;
  negativeColor: string | undefined;
};

/**
 * One or several series of bars over categories or dates, side by side or
 * stacked, as columns or as horizontal bars, with a tooltip for the category
 * under the pointer and arrow-key navigation. The chart core draws its axes,
 * grid, tooltip and legend; new data glides in: a new bar grows from the 0
 * line, a bar that is gone shrinks away, and the value axis moves with the
 * bars. The bars are drawn once the chart has measured its width: until then,
 * on the server too, it renders the box of the plot at its full height, the
 * legend and what screen readers read. A chart that fills the height of its
 * box measures that height too, and keeps `minHeight` until it knows it.
 */
export function BarChart({
  stacked = false,
  data,
  x,
  series,
  label,
  "aria-describedby": describedBy,
  height: givenHeight,
  minHeight,
  formatValue,
  formatX,
  locale = CHART_DEFAULT_LOCALE,
  palette = "brand",
  legend = series.length > 1,
  emptyLabel = "No data",
  labels,
  className,
  ...plot
}: BarChartProps): React.ReactElement {
  const root = React.useRef<HTMLElement>(null);
  // The chart core sizes the chart: its width, and its height in px or from
  // the box it fills.
  const box = useChartBox(root, { height: givenHeight, minHeight });
  const { height, width } = box;
  const colors = seriesColors(series, palette);
  const showLegend = legend && series.length > 0;
  // The series whose entry the mouse is over in the legend: the chart owns it
  // and hands it to the legend and to its own bars.
  const focus = useChartSeriesFocus(series.map((item) => item.key));
  const words = chartLabels(labels);

  // The rows of the chart and the span of its numbers, read as the Line and
  // the Area Chart read theirs: a row for each category or date (dates in
  // order), repeated ones kept apart, a missing value left out.
  const model = React.useMemo(
    () => buildCartesianModel({ data, series, stacked, x }),
    [data, series, stacked, x],
  );
  const formatHeading = formatX ?? chartXFormatter(locale, "long");
  const formatNumber = formatValue ?? chartNumberFormatter(locale);
  const description = cartesianSummary({
    emptyLabel,
    formatValue: formatNumber,
    formatX: formatHeading,
    labels: words,
    model,
    series,
  });

  return (
    // The figure holds the plot and the legend. The focus stop inside is the
    // chart for assistive technology, named by the label alone.
    <figure
      className={cn(
        "sp-bar-chart",
        "flex w-full flex-col",
        box.className,
        className,
      )}
      data-height={box.dataHeight}
      data-slot="bar-chart"
      ref={root}
      style={box.style}
    >
      {width === null ? (
        <ChartPlotPlaceholder
          className={plotClassName}
          description={description}
          describedBy={describedBy}
          height={
            cartesianLayout({
              height,
              legend: showLegend,
              width: 0,
              xAxis: true,
              yAxis: true,
              yLabels: [],
            }).height
          }
          label={label}
          roleDescription={words.roleDescription}
        />
      ) : (
        <BarPlot
          {...plot}
          colors={colors}
          describedBy={describedBy}
          description={description}
          emptyLabel={emptyLabel}
          focusedKey={focus.focusedKey}
          formatHeading={formatHeading}
          formatNumber={formatNumber}
          formatValue={formatValue}
          formatX={formatX}
          height={height}
          label={label}
          locale={locale}
          model={model}
          root={root}
          series={series}
          showLegend={showLegend}
          stacked={stacked}
          width={width}
          words={words}
          x={x}
        />
      )}
      {showLegend && (
        <ChartLegend
          className="pt-3"
          focus={focus}
          items={series.map((item, order) => ({
            color: colors[order]!,
            key: item.key,
            label: item.label,
          }))}
          layout="row"
        />
      )}
    </figure>
  );
}

// The focus stop that holds the plot, and the box of the plot before it is drawn.
const plotClassName = "relative block w-full rounded-lg";

/**
 * The plot of a Bar Chart at its measured width: the bars, the axes, the grid,
 * the crosshair and the tooltip. It mounts once the chart knows its width, so
 * every part that glides starts at the place it has at that width.
 */
function BarPlot({
  colors,
  describedBy,
  description,
  emptyLabel,
  focusedKey,
  formatHeading,
  formatNumber,
  formatValue,
  formatX,
  grid = true,
  height,
  highlight,
  label,
  locale,
  model,
  orientation = "vertical",
  root,
  series,
  showLegend,
  stacked,
  valueLabels = false,
  width,
  words,
  x,
  xAxis = true,
  yAxis = true,
}: Pick<
  BarChartProps,
  "grid" | "highlight" | "orientation" | "valueLabels" | "xAxis" | "yAxis"
> & {
  colors: readonly string[];
  describedBy: string | undefined;
  description: string;
  emptyLabel: string;
  focusedKey: string | null;
  formatHeading: (value: ChartXValue) => string;
  formatNumber: (value: number) => string;
  formatValue: ((value: number) => string) | undefined;
  formatX: ((value: ChartXValue) => string) | undefined;
  height: number;
  label: string;
  locale: string;
  model: CartesianModel;
  root: React.RefObject<HTMLElement | null>;
  series: BarChartProps["series"];
  showLegend: boolean;
  stacked: boolean;
  width: number;
  words: CartesianChartLabels;
  x: string;
}): React.ReactElement {
  const svg = React.useRef<SVGSVGElement>(null);
  const horizontal = orientation === "horizontal";
  const { rows } = model;
  const formatText = formatX ?? chartXFormatter(locale, "short");

  // A horizontal chart turns the axes: its values run along the bottom and its
  // categories down the left side, and the layout reserves room for the labels
  // of the side they are on.
  const frame = {
    height,
    legend: showLegend,
    width,
    ...(horizontal ? { xAxis: yAxis, yAxis: xAxis } : { xAxis, yAxis }),
  };
  // The room the value labels need beyond the ends of the bars, at the start of
  // the value axis (below a column under 0, before a horizontal bar under 0)
  // and at its end. The value axis keeps it inside the plot, less what the
  // margin beyond the end of the axis already gives, so that no label runs
  // into the axis labels or out of the chart.
  const labelRoom =
    valueLabels && !model.empty
      ? valueLabelRoom(
          valueLabelTexts(model.values, stacked, formatNumber),
          orientation,
        )
      : { end: 0, start: 0 };
  // The value axis the data asks for: a nice domain with ticks on its ends
  // (seven at most). A vertical axis is as long as the plot is tall,
  // whatever its labels are, so it is drawn before the layout; a horizontal one
  // is as long as the plot is wide, which the labels of the categories decide.
  // `margin` is the room beyond the end of the axis: above a vertical one,
  // after a horizontal one.
  const axisFor = (length: number, margin: number) => {
    const start = labelRoom.start;
    const end = Math.max(0, labelRoom.end - margin);
    const range: [number, number] = horizontal
      ? [start, Math.max(start, length - end)]
      : [Math.max(end, length - start), end];
    const inner = Math.abs(range[1] - range[0]);
    const wanted = valueScale(model.extent, range);
    const values = horizontal
      ? fittingTicks(wanted, inner, (ticks) =>
          chartTickLabels(ticks, locale, formatValue),
        )
      : valueTicks(wanted, inner);
    return {
      labels: chartTickLabels(values, locale, formatValue),
      range,
      values,
      wanted,
    };
  };
  const base = cartesianLayout({ ...frame, yLabels: [] });
  const vertical = horizontal
    ? null
    : axisFor(base.plotHeight, base.margin.top);
  const layout = useCartesianLayout({
    ...frame,
    yLabels: vertical ? vertical.labels : rows.map((row) => formatText(row.x)),
  });
  const axis = vertical ?? axisFor(layout.plotWidth, layout.margin.right);
  const valueLength = horizontal ? layout.plotWidth : layout.plotHeight;
  const categoryLength = horizontal ? layout.plotHeight : layout.plotWidth;

  // The bands of the categories, and the bars before they have a length.
  const categoryScale = React.useMemo(
    () =>
      bandScale(
        rows.map((row) => row.id),
        [0, categoryLength],
      ),
    [rows, categoryLength],
  );
  const centres = categoryCentres(
    categoryScale,
    rows.map((row) => row.id),
  );
  const slots = React.useMemo(
    () =>
      barSlots({
        categoryScale,
        data: rows.map((row) => ({ ...row.datum, [x]: row.id })),
        seriesKeys: series.map((item) => item.key),
        stacked,
        x,
      }),
    [categoryScale, rows, series, stacked, x],
  );

  // New data glides in. Each bar is told by its category and series: a bar that
  // is new grows from the 0 line where it stands, one that is gone shrinks away
  // where it stood and then leaves, the others move to their new value. The
  // value axis moves with them, so grid lines and labels stay with the bars.
  const entries = useTweenedRows(
    slots.map((slot): BarRow => ({
      color: colors[slot.order]!,
      id: slot.key,
      negativeColor: series[slot.order]?.negativeColor,
      slot,
    })),
    (row) => row.slot.value,
    { container: root },
  );
  // The bars of a category that stays glide to their new place and thickness
  // when categories come, go or change order. The band of each category is
  // tweened as fractions of the axis, which say where the category is among the
  // others and not how wide the chart is, so a chart that is resized or measured
  // after it mounts does not glide. A category that is new appears in its place
  // and one that is gone stays in its place while its bars shrink.
  const bands = React.useMemo(
    () =>
      rows.flatMap((row) => {
        const band = categoryFractions(categoryScale, row.id);
        return band ? [{ ...band, id: row.id }] : [];
      }),
    [categoryScale, rows],
  );
  const starts = useTweenedRows(bands, (band) => band.start, {
    absent: (band) => band.start,
    container: root,
  });
  const sizes = useTweenedRows(bands, (band) => band.size, {
    absent: (band) => band.size,
    container: root,
  });
  const sizeOf = new Map(sizes.map((entry) => [entry.key, entry]));
  const moving = new Map<string, BandFraction>();
  for (const start of starts) {
    const size = sizeOf.get(start.key);
    if (
      size &&
      !start.leaving &&
      (start.value !== start.row.start || size.value !== size.row.size)
    )
      moving.set(start.key, { size: size.value, start: start.value });
  }
  const [low, high] = axis.wanted.domain() as [number, number];
  const domain = [low, high];
  const glidingDomain = useTweenedValues(domain, { container: root });
  const valueAxis = valueScaleAt(
    glidingDomain !== domain
      ? [glidingDomain[0]!, glidingDomain[1]!]
      : [low, high],
    axis.range,
  );
  // A number as a position on the value axis, in hundredths of a pixel.
  const at = (value: number) => hundredths(valueAxis(value));
  const bars = barsAt(
    glidingSlots(
      entries.map((entry) => ({
        leaving: entry.leaving,
        slot: entry.row.slot,
        value: entry.value,
      })),
      moving,
      { count: series.length, length: categoryLength, stacked },
    ),
    { orientation, stacked, valueScale: valueAxis },
  );

  // The labels of the axes. Each is keyed, so that one that comes or goes fades
  // through while the others stay: the old labels go out before the new ones
  // come in, and never are two legible on top of each other. The labels of the
  // categories are all replaced when the categories change; the labels of the
  // value axis stay by their value and glide with the axis, the grid lines with
  // them, and the ones that go fade where they stood.
  // The category the chart sets apart, such as a period that is still running:
  // the rows whose x value is the one it is given.
  const highlightKey = highlight === undefined ? "" : chartXKey(highlight);
  const highlighted = new Set(
    highlightKey === ""
      ? []
      : rows
          .filter((row) => chartXKey(row.x) === highlightKey)
          .map((row) => row.id),
  );
  const categoryTicks = useGlidingLabels({
    container: root,
    labels:
      xAxis && !model.empty
        ? categoryLabels({
            centres,
            format: formatText,
            rows,
            side: horizontal ? "left" : "bottom",
          }).map((tick) =>
            highlighted.has(tick.id) ? { ...tick, highlighted: true } : tick,
          )
        : [],
    signature: rows.map((row) => row.id).join("|"),
  });
  const valueMarks = useGlidingTicks({
    container: root,
    length: valueLength,
    place: at,
    ticks:
      (grid || yAxis) && !model.empty
        ? axis.values.map((value, index) => ({
            text: axis.labels[index]!,
            value,
          }))
        : [],
  });

  // The item under the pointer is the category whose band it is in. A chart
  // with no numbers has no items: nothing to point at, no focus stop.
  const itemAt = (clientX: number, clientY: number): string | null => {
    const box = svg.current?.getBoundingClientRect();
    if (!box || !box.width || !box.height || model.empty) return null;
    const along = horizontal
      ? ((clientY - box.y) * layout.height) / box.height - layout.margin.top
      : ((clientX - box.x) * layout.width) / box.width - layout.margin.left;
    const index = categoryAt(centres, along, categoryLength);
    return index < 0 ? null : rows[index]!.id;
  };
  const interaction = useChartInteraction({
    axis: horizontal ? "y" : "x",
    itemAt,
    keys: model.empty ? [] : rows.map((row) => row.id),
  });
  const activeIndex = rows.findIndex((row) => row.id === interaction.activeKey);
  const active = activeIndex >= 0 ? rows[activeIndex] : undefined;

  // The bars outside the active category step back, and so do the bars of every
  // series but the focused one while the mouse is on an entry of the legend; a
  // bar steps back when either rule says so.
  const dimClassName = useChartDimClassName("mark");

  // The crosshair and the dots wait where they last were while they fade out. A
  // dot sits at the end of its bar, so it waits for the bars to stop gliding.
  const lastKey = useLastValue(interaction.activeKey);
  const shownKey = rows.find((row) => row.id === lastKey)?.id ?? rows[0]?.id;
  const gliding =
    moving.size > 0 ||
    entries.some(
      (entry) => entry.leaving || entry.value !== entry.row.slot.value,
    );

  // The pill sits on the axis at the active category, and the labels it would
  // cover fade out until it has passed.
  const spot =
    xAxis && !model.empty && active
      ? { position: centres[activeIndex]!, text: formatText(active.x) }
      : null;
  const covered = useCoveredLabels(
    categoryTicks,
    spot,
    horizontal ? "left" : "bottom",
  );

  // The card sits beside the category: to the right of the crosshair of a column
  // chart, at the top of the plot, and to the right of the longest bar of a
  // horizontal chart, at the middle of its category.
  const anchorFor = (key: string) => {
    const slot = categoryBand(categoryScale, key);
    const box = svg.current?.getBoundingClientRect();
    if (!slot || !box || !box.width) return null;
    const scale = box.width / layout.width;
    const own = bars.filter((bar) => bar.x === key);
    const middle = slot.start + slot.size / 2;
    return horizontal
      ? {
          x:
            box.x +
            (layout.margin.left +
              Math.max(at(0), ...own.map((bar) => bar.x0 + bar.width))) *
              scale,
          y: box.y + (layout.margin.top + middle) * scale,
        }
      : {
          x: box.x + (layout.margin.left + middle) * scale,
          y: box.y + layout.margin.top * scale,
        };
  };
  const heading = active ? formatHeading(active.x) : undefined;
  const tooltipRows = active
    ? series.flatMap((item, order) => {
        const value = model.values[order]![activeIndex];
        return value === null || value === undefined
          ? []
          : [
              {
                color:
                  value < 0 && item.negativeColor
                    ? item.negativeColor
                    : colors[order]!,
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

  // The colour each bar is drawn in, and the hatched fill of each colour that
  // a bar of the highlighted category takes: one pattern per colour.
  const colorOf = (bar: (typeof bars)[number], row: BarRow) =>
    bar.value < 0 && row.negativeColor ? row.negativeColor : row.color;
  const hatchId = React.useId();
  const hatches = new Map<string, string>();
  bars.forEach((bar, index) => {
    const color = colorOf(bar, entries[index]!.row);
    if (highlighted.has(bar.x) && !hatches.has(color))
      hatches.set(color, `${hatchId}-hatch-${hatches.size}`);
  });

  // The value labels at the ends of the bars that stay, every k-th category's
  // when they do not all fit. They wait while the bars glide, as the dots do,
  // and fade in where the bars have come to rest.
  const shownLabels =
    valueLabels && !model.empty
      ? visibleValueLabels(
          barValueLabels(
            bars.filter((_, index) => !entries[index]!.leaving),
            { format: formatNumber, orientation, stacked },
          ),
          orientation,
        )
      : [];

  return (
    <ChartTooltip
      align={horizontal ? "center" : "start"}
      anchorFor={anchorFor}
      announcement={active ? chartTooltipText(heading, tooltipRows) : undefined}
      className={plotClassName}
      content={content}
      describedBy={describedBy}
      description={description}
      interaction={interaction}
      keyboardHint={words.keyboardHint}
      label={label}
      roleDescription={words.roleDescription}
    >
      {/* The plot is as tall as the chart and as wide as its box, which the
          chart kept at that size before it was drawn. It is a picture that
          the focus stop describes, so it is hidden from assistive
          technology. */}
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
        {hatches.size > 0 && (
          <defs>
            {[...hatches].map(([color, id]) => (
              <pattern
                height={hatchPitch}
                id={id}
                key={id}
                patternTransform="rotate(45)"
                patternUnits="userSpaceOnUse"
                width={hatchPitch}
              >
                <rect
                  fill={`color-mix(in oklab, ${color} ${hatchTint}%, transparent)`}
                  height={hatchPitch}
                  width={hatchPitch}
                />
                {/* Drawn over the whole tint rather than beside it, so the
                    edges of a stripe leave no seam where two shapes meet. */}
                <rect
                  fill={`color-mix(in oklab, ${color} ${hatchStripeStrength}%, transparent)`}
                  height={hatchPitch}
                  width={hatchStripe}
                />
              </pattern>
            ))}
          </defs>
        )}
        <g transform={`translate(${layout.margin.left} ${layout.margin.top})`}>
          {grid && !model.empty && (
            <ChartGrid
              direction={horizontal ? "vertical" : "horizontal"}
              layout={layout}
              positions={valueMarks.map((tick) => tick.position)}
              presences={valueMarks.map((tick) => tick.presence)}
            />
          )}
          {yAxis && !model.empty && (
            <ChartValueAxis
              layout={layout}
              side={horizontal ? "bottom" : "left"}
              ticks={valueMarks}
            />
          )}
          {xAxis && !model.empty && (
            <ChartCategoryAxis
              fading={covered.fading}
              labels={covered.labels}
              layout={layout}
              side={horizontal ? "left" : "bottom"}
              thin={false}
            />
          )}
          {/* The hairline is drawn before the bars, so a bar covers it: only
                what lies between the end of the bar and the edge of the plot
                shows. The dots stay above the bars. */}
          {!model.empty && (
            <ChartCrosshair
              container={root}
              direction={horizontal ? "horizontal" : "vertical"}
              layout={layout}
              position={active ? centres[activeIndex]! : null}
            />
          )}
          {!model.empty &&
            bars.map((bar, index) => {
              const row = entries[index]!.row;
              const color = colorOf(bar, row);
              const hatch = highlighted.has(bar.x)
                ? hatches.get(color)
                : undefined;
              return (
                <path
                  d={barPath(bar, orientation)}
                  data-highlighted={hatch ? "" : undefined}
                  data-slot="chart-bar"
                  fill={hatch ? `url(#${hatch})` : color}
                  className={cn("sp-chart-bar", dimClassName)}
                  key={bar.key}
                  opacity={chartDimOpacity(
                    "bar",
                    (active !== undefined && bar.x !== active.id) ||
                      seriesSteppedBack(focusedKey, bar.series),
                  )}
                />
              );
            })}
          {shownLabels.length > 0 && (
            <g
              aria-hidden="true"
              className={cn(
                "sp-chart-value-labels",
                chartAxisLabelClassName,
                gliding
                  ? "opacity-0"
                  : "transition-opacity duration-(--motion-duration-micro) ease-(--motion-ease-state)",
              )}
              data-slot="chart-value-labels"
            >
              {shownLabels.map((item) => (
                <text
                  className={
                    highlighted.has(item.category)
                      ? chartHighlightedTextClassName
                      : undefined
                  }
                  dy={
                    item.side === "below"
                      ? "0.71em"
                      : item.side === "above"
                        ? undefined
                        : "0.32em"
                  }
                  key={item.key}
                  textAnchor={
                    item.side === "after"
                      ? "start"
                      : item.side === "before"
                        ? "end"
                        : "middle"
                  }
                  x={item.x}
                  y={item.y}
                >
                  {item.text}
                </text>
              ))}
            </g>
          )}
          {!model.empty &&
            !horizontal &&
            bars.map((bar, index) => {
              const row = entries[index]!.row;
              return bar.x === shownKey ? (
                <ChartActiveDot
                  color={
                    bar.value < 0 && row.negativeColor
                      ? row.negativeColor
                      : row.color
                  }
                  container={root}
                  cx={hundredths(bar.x0 + bar.width / 2)}
                  cy={bar.value < 0 ? bar.y0 + bar.height : bar.y0}
                  // A dot is a series': it glides on to the next category.
                  key={bar.series}
                  visible={active !== undefined && !gliding}
                />
              ) : null;
            })}
        </g>
        {model.empty && <ChartEmptyState label={emptyLabel} layout={layout} />}
      </svg>
      <ChartAxisPill
        container={root}
        layout={layout}
        side={horizontal ? "left" : "bottom"}
        spot={spot}
      />
    </ChartTooltip>
  );
}
