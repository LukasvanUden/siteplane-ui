"use client";
import * as React from "react";
import { cn } from "../../system/utils/cn";
import { ChartEmptyState } from "../chart/chart-cartesian";
import {
  CHART_DEFAULT_LOCALE,
  chartLabels,
  chartNumberFormatter,
} from "../chart/chart-format";
import { useChartInteraction } from "../chart/chart-interaction";
import { ChartLegend, useChartSeriesFocus } from "../chart/chart-legend";
import { chartEmptyColor, chartRingColors } from "../chart/chart-palette";
import { ChartTooltip, chartTooltipText } from "../chart/chart-tooltip";
import type { ChartLabels, ChartPalette } from "../chart/chart-types";
import {
  MotionNumber,
  followed,
  useFollowPoint,
  useTweenedRows,
} from "../motion";
import {
  DONUT_INNER_RADIUS,
  PIE_BOX,
  popDistance,
  popOffset,
  ringOf,
  ringPath,
  shareAnchor,
  shareAtPoint,
  wedgePath,
  type PieArc,
} from "./pie-geometry";
// A gap in the ring smaller than this, in percent of the circle, is the
// rounding of shares that fill it: no track is drawn for it.
const trackMinimum = 0.001;

export type PieChartDatum = {
  id: string;
  label: string;
  value: number;
  color?: string;
  /**
   * An unfilled share, such as unused capacity. It takes the neutral empty
   * colour instead of a series colour.
   */
  empty?: boolean;
};
export type PieChartProps = {
  data: readonly PieChartDatum[];
  label: string;
  /**
   * The id of an element that describes the chart, read after what the chart
   * gives assistive technology itself.
   */
  "aria-describedby"?: string;
  /**
   * `brand` (the default) shades the brand colour from strong to light, spread
   * over the number of shares, for parts of one whole. `categorical` gives each
   * share its own chart colour, `--chart-1` to `--chart-5` in order. A share
   * that names its `color` keeps it, and an `empty` share is always neutral.
   * The last share never takes the color of the first, where the ring closes.
   */
  palette?: ChartPalette;
  size?: number;
  className?: string;
  /** Writes a value in the tooltip and in what screen readers read for each share. A number in the format of `locale` by default. */
  formatValue?: (value: number) => string;
  /** The locale of the numbers. */
  locale?: string;
  emptyLabel?: string;
  /**
   * Replaces words that the chart gives screen readers, merged with the
   * English defaults: its role description and the keyboard hint.
   */
  labels?: Partial<ChartLabels> | undefined;
  /**
   * `donut` draws the shares as a ring. `pie` fills the whole disc with a wedge
   * per share, so it has no hole.
   */
  variant?: "donut" | "pie";
  /**
   * Content in the hole of the donut, such as a total with a caption. A pie has
   * no hole and shows none, and a chart with nothing to draw shows `emptyLabel`
   * in its place. It lies over the ring without taking the pointer and is not
   * part of the chart's accessible name.
   */
  center?: React.ReactNode;
  /**
   * Lists the shares beside the ring, each with its colour. Without it screen
   * readers still read each share and its value, as the description of the
   * chart.
   */
  legend?: boolean;
  /**
   * Lets the highlighted share step out of the ring, 10 px along its middle
   * angle at any size, and lets a mouse over an entry of the legend highlight
   * its share as well. Off by default: no share ever moves, and the legend does
   * not react to the mouse. No share fades either way. A share that steps out
   * reaches up to 10 px beyond the box of the chart.
   */
  popOut?: boolean;
};
/**
 * One share of the ring, or one wedge of the pie. While it is the highlighted
 * share it steps out along its middle angle, and it goes back in when it is not;
 * a chart that does not pop out gives it no distance to step, so it stays. It
 * moves with the follow motion, which owns the glide, its token and reduced
 * motion (rulebook M5): the translate is a pair of motion values bound to the
 * path, so only the path moves, and the chart does not render again. No share
 * fades: the shares are shades of one hue, and a faded share took the colour of
 * another one.
 */
function PieSegment({
  arc,
  color,
  container,
  highlighted,
  pie,
  popUnits,
  ring,
}: {
  arc: PieArc;
  color: string;
  /** The element whose motion tokens set the glide: the chart. */
  container: React.RefObject<Element | null>;
  /** This share is the highlighted one. */
  highlighted: boolean;
  /** A wedge of a pie, not a share of the ring. */
  pie: boolean;
  /** How far the highlighted share steps out, in the units of the box. */
  popUnits: number;
  ring: { radius: number; width: number };
}): React.ReactElement | null {
  const out = useFollowPoint(
    highlighted ? popOffset(arc.start, arc.value, popUnits) : { x: 0, y: 0 },
    { container },
  );
  if (pie)
    // A wedge is a path of its own, so that neighbours meet along exact edges;
    // dashes of a stroke as wide as the disc would meet a little off.
    return arc.value > 0 ? (
      <followed.path
        d={wedgePath(arc.start, arc.value)}
        fill={color}
        data-active={highlighted ? "" : undefined}
        style={{ x: out.x, y: out.y }}
      />
    ) : null;
  // The share is a dash along the open path of the ring.
  return (
    <followed.path
      d={ringPath(ring.radius)}
      fill="none"
      stroke={color}
      strokeWidth={ring.width}
      pathLength="100"
      strokeDasharray={`${arc.value} ${100 - arc.value}`}
      strokeDashoffset={-arc.start}
      data-active={highlighted ? "" : undefined}
      style={{ x: out.x, y: out.y }}
    />
  );
}

export function PieChart({
  data,
  label,
  "aria-describedby": describedBy,
  palette = "brand",
  size = 200,
  className,
  formatValue: givenFormat,
  locale = CHART_DEFAULT_LOCALE,
  emptyLabel = "No data",
  labels,
  variant = "donut",
  center,
  legend = true,
  popOut = false,
}: PieChartProps): React.ReactElement {
  const chart = React.useRef<SVGSVGElement>(null);
  const words = chartLabels(labels);
  // Numbers as the other charts write them: in the format of the locale.
  const formatValue = givenFormat ?? chartNumberFormatter(locale);
  const pie = variant === "pie";
  // A pie is a ring with no hole: it reaches in to the centre.
  const innerRadius = pie ? 0 : DONUT_INNER_RADIUS;
  const ring = ringOf(innerRadius);
  // The palette is spread over the shares that are filled: an empty share is
  // neutral and takes no place in it. The last share and the first meet where
  // the ring closes, so they never share a colour.
  const colors = chartRingColors(
    palette,
    data.filter((item) => !item.empty).length,
  );
  let series = 0;
  const rows = data.map((item) => {
    const index = item.empty ? -1 : series++;
    return {
      ...item,
      value: Number.isFinite(item.value) ? Math.max(0, item.value) : 0,
      color: item.color ?? (item.empty ? chartEmptyColor : colors[index]!),
    };
  });
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  // The ring as it is drawn now, in percent of the circle: when the data
  // changes, each share glides to its new size and place, a new share grows
  // from nothing and a share that is gone shrinks away. At rest this is the
  // data itself.
  const arcs = useTweenedRows(
    rows,
    (row) => (total > 0 ? (row.value / total) * 100 : 0),
    { container: chart },
  );
  let offset = 0;
  const drawn = arcs.map((arc) => {
    const start = offset;
    offset += arc.value;
    return { ...arc, start };
  });
  // The part of the circle that no share fills, which the track shows: all of
  // it in a chart with nothing in it, the gap while shares grow from nothing or
  // shrink to it, and none at rest, where the shares fill the circle.
  const filled = Math.min(100, Math.max(0, offset));
  const unfilled = 100 - filled;
  // The share under a point, from its angle within the ring or the disc. One
  // lookup for the whole chart keeps the active share steady while the pointer
  // crosses from one share to the next.
  const segmentAt = (clientX: number, clientY: number): string | null => {
    const box = chart.current?.getBoundingClientRect();
    if (!box || !box.width || total <= 0) return null;
    const scale = PIE_BOX / box.width;
    return shareAtPoint(
      drawn,
      (clientX - box.x - box.width / 2) * scale,
      (clientY - box.y - box.height / 2) * scale,
      innerRadius,
    );
  };
  // The chart core keeps the active share, the pointer, the tap that pins, the
  // arrow keys and the tooltip; the ring only says which share is under a point.
  // A ring with nothing in it has no share to show: no tooltip, no focus stop.
  const interaction = useChartInteraction({
    keys: total > 0 ? rows.map((row) => row.id) : [],
    itemAt: segmentAt,
    wrap: true,
  });
  const selected =
    interaction.activeKey === null
      ? undefined
      : rows.find((row) => row.id === interaction.activeKey);
  // The share whose entry the mouse is over in the legend. The chart owns it,
  // as it owns the active share: one state, handed to the legend and the ring.
  // The legend sets it only in a chart that pops out, where it has something to
  // show.
  const focus = useChartSeriesFocus(rows.map((row) => row.id));
  // One share is highlighted, which steps out with `popOut`: the share under
  // the pointer, the one a tap or the keyboard has made active, or, in a chart
  // that pops out, the one whose entry the mouse is over in the legend. The
  // mouse on the legend wins, and the tooltip stays with the plot's own share.
  // Nothing fades in a Pie Chart.
  const highlightedKey =
    (popOut ? focus.focusedKey : null) ?? interaction.activeKey;
  // How far the highlighted share steps out, in the units of the box: none
  // unless the chart pops out, so nothing moves, whatever highlights a share.
  const popUnits = popOut ? popDistance(size) : 0;
  // The card sits beside the middle of the share, where it stands: stepped out
  // while it is the highlighted one and the chart pops out.
  const anchorFor = (key: string) => {
    const arc = drawn.find((item) => item.key === key);
    const box = chart.current?.getBoundingClientRect();
    if (!arc || total <= 0 || !box) return null;
    const point = shareAnchor(
      arc.start,
      arc.value,
      innerRadius,
      key === highlightedKey
        ? popOffset(arc.start, arc.value, popUnits)
        : undefined,
    );
    return {
      x: box.x + box.width * point.x,
      y: box.y + box.height * point.y,
    };
  };
  // What the chart says about its shares to assistive technology when it takes
  // focus: its empty label when there is nothing in the ring, and without a
  // legend each share and its value, which the legend reads out otherwise.
  const description =
    total <= 0
      ? emptyLabel
      : legend
        ? undefined
        : // A full stop ends it, so that the keyboard hint after it is heard
          // as a sentence of its own.
          `${rows.map((row) => `${row.label}: ${formatValue(row.value)}`).join("; ")}.`;
  return (
    // The figure holds the ring and the legend. The focus stop inside is the
    // chart for assistive technology, named by the label alone.
    <figure
      data-slot="pie-chart"
      className={cn(
        // A legend without rows keeps no gap beside the ring (rulebook S11).
        // It stays mounted, so its rows still enter and leave with motion.
        "sp-pie-chart",
        "flex max-w-full flex-wrap items-start justify-center gap-5 [&:not(:has([data-slot=chart-legend]_li))]:gap-0",
        className,
      )}
    >
      <ChartTooltip
        // The ring fills its box, so the card has room beside a share only
        // outside the chart: it stays inside the window instead.
        align="center"
        boundary="viewport"
        interaction={interaction}
        label={label}
        anchorFor={anchorFor}
        content={
          selected && (
            <>
              <strong>
                <MotionNumber value={formatValue(selected.value)} />
              </strong>
              <div>{selected.label}</div>
            </>
          )
        }
        announcement={
          selected
            ? chartTooltipText(undefined, [
                { label: selected.label, value: formatValue(selected.value) },
              ])
            : undefined
        }
        description={description}
        describedBy={describedBy}
        keyboardHint={words.keyboardHint}
        roleDescription={words.roleDescription}
        className="relative max-w-full rounded-full"
        style={{ width: size, height: size }}
      >
        {/* The ring keeps its size at rest and the box is as tight as it was:
            a share that steps out is drawn outside it, so a chart that pops
            out must not have its SVG clip it. It is a picture that the focus
            stop describes, so it is hidden from assistive technology. */}
        <svg
          ref={chart}
          viewBox={`0 0 ${PIE_BOX} ${PIE_BOX}`}
          className={cn("size-full", popOut && "overflow-visible")}
          aria-hidden="true"
        >
          {/* No SVG titles: the browser would show its own tooltip next to
              the chart's. The label names the chart; the legend and the
              tooltip carry the values. The track is the part of the ring
              that no share fills, in the neutral of an empty share. It lies
              beside the shares, never under them, so that their edges and a
              share that steps out show the surface behind the chart. */}
          {unfilled > trackMinimum &&
            (pie ? (
              <path
                d={wedgePath(filled, unfilled)}
                className="sp-pie-chart-track"
                data-slot="pie-chart-track"
                fill={chartEmptyColor}
              />
            ) : (
              <path
                d={ringPath(ring.radius)}
                className="sp-pie-chart-track"
                data-slot="pie-chart-track"
                fill="none"
                pathLength="100"
                stroke={chartEmptyColor}
                strokeDasharray={`${unfilled} ${100 - unfilled}`}
                strokeDashoffset={-filled}
                strokeWidth={ring.width}
              />
            ))}
          {drawn.some((arc) => arc.value > 0) &&
            drawn.map((arc) => (
              <PieSegment
                arc={arc}
                color={arc.row.color}
                container={chart}
                highlighted={highlightedKey === arc.key}
                key={arc.key}
                pie={pie}
                popUnits={popUnits}
                ring={ring}
              />
            ))}
        </svg>
        {/* The empty label is the charts' own empty state, in HTML over the
            ring, so that it keeps its 14 px at any size of the chart. */}
        {total <= 0 && <ChartEmptyState label={emptyLabel} />}
        {/* The centre is HTML over the plot, in the hole, which is half the
            width of the chart. It sits inside the focus stop, whose name is
            the label alone, and never takes the pointer, so the lookup of the
            ring sees every point of the hole. A chart with nothing to draw
            shows its empty label there instead. */}
        {!pie && center != null && total > 0 && (
          <div
            data-slot="pie-chart-center"
            className="sp-pie-chart-center pointer-events-none absolute inset-1/4 flex flex-col items-center justify-center text-center"
          >
            {center}
          </div>
        )}
      </ChartTooltip>
      {legend && (
        <ChartLegend
          fade={false}
          {...(popOut ? { focus } : {})}
          items={rows.map((row) => ({
            key: row.id,
            label: row.label,
            color: row.color,
            value: formatValue(row.value),
          }))}
        />
      )}
    </figure>
  );
}
