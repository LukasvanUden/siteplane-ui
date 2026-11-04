"use client";

import * as React from "react";

import {
  useFormatLocale,
  useSiteplaneMessages,
} from "../../system/locale/messages-context";
import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { ChartEmptyState } from "../chart/chart-cartesian";
import {
  CHART_DEFAULT_LOCALE,
  chartFigureFormatter,
  chartLabels,
  chartNumberFormatter,
} from "../chart/chart-format";
import { useChartInteraction } from "../chart/chart-interaction";
import { ChartLegend } from "../chart/chart-legend";
import { chartEmptyColor, chartPaletteColors } from "../chart/chart-palette";
import { chartCirclePath, ringCenterFit } from "../chart/chart-ring";
import { ChartTooltip, chartTooltipText } from "../chart/chart-tooltip";
import type { ChartLabels, ChartPalette } from "../chart/chart-types";
import { MotionNumber, useTweenedRows } from "../motion";
import {
  RADIAL_BAR_CHART_SIZES,
  RADIAL_LARGE_CAPTION_HOLE,
  barAnchor,
  barDash,
  radialCenterLine,
  radialCenterSteps,
  radialLayout,
  radialShare,
  ringAtPoint,
  type RadialBarChartSize,
  type RadialCenterStep,
} from "./radial-geometry";

export type { RadialBarChartSize } from "./radial-geometry";

export type RadialBarChartDatum = {
  id: string;
  label: string;
  /** The value of the bar, drawn as its share of the chart's `max`. */
  value: number;
  /** A CSS colour or token. The chart's `palette` gives one for its place when omitted. */
  color?: string;
};

export type RadialBarChartProps = {
  /**
   * The bars, one ring each, from the outer ring inwards: the first bar is the
   * outer ring and takes the first colour of the palette.
   */
  data: readonly RadialBarChartDatum[];
  /** The accessible name of the chart. */
  label: string;
  /**
   * The id of an element that describes the chart, read after what the chart
   * gives assistive technology itself.
   */
  "aria-describedby"?: string;
  /**
   * The value of a full ring: every bar is drawn as its share of it, from 12
   * o'clock clockwise. A value beyond it fills the ring, and one below 0 leaves
   * it empty; the tooltip names the value itself. 100 by default.
   */
  max?: number;
  /**
   * The diameter of the outer ring, a size name (`xs` 176 px, `sm` 220 px, `md`
   * 264 px, `lg` 308 px) or a number of px. The default is `sm`.
   */
  size?: number | RadialBarChartSize;
  /**
   * `brand` (the default) shades the brand colour from strong to light, spread
   * over the number of bars (up to eight), the outer ring strongest;
   * `categorical` gives each bar its own chart colour, `--chart-1` to
   * `--chart-8` in order. Both start over from the ninth bar. A bar that names
   * its `color` keeps it.
   */
  palette?: ChartPalette;
  /** Writes a value in the tooltip and in what screen readers read for each bar. A number in the format of `locale` by default. */
  formatValue?: (value: number) => string;
  /** The locale of the numbers: the SiteplaneLocaleProvider's unless set, en-US without one. */
  locale?: string;
  /** Shown in the hole when there is no bar to draw. */
  emptyLabel?: string;
  /**
   * Replaces words that the chart gives screen readers, merged with the
   * English defaults: its role description and the keyboard hint.
   */
  labels?: Partial<ChartLabels> | undefined;
  /**
   * Content of your own in the hole, in place of `centerValue` and
   * `centerLabel`. It is laid out in the square around the hole and cut off at
   * the hole's edge, so it never covers a ring. It lies over the chart without
   * taking the pointer and is not part of the chart's accessible name.
   */
  center?: React.ReactNode;
  /**
   * A figure in the hole, such as a share or a total, which the chart fits into
   * the hole: in the largest text step the hole offers, from 48 px for a hole
   * of 240 px down to 20 px for one of 96 px, or a smaller step it fits in, and
   * in compact notation, such as 1.2M, when it does not fit in full. Screen
   * readers read it in full. It rolls to a new value.
   */
  centerValue?: number;
  /** A caption above `centerValue`, such as Active users: one line of muted text, 14 px in a hole of 150 px or more and 12 px in a smaller one, that ends in an ellipsis when the hole is too narrow for it. */
  centerLabel?: string;
  /** How `centerValue` is written, as Intl.NumberFormat options in `locale`, such as a percentage. The chart adds compact notation when the figure needs it. */
  centerFormat?: Intl.NumberFormatOptions;
  /**
   * Lists the bars below the rings, each with its colour. On when there is more
   * than one bar. Without it screen readers still read each bar and its value,
   * as the description of the chart.
   */
  legend?: boolean;
  /**
   * Rolls the value in the tooltip to the next bar's, digit by digit
   * (MotionNumber), as the other charts' `rollingNumbers` does. Off by
   * default: it changes at once. `centerValue` rolls either way.
   */
  rollingNumbers?: boolean;
  className?: string;
};

// The text classes of the steps of a figure in the hole, written whole for
// Tailwind: the size of each step on the height of its line.
const figureStepClassName: Record<RadialCenterStep, string> = {
  12: "text-xs leading-4.5",
  14: "text-sm leading-5",
  16: "text-base leading-6",
  20: "text-xl leading-7.5",
  24: "text-2xl leading-8",
  30: "text-3xl leading-9.5",
  36: "text-4xl leading-11",
  48: "text-5xl leading-15",
};

// The figure keeps all its digits in the three largest steps its hole offers;
// below them it is written compact first, as in the Pie Chart.
const fullSteps = 3;

/**
 * A figure in the hole, with an optional caption above it: in the largest step
 * the hole offers that it fits in, in full or in compact notation, which the
 * chart picks from its size and the text alone (`ringCenterFit`), so that the
 * server and the client agree. A compact figure is read in full. The caption
 * stays on one line and ends in an ellipsis where the hole narrows (rulebook
 * K5).
 */
function RadialCenterFigure({
  caption,
  format,
  holeRadius,
  locale,
  value,
}: {
  caption: string | undefined;
  format: Intl.NumberFormatOptions | undefined;
  holeRadius: number;
  locale: string;
  value: number;
}): React.ReactElement {
  const full = chartFigureFormatter(locale, format)(value);
  const short = chartFigureFormatter(locale, format, true)(value);
  const largeCaption = holeRadius * 2 >= RADIAL_LARGE_CAPTION_HOLE;
  const fit = ringCenterFit({
    caption,
    captionHeight: largeCaption ? 20 : 18,
    compact: short,
    figureHeight: radialCenterLine,
    full,
    fullSteps,
    holeRadius,
    steps: radialCenterSteps(holeRadius * 2),
  });
  const text = fit.compact ? short : full;
  return (
    <>
      {caption ? (
        <span
          className={cn(
            slotClass("radial-bar-chart-center-label"),
            "truncate text-muted-foreground",
            largeCaption ? "text-sm leading-5" : "text-xs leading-4.5",
          )}
          data-slot="radial-bar-chart-center-label"
          style={{ maxWidth: `${fit.captionWidth}%` }}
          title={caption}
        >
          {caption}
        </span>
      ) : null}
      <span
        className={cn(
          slotClass("radial-bar-chart-center-value"),
          "max-w-full font-(--sp-rw-font-weight-strong) tabular-nums",
          figureStepClassName[fit.size as RadialCenterStep],
        )}
        data-compact={fit.compact ? "" : undefined}
        data-size={fit.size}
        data-slot="radial-bar-chart-center-value"
      >
        {text === full ? (
          <MotionNumber value={text} />
        ) : (
          <>
            <span className="sr-only">{full}</span>
            <MotionNumber aria-hidden="true" value={text} />
          </>
        )}
      </span>
    </>
  );
}

// A bar as the chart keeps it: its own value and the colour it keeps even
// while it shrinks away after it has left the data.
type RadialRow = RadialBarChartDatum & { color: string };

/**
 * Bars that each fill a ring of their own by their share of `max`, from 12
 * o'clock clockwise, concentric from the outer ring inwards over a neutral
 * track, with round ends: one bar for a progress circle, several for an
 * activity gauge. The hole takes a figure with a caption above it, a legend
 * below lists the bars, and a tooltip trails beside the bar under the pointer;
 * the chart is one focus stop whose arrow keys step from ring to ring. No bar
 * fades while another is active: the bars are shades of one hue. New data
 * glides in: a bar is told by its id, grows from nothing, glides to a new value
 * and shrinks away in its ring when it leaves.
 */
export function RadialBarChart({
  data,
  label,
  "aria-describedby": describedBy,
  max = 100,
  size: sizeProp = "sm",
  palette = "brand",
  formatValue: givenFormat,
  locale: localeProp,
  emptyLabel: emptyLabelProp,
  labels,
  center,
  centerValue,
  centerLabel,
  centerFormat,
  legend = data.length > 1,
  rollingNumbers = false,
  className,
}: RadialBarChartProps): React.ReactElement {
  const messages = useSiteplaneMessages("chart");
  const emptyLabel = emptyLabelProp ?? messages.noData;
  // The chart's own locale, else the provider's, else en-US.
  const locale = useFormatLocale(localeProp, CHART_DEFAULT_LOCALE);
  const chart = React.useRef<SVGSVGElement>(null);
  const size = Math.max(
    0,
    typeof sizeProp === "number" ? sizeProp : RADIAL_BAR_CHART_SIZES[sizeProp],
  );
  const words = chartLabels(labels, messages);
  // Numbers as the other charts write them: in the format of the locale.
  const formatValue = givenFormat ?? chartNumberFormatter(locale);
  const full = Number.isFinite(max) && max > 0 ? max : 100;
  const colors = chartPaletteColors(palette, data.length);
  const rows: RadialRow[] = data.map((item, index) => ({
    ...item,
    color: item.color ?? colors[index]!,
    value: Number.isFinite(item.value) ? item.value : 0,
  }));
  // The bars as they are drawn now, as shares of a full ring: when the data
  // changes each bar glides to its new share, a new bar grows from nothing and
  // a bar that is gone shrinks away in its ring before the rings close up. At
  // rest this is the data itself.
  const bars = useTweenedRows(rows, (row) => radialShare(row.value, full), {
    container: chart,
  });
  const empty = rows.length === 0;
  // Every bar has a ring while it is drawn, one that is leaving included; a
  // chart with no bars keeps one empty ring.
  const layout = radialLayout(size, Math.max(1, bars.length));
  const middle = size / 2;

  // The bar under a point, from its distance to the centre. One lookup for the
  // whole chart keeps the active bar steady while the pointer crosses from one
  // ring to the next.
  const barAt = (clientX: number, clientY: number): string | null => {
    const box = chart.current?.getBoundingClientRect();
    if (!box || !box.width || empty) return null;
    const scale = size / box.width;
    const ring = ringAtPoint(
      layout,
      (clientX - box.x - box.width / 2) * scale,
      (clientY - box.y - box.height / 2) * scale,
    );
    const bar = bars[ring];
    return bar && !bar.leaving ? bar.key : null;
  };
  // The chart core keeps the active bar, the pointer, the tap that pins, the
  // arrow keys and the tooltip; the rings only say which bar is under a point.
  const interaction = useChartInteraction({
    itemAt: barAt,
    keys: rows.map((row) => row.id),
  });
  const selected =
    interaction.activeKey === null
      ? undefined
      : rows.find((row) => row.id === interaction.activeKey);
  // The card sits beside the middle of the bar, on its ring.
  const anchorFor = (key: string) => {
    const index = bars.findIndex((bar) => bar.key === key);
    const ring = layout.rings[index];
    const box = chart.current?.getBoundingClientRect();
    if (index < 0 || !ring || !box) return null;
    const point = barAnchor(bars[index]!.value, ring, size);
    return {
      x: box.x + box.width * point.x,
      y: box.y + box.height * point.y,
    };
  };
  // What the chart says about its bars to assistive technology when it takes
  // focus: its empty label when there is none, and without a legend each bar
  // and its value, which the legend reads out otherwise.
  const showLegend = legend && !empty;
  const description = empty
    ? emptyLabel
    : showLegend
      ? undefined
      : // A full stop ends it, so that the keyboard hint after it is heard
        // as a sentence of its own.
        `${rows.map((row) => `${row.label}: ${formatValue(row.value)}`).join("; ")}.`;
  const hasFigure = centerValue !== undefined && Number.isFinite(centerValue);
  // The hole, as a share of the box from each edge: the square around it.
  const holeInset = size > 0 ? (0.5 - layout.holeRadius / size) * 100 : 50;
  return (
    // The figure holds the rings and the legend. The focus stop inside is the
    // chart for assistive technology, named by the label alone.
    <figure
      className={cn(
        "sp-radial-bar-chart",
        "flex max-w-full flex-col items-center",
        className,
      )}
      data-slot="radial-bar-chart"
    >
      <ChartTooltip
        // The rings fill their box, so the card has room beside a bar only
        // outside the chart: it stays inside the window instead.
        align="center"
        anchorFor={anchorFor}
        announcement={
          selected
            ? chartTooltipText(undefined, [
                { label: selected.label, value: formatValue(selected.value) },
              ])
            : undefined
        }
        boundary="viewport"
        className="relative max-w-full rounded-full"
        content={
          selected && (
            <>
              <strong className="tabular-nums">
                {rollingNumbers ? (
                  <MotionNumber value={formatValue(selected.value)} />
                ) : (
                  formatValue(selected.value)
                )}
              </strong>
              <div>{selected.label}</div>
            </>
          )
        }
        describedBy={describedBy}
        description={description}
        interaction={interaction}
        keyboardHint={words.keyboardHint}
        label={label}
        roleDescription={words.roleDescription}
        style={{ height: size, width: size }}
      >
        {/* The rings are a picture that the focus stop describes, so they are
            hidden from assistive technology. No SVG titles: the browser would
            show its own tooltip next to the chart's. Each ring is first its
            track, the whole circle in the neutral of an empty share, and then
            its bar over it. */}
        <svg
          aria-hidden="true"
          className="size-full"
          ref={chart}
          viewBox={`0 0 ${size} ${size}`}
        >
          {layout.rings.map((ring, index) => (
            <circle
              className="sp-radial-bar-chart-track"
              cx={middle}
              cy={middle}
              data-slot="radial-bar-chart-track"
              fill="none"
              key={`track-${index}`}
              r={ring.radius}
              stroke={chartEmptyColor}
              strokeWidth={ring.width}
            />
          ))}
          {bars.map((bar, index) => {
            const ring = layout.rings[index];
            const dash = ring ? barDash(bar.value, ring) : null;
            return ring && dash ? (
              <path
                className="sp-radial-bar-chart-bar"
                d={chartCirclePath(middle, middle, ring.radius)}
                data-active={interaction.activeKey === bar.key ? "" : undefined}
                data-slot="radial-bar-chart-bar"
                fill="none"
                key={bar.key}
                pathLength="100"
                stroke={bar.row.color}
                strokeDasharray={dash.dasharray}
                strokeDashoffset={dash.dashoffset}
                strokeLinecap="round"
                strokeWidth={ring.width}
              />
            ) : null;
          })}
        </svg>
        {/* The empty label is the charts' own empty state, in HTML over the
            rings, so that it keeps its 14 px at any size of the chart. */}
        {empty && <ChartEmptyState label={emptyLabel} />}
        {/* The centre is HTML over the rings, in the square around the hole,
            cut off at its round edge, so that nothing in it covers a ring. It
            sits inside the focus stop, whose name is the label alone, and
            never takes the pointer, so the lookup sees every point. */}
        {!empty && (center != null || hasFigure) && (
          <div
            className="sp-radial-bar-chart-center pointer-events-none absolute flex flex-col items-center justify-center overflow-hidden rounded-full text-center"
            data-slot="radial-bar-chart-center"
            style={{ inset: `${holeInset}%` }}
          >
            {center ?? (
              <RadialCenterFigure
                caption={centerLabel}
                format={centerFormat}
                holeRadius={layout.holeRadius}
                locale={locale}
                value={centerValue!}
              />
            )}
          </div>
        )}
      </ChartTooltip>
      {showLegend && (
        <ChartLegend
          className="pt-3"
          fade={false}
          items={rows.map((row) => ({
            color: row.color,
            key: row.id,
            label: row.label,
            value: formatValue(row.value),
          }))}
          layout="row"
        />
      )}
    </figure>
  );
}
