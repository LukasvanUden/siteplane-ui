"use client";

import * as React from "react";

import {
  useFormatLocale,
  useSiteplaneMessages,
} from "../../system/locale/messages-context";
import { cn } from "../../system/utils/cn";
import { Badge } from "../badge";
import {
  CHART_LEGEND_BAND,
  ChartActiveDot,
  ChartEmptyState,
  chartAxisLabelClassName,
  useChartBox,
  useFadeClassName,
  useLastValue,
} from "../chart/chart-cartesian";
import {
  chartDimOpacity,
  seriesSteppedBack,
  useChartDimClassName,
} from "../chart/chart-dimming";
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
import { valueScale, valueTicks } from "../chart/chart-scales";
import {
  ChartPlotPlaceholder,
  ChartTooltip,
  ChartTooltipContent,
  chartTooltipText,
} from "../chart/chart-tooltip";
import type {
  CartesianChartLabels,
  ChartDatum,
  ChartPalette,
  ChartSeries,
  ChartXValue,
} from "../chart/chart-types";
import {
  followed,
  useFollowDerived,
  useFollowValue,
  useTweenedValues,
} from "../motion";
import {
  nearestTurn,
  radarAngle,
  radarLabelPlace,
  radarLayout,
  radarPoint,
  radarPolygonPath,
  radarSpokeAt,
  type RadarLayout,
} from "./radar-geometry";

export type RadarChartProps = {
  /** One row per spoke, from 12 o'clock clockwise: its name and one number per series. */
  data: readonly ChartDatum[];
  /** Key of the name of a spoke in the data. */
  x: string;
  series: readonly ChartSeries[];
  /** The accessible name of the chart. */
  label: string;
  /**
   * The id of an element that describes the chart, read after the summary of
   * its data that the chart gives assistive technology itself.
   */
  "aria-describedby"?: string;
  /** The height of the chart in px, a legend included; the width follows the container. 240 by default. */
  height?: number;
  /** Formats a value in the tooltip and on the pills of the vertical spoke. */
  formatValue?: (value: number) => string;
  /**
   * Rolls the values in the tooltip to the next spoke's, digit by digit
   * (MotionNumber). Off by default: they change at once, so a pointer that
   * moves round the chart costs the page little work.
   */
  rollingNumbers?: boolean;
  /** Formats the name of a spoke around the rim and in the tooltip heading. */
  formatX?: (value: ChartXValue) => string;
  /** The locale of the numbers: the SiteplaneLocaleProvider's unless set, en-US without one. */
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
  /** The rings of the value axis and the spokes. */
  grid?: boolean;
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

// A series is drawn as a tint of its colour, as the Area Chart's solid fill,
// with a 2 px outline, as the Line Chart's lines.
const fillOpacity = 0.18;
const outlineWidth = 2;

// The focus stop that holds the plot, and the box of the plot before it is drawn.
const plotClassName = "relative block w-full rounded-lg";

/**
 * One or several series on spokes that share one value axis from the centre
 * out: a spoke per row of the data, from 12 o'clock clockwise, the values of a
 * series joined into a tinted polygon. Rings mark the values of the axis, whose
 * figures stand on pills along the spoke at 12 o'clock; the names of the spokes
 * stand around the rim. The spoke under the pointer is marked by a crosshair
 * and a dot on each series, and the tooltip lists its values; the plot is one
 * focus stop whose arrow keys step round the spokes. A mouse over an entry of
 * the legend steps the other series back. The plot is drawn once the chart has
 * measured its width; new data glides in.
 */
export function RadarChart({
  data,
  x,
  series,
  label,
  "aria-describedby": describedBy,
  height: givenHeight,
  formatValue,
  formatX,
  locale: localeProp,
  palette = "brand",
  legend = series.length > 1,
  grid = true,
  emptyLabel: emptyLabelProp,
  labels,
  className,
  rollingNumbers = false,
}: RadarChartProps): React.ReactElement {
  const messages = useSiteplaneMessages("chart");
  const emptyLabel = emptyLabelProp ?? messages.noData;
  // The chart's own locale, else the provider's, else en-US.
  const locale = useFormatLocale(localeProp, CHART_DEFAULT_LOCALE);
  const root = React.useRef<HTMLElement>(null);
  // The chart core sizes the chart: its width follows the container.
  const box = useChartBox(root, { height: givenHeight });
  const { height, width } = box;
  const colors = seriesColors(series, palette);
  const showLegend = legend && series.length > 0;
  const focus = useChartSeriesFocus(series.map((item) => item.key));
  const words = chartLabels(labels, messages);
  // A row per spoke and the numbers of each series, read as the other charts
  // read theirs.
  const model = React.useMemo(
    () => buildCartesianModel({ data, series, stacked: false, x }),
    [data, series, x],
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
  const plotHeight = Math.max(0, height - (showLegend ? CHART_LEGEND_BAND : 0));

  return (
    // The figure holds the plot and the legend. The focus stop inside is the
    // chart for assistive technology, named by the label alone.
    <figure
      className={cn("sp-radar-chart", "flex w-full flex-col", className)}
      data-slot="radar-chart"
      ref={root}
    >
      {width === null ? (
        <ChartPlotPlaceholder
          className={plotClassName}
          description={description}
          describedBy={describedBy}
          height={plotHeight}
          label={label}
          roleDescription={words.roleDescription}
        />
      ) : (
        <RadarPlot
          colors={colors}
          describedBy={describedBy}
          description={description}
          emptyLabel={emptyLabel}
          focusedKey={focus.focusedKey}
          formatHeading={formatHeading}
          formatText={formatX ?? chartXFormatter(locale, "short")}
          formatNumber={formatNumber}
          formatValue={formatValue}
          grid={grid}
          height={plotHeight}
          label={label}
          locale={locale}
          model={model}
          rollingNumbers={rollingNumbers}
          root={root}
          series={series}
          width={width}
          words={words}
        />
      )}
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

/**
 * The hairline from the centre to the rim along the active spoke. It turns to
 * the next spoke the short way round with the follow motion, fades in and out
 * with the active spoke, and waits out of sight where it last was.
 */
function RadarCrosshair({
  angle,
  container,
  layout,
}: {
  /** The angle of the active spoke, null for none. */
  angle: number | null;
  container: React.RefObject<Element | null>;
  layout: RadarLayout;
}): React.ReactElement {
  const fade = useFadeClassName();
  const held = useLastValue(angle) ?? 0;
  // The angle it heads for, unwound so that it never turns more than half
  // round: from the last spoke to the first across 12 o'clock.
  const [turn, setTurn] = React.useState(held);
  const next = nearestTurn(turn, held);
  if (next !== turn) setTurn(next);
  const along = useFollowValue(next, { active: angle !== null, container });
  const x2 = useFollowDerived(
    along,
    (value) => radarPoint(layout, value, layout.radius)[0],
  );
  const y2 = useFollowDerived(
    along,
    (value) => radarPoint(layout, value, layout.radius)[1],
  );
  return (
    <followed.line
      aria-hidden="true"
      className={cn("sp-chart-crosshair", "stroke-border-strong", fade)}
      data-slot="chart-crosshair"
      data-visible={angle !== null ? "" : undefined}
      strokeWidth={1}
      x1={layout.cx}
      x2={x2}
      y1={layout.cy}
      y2={y2}
    />
  );
}

/**
 * The plot of a Radar Chart at its measured width: the rings and spokes, the
 * series, the names of the spokes, the pills of the value axis, the crosshair
 * and the tooltip.
 */
function RadarPlot({
  colors,
  describedBy,
  description,
  emptyLabel,
  focusedKey,
  formatHeading,
  formatNumber,
  formatText,
  formatValue,
  grid,
  height,
  label,
  locale,
  model,
  rollingNumbers,
  root,
  series,
  width,
  words,
}: {
  colors: readonly string[];
  describedBy: string | undefined;
  description: string;
  emptyLabel: string;
  focusedKey: string | null;
  formatHeading: (value: ChartXValue) => string;
  formatNumber: (value: number) => string;
  formatText: (value: ChartXValue) => string;
  formatValue: ((value: number) => string) | undefined;
  grid: boolean;
  height: number;
  label: string;
  locale: string;
  model: CartesianModel;
  rollingNumbers: boolean;
  root: React.RefObject<HTMLElement | null>;
  series: readonly ChartSeries[];
  width: number;
  words: CartesianChartLabels;
}): React.ReactElement {
  const svg = React.useRef<SVGSVGElement>(null);
  const { rows } = model;
  const count = rows.length;
  const names = rows.map((row) => formatText(row.x));
  const layout = radarLayout({ height, labels: names, width });

  // The value axis runs from the centre out to the rim: a nice domain from 0,
  // with its ticks as rings.
  const axis = valueScale(model.extent, [0, layout.radius]);
  const [, top] = axis.domain() as [number, number];
  const ticks = valueTicks(axis, layout.radius).filter((tick) => tick >= 0);
  const tickLabels = chartTickLabels(ticks, locale, formatValue);

  // New data glides in: the end of the axis and every point move to their new
  // values together, in the units of the data. A change in the number of
  // spokes or series shows at once.
  const target = [
    top,
    ...model.values.flatMap((own) =>
      own.map((value) => Math.max(0, value ?? 0)),
    ),
  ];
  const glide = useTweenedValues(target, { container: root });
  const gliding = glide !== target;
  const reach = (value: number) =>
    glide[0]! > 0 ? (Math.max(0, value) / glide[0]!) * layout.radius : 0;
  const points = series.map((_, place) =>
    rows.map((_, index) =>
      radarPoint(
        layout,
        radarAngle(index, count),
        reach(glide[1 + place * count + index] ?? 0),
      ),
    ),
  );

  // The spoke under the pointer is the one nearest to it by its angle.
  const spokeAt = (clientX: number, clientY: number): string | null => {
    const bounds = svg.current?.getBoundingClientRect();
    if (!bounds || !bounds.width || model.empty) return null;
    const scale = width / bounds.width;
    const index = radarSpokeAt(
      layout,
      count,
      (clientX - bounds.x) * scale - layout.cx,
      (clientY - bounds.y) * scale - layout.cy,
    );
    return index < 0 ? null : rows[index]!.id;
  };
  const interaction = useChartInteraction({
    itemAt: spokeAt,
    keys: model.empty ? [] : rows.map((row) => row.id),
    wrap: true,
  });
  const activeIndex = rows.findIndex((row) => row.id === interaction.activeKey);
  const active = activeIndex >= 0 ? rows[activeIndex] : undefined;
  const lastKey = useLastValue(interaction.activeKey);
  const shownIndex = Math.max(
    0,
    rows.findIndex((row) => row.id === lastKey),
  );

  // A series steps back while the mouse is on another series' legend entry.
  const dimClassName = useChartDimClassName("series");

  // The card sits beside the rim at the active spoke.
  const anchorFor = (key: string) => {
    const index = rows.findIndex((row) => row.id === key);
    const bounds = svg.current?.getBoundingClientRect();
    if (index < 0 || !bounds || !bounds.width) return null;
    const scale = bounds.width / width;
    const [px, py] = radarPoint(
      layout,
      radarAngle(index, count),
      layout.radius,
    );
    return { x: bounds.x + px * scale, y: bounds.y + py * scale };
  };
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
    <ChartTooltipContent
      heading={heading}
      rolling={rollingNumbers}
      rows={tooltipRows}
    />
  );
  const rim = rows.map((_, index) =>
    radarPoint(layout, radarAngle(index, count), layout.radius),
  );

  return (
    <ChartTooltip
      align="center"
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
      {/* The plot is a picture that the focus stop describes, so it is
          hidden from assistive technology. No SVG titles: the browser would
          show its own tooltip next to the chart's. */}
      <svg
        aria-hidden="true"
        className="block w-full overflow-visible"
        height={height}
        ref={svg}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
      >
        {grid && !model.empty && count > 0 && (
          <g
            className="sp-radar-chart-grid stroke-border"
            data-slot="radar-chart-grid"
            fill="none"
            strokeWidth={1}
          >
            {ticks
              .filter((tick) => tick > 0)
              .map((tick) => (
                <path
                  d={radarPolygonPath(
                    rows.map((_, index) =>
                      radarPoint(layout, radarAngle(index, count), reach(tick)),
                    ),
                  )}
                  key={tick}
                />
              ))}
            {rim.map(([px, py], index) => (
              <line
                key={rows[index]!.id}
                x1={layout.cx}
                x2={px}
                y1={layout.cy}
                y2={py}
              />
            ))}
          </g>
        )}
        {!model.empty &&
          series.map((item, place) => (
            <path
              className={cn("sp-chart-area", dimClassName)}
              d={radarPolygonPath(points[place]!)}
              data-slot="chart-area"
              fill={colors[place]}
              fillOpacity={fillOpacity}
              key={`area-${item.key}`}
              opacity={chartDimOpacity(
                "area",
                seriesSteppedBack(focusedKey, item.key),
              )}
            />
          ))}
        {!model.empty &&
          series.map((item, place) => (
            <path
              className={cn("sp-chart-line", dimClassName)}
              d={radarPolygonPath(points[place]!)}
              data-slot="chart-line"
              fill="none"
              key={`line-${item.key}`}
              opacity={chartDimOpacity(
                "area",
                seriesSteppedBack(focusedKey, item.key),
              )}
              stroke={colors[place]}
              strokeLinejoin="round"
              strokeWidth={outlineWidth}
            />
          ))}
        {!model.empty && count > 0 && (
          <g
            aria-hidden="true"
            className={cn("sp-chart-axis", chartAxisLabelClassName)}
            data-slot="chart-axis"
          >
            {rows.map((row, index) => {
              const place = radarLabelPlace(layout, radarAngle(index, count));
              return (
                <text
                  dy={place.dy}
                  key={row.id}
                  textAnchor={place.anchor}
                  x={place.x}
                  y={place.y}
                >
                  {names[index]}
                </text>
              );
            })}
          </g>
        )}
        {!model.empty && count > 0 && (
          <>
            <RadarCrosshair
              angle={active ? radarAngle(activeIndex, count) : null}
              container={root}
              layout={layout}
            />
            {series.map((item, place) => {
              const value = model.values[place]![shownIndex];
              if (value === null || value === undefined) return null;
              const [cx, cy] = radarPoint(
                layout,
                radarAngle(shownIndex, count),
                reach(value),
              );
              return (
                <ChartActiveDot
                  color={colors[place]!}
                  container={root}
                  cx={cx}
                  cy={cy}
                  key={item.key}
                  visible={active !== undefined && !gliding}
                />
              );
            })}
          </>
        )}
      </svg>
      {/* The values of the rings, on pills along the spoke at 12 o'clock: the
          kit's Badge, in HTML over the plot, which never takes the pointer. */}
      {!model.empty && count > 0 && (
        <div
          aria-hidden="true"
          className="sp-radar-chart-ticks pointer-events-none absolute inset-0"
          data-slot="radar-chart-ticks"
        >
          {ticks.map((tick, index) => (
            <span
              className="sp-radar-chart-tick absolute -translate-x-1/2 -translate-y-1/2"
              data-slot="radar-chart-tick"
              key={tick}
              style={{
                left: layout.cx,
                top: layout.cy - reach(tick),
              }}
            >
              <Badge shape="pill" size="sm">
                {tickLabels[index]}
              </Badge>
            </span>
          ))}
        </div>
      )}
      {model.empty && <ChartEmptyState label={emptyLabel} />}
    </ChartTooltip>
  );
}
