"use client";

import * as React from "react";

import { useReducedMotionPreference } from "../../system/motion/use-reduced-motion-preference";
import { cn } from "../../system/utils/cn";
import {
  followed,
  useFollowDerived,
  useFollowValue,
  useTweenedRows,
  type TweenOptions,
} from "../motion";
import { swapFadeClassName } from "../motion/motion-presence";
import {
  advanceGeneration,
  presenceOf,
  tickPosition,
  type ChartPresence,
  type Generation,
} from "./chart-model";
import {
  estimateLabelWidth,
  labelGap,
  labelStep,
  readableLabels,
  truncateLabel,
} from "./chart-scales";

/** The space around the plot, in px, for the labels of the axes. */
export type ChartMargins = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type CartesianLayout = {
  /** The width of the SVG. */
  width: number;
  /** The height of the SVG: the height of the chart less the space kept for the legend below it. */
  height: number;
  margin: ChartMargins;
  plotWidth: number;
  plotHeight: number;
};

// The room a chart keeps around its plot, in px.
const marginTop = 12;
const marginRight = 16;
const marginSide = 12;
// An x label sits 10 px under the plot and is 12 px tall, with room to spare.
const labelOffset = 10;
/** Where the middle of the text of an x label is, in px under the plot: what a pill that covers the label centres on. */
export const CHART_X_LABEL_CENTRE = labelOffset + 4;
const marginBottomWithLabels = 28;
// The space between the labels of an axis and the plot.
const labelInset = 8;
/** How far the right edge of a label of the left axis is from the plot, in px: where a pill that covers the label ends. */
export const CHART_Y_LABEL_INSET = labelInset;
/** The height kept below the plot for a legend of one row. */
export const CHART_LEGEND_BAND = 32;
// The share of the width that the labels at the left of the plot may take: a
// longer label is cut to fit, so that a long category name on a phone leaves
// the bars their room.
const labelColumnShare = 0.4;
// What a label at the left is narrower than its column: the inset to the plot
// and room to spare at the edge.
const labelColumnSlack = labelInset + 4;
// The widest the column of labels at the left of a chart this wide may be.
const labelColumn = (width: number) =>
  Math.max(marginSide, Math.floor(Math.max(0, width) * labelColumnShare));

/**
 * The size of the plot and the space around it. The margins follow the widths
 * of the labels as `estimateLabelWidth` reckons them, so that the server and
 * the client lay out alike. The labels at the left take at most 40 % of the
 * width, and the axes cut a longer one to the room it has
 * (`chartLabelRoom`). A legend takes its band from the height of the chart,
 * so a chart keeps its height with or without one.
 */
export function cartesianLayout({
  width,
  height,
  yLabels,
  xAxis,
  yAxis,
  legend,
}: {
  width: number;
  height: number;
  yLabels: readonly string[];
  xAxis: boolean;
  yAxis: boolean;
  legend: boolean;
}): CartesianLayout {
  const widest = yAxis
    ? Math.ceil(Math.max(0, ...yLabels.map(estimateLabelWidth)))
    : 0;
  const margin: ChartMargins = {
    top: marginTop,
    right: marginRight,
    bottom: xAxis ? marginBottomWithLabels : marginSide,
    left:
      yAxis && widest > 0
        ? Math.min(widest + labelColumnSlack, labelColumn(width))
        : marginSide,
  };
  const svgHeight = Math.max(0, height - (legend ? CHART_LEGEND_BAND : 0));
  return {
    width,
    height: svgHeight,
    margin,
    plotWidth: Math.max(0, width - margin.left - margin.right),
    plotHeight: Math.max(0, svgHeight - margin.top - margin.bottom),
  };
}

/** The layout of a chart at this size, kept while the size and the labels stay the same. */
export function useCartesianLayout(options: {
  width: number;
  height: number;
  yLabels: readonly string[];
  xAxis: boolean;
  yAxis: boolean;
  legend: boolean;
}): CartesianLayout {
  const { width, height, xAxis, yAxis, legend } = options;
  const yLabels = options.yLabels.join("\n");
  return React.useMemo(
    () =>
      cartesianLayout({
        width,
        height,
        yLabels: yLabels === "" ? [] : yLabels.split("\n"),
        xAxis,
        yAxis,
        legend,
      }),
    [width, height, yLabels, xAxis, yAxis, legend],
  );
}

/**
 * The room a label at the left of the plot has for its text, in px: the widest
 * column a chart of this width allows, less the inset to the plot. A label
 * that the column was laid out for always fits, and so does one on its way out
 * while new data narrows the column; only a label longer than the column may
 * ever be is cut.
 */
export function chartLabelRoom(layout: CartesianLayout): number {
  return Math.max(0, labelColumn(layout.width) - labelColumnSlack);
}

/**
 * A label of an axis as it is drawn: its text, cut to the room it has, and
 * where it sits. A label at the left is cut to its column and stands against
 * the plot. A label along the bottom is centred on its position as far as the
 * box of the chart allows: one at either end moves inwards until it is inside,
 * and one wider than the whole box is cut to it.
 */
export function placeAxisLabel(
  text: string,
  position: number,
  layout: CartesianLayout,
  side: "bottom" | "left",
): { text: string; x: number } {
  if (side === "left")
    return {
      text: truncateLabel(text, chartLabelRoom(layout)),
      x: -labelInset,
    };
  const shown = truncateLabel(text, layout.width);
  const half = estimateLabelWidth(shown) / 2;
  const low = half - layout.margin.left;
  const high = layout.plotWidth + layout.margin.right - half;
  return {
    text: shown,
    x: low > high ? (low + high) / 2 : Math.min(high, Math.max(low, position)),
  };
}

/**
 * The last value that was not null, so that a part that fades out keeps where
 * it was while it goes. Null until there has been a value.
 */
export function useLastValue<T>(value: T | null): T | null {
  const [last, setLast] = React.useState<T | null>(value);
  // Object.is, so that a value that is NaN is kept once and not on every render.
  if (value !== null && !Object.is(value, last)) setLast(value);
  return value ?? last;
}

/**
 * For a part that is not drawn at rest, such as a pill or a highlighted stretch:
 * whether it has ever been needed (`seen`, from the first render in which it is
 * active, for good) and whether it has been drawn for two frames since
 * (`released`). The part mounts when it is first needed, invisible, and is
 * released two frames later, so that the browser has a frame to fade it in from.
 */
export function useFirstSeen(active: boolean): {
  released: boolean;
  seen: boolean;
} {
  const [seen, setSeen] = React.useState(false);
  if (active && !seen) setSeen(true);
  const [released, setReleased] = React.useState(false);
  React.useEffect(() => {
    if (!seen || released) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setReleased(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [released, seen]);
  return { released, seen };
}

/**
 * A number that goes up whenever the signature changes. The labels of an axis
 * take it into their keys: when new data changes the axis, every label of the
 * old axis leaves and every label of the new one enters, even a label that both
 * have, because it sits in another place now. While the axis stays, a label
 * stays, and a change of width only moves it.
 */
export function useGeneration(signature: string): number {
  const [state, setState] = React.useState<Generation>({
    count: 0,
    signature,
  });
  const next = advanceGeneration(state, signature);
  if (next !== state) setState(next);
  return next.count;
}

/** A label of a category or time axis as it is drawn: where it sits, what it says and whether it fades through. */
export type GlidingLabel = {
  key: string;
  position: number;
  presence: ChartPresence | undefined;
  text: string;
  /** Set by a chart that shows a pill: the pill sits on the label. */
  covered?: boolean;
};

/**
 * The labels of a category or time axis, kept by key so that a label that comes
 * or goes fades through while the others stay: the old labels go out before the
 * new ones come in, and never are two legible on top of each other (rulebook
 * M8). Every label is replaced when the `signature` of the axis changes; none is
 * while it stays. Hand the result to `ChartCategoryAxis` with `thin` off, having
 * thinned the labels yourself, since the old and the new labels are in the list
 * at once while one set replaces the other.
 */
export function useGlidingLabels({
  container,
  labels,
  signature,
}: {
  /** The element whose motion tokens set the timing: the chart. */
  container: NonNullable<TweenOptions["container"]>;
  /** The labels the axis has for the data now, none when it draws none. */
  labels: readonly { id: string; position: number; text: string }[];
  signature: string;
}): GlidingLabel[] {
  const generation = useGeneration(signature);
  return useTweenedRows(
    labels.map((label) => ({ ...label, id: `${generation}:${label.id}` })),
    () => 1,
    { container },
  ).map((item) => ({
    key: item.key,
    position: item.row.position,
    presence: presenceOf(item),
    text: item.row.text,
  }));
}

/** A tick of a value axis as it is drawn: where it is now, what it says and whether it fades through. */
export type GlidingTick = {
  position: number;
  presence: ChartPresence | undefined;
  text: string;
  value: number;
};

/**
 * The ticks of a value axis that moves when new data stretches it. A tick is
 * kept by its value, so one that stays or comes in sits where `place` puts its
 * value now and glides with the axis, and one that goes out fades where it stood
 * (`tickPosition`). A tick that has glided out of the plot has left.
 */
export function useGlidingTicks({
  container,
  length,
  place,
  ticks,
}: {
  /** The element whose motion tokens set the timing: the chart. */
  container: NonNullable<TweenOptions["container"]>;
  /** How long the axis is, in px. */
  length: number;
  /** A value as a position along the axis now, which is moving while the axis glides. */
  place: (value: number) => number;
  /** The ticks the axis has for the data now, none when it draws none. */
  ticks: readonly { text: string; value: number }[];
}): GlidingTick[] {
  return useTweenedRows(
    ticks.map(({ text, value }) => ({
      id: String(value),
      position: place(value),
      text,
      value,
    })),
    () => 1,
    { container },
  )
    .map((tick) => ({
      position: tickPosition(tick, place),
      presence: presenceOf(tick),
      text: tick.row.text,
      value: tick.row.value,
    }))
    .filter((tick) => tick.position >= -12 && tick.position <= length + 12);
}

// Parts that come and go fade over the micro duration, and not at all for
// reduced motion (rulebook M5).
export function useFadeClassName(): string {
  const reduced = useReducedMotionPreference();
  return cn(
    "opacity-0 data-visible:opacity-100",
    !reduced &&
      "transition-opacity duration-(--motion-duration-micro) ease-(--motion-ease-standard)",
  );
}

/**
 * Labels and grid lines that replace others fade through (rulebook M8): the old
 * ones fade out within `--motion-duration-micro` and the new ones fade in during
 * the last micro duration of a swap, so that two legible labels are never on top
 * of each other. The timing is the Motion component's own, the one a Tabs panel
 * takes (`swapFadeClassName`), driven by the attributes it reads.
 */
function useFadeThrough(
  presence: ChartPresence | undefined,
  covered = false,
  fading = false,
) {
  // A part that comes in is drawn invisible first and released two frames later,
  // so that the browser has a frame to start the fade from. A part that was
  // already there never waits.
  const [released, setReleased] = React.useState(presence !== "entering");
  React.useEffect(() => {
    if (released) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setReleased(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [released]);
  const reduced = useReducedMotionPreference();
  // A part at rest carries nothing of a fade, unless it can be covered by a
  // pill: it takes the classes of the fade before that happens, so that its
  // first fade out does not snap, and keeps them to fade back in. With reduced
  // motion a label that is covered is out of sight at once and comes back at
  // once (M5).
  if (!presence && !covered && !fading) return {};
  return {
    className:
      reduced && !presence
        ? "data-[ending-style]:opacity-0"
        : swapFadeClassName,
    "data-ending-style": presence === "leaving" || covered ? "" : undefined,
    "data-starting-style":
      presence === "entering" && !released ? "" : undefined,
  };
}

function FadingText({
  covered,
  fading,
  presence,
  ...props
}: React.ComponentProps<"text"> & {
  /** Something sits on the label: it fades out until it is clear. */
  covered?: boolean | undefined;
  /** The label is ready to fade although it is at rest. */
  fading?: boolean | undefined;
  presence?: ChartPresence | undefined;
}) {
  const fade = useFadeThrough(presence, covered, fading);
  return <text {...props} {...fade} />;
}

function FadingLine({
  presence,
  ...props
}: React.ComponentProps<"line"> & { presence?: ChartPresence | undefined }) {
  const fade = useFadeThrough(presence);
  return <line {...props} {...fade} />;
}

/** Hairlines across the plot, one per position, in the colour of the Separator. */
export function ChartGrid({
  positions,
  presences,
  layout,
  direction = "horizontal",
}: {
  /** Where the lines are, in px from the top (horizontal) or the left (vertical) of the plot. */
  positions: readonly number[];
  /** Which lines come or go with new data, in the order of `positions`. */
  presences?: readonly (ChartPresence | undefined)[];
  layout: CartesianLayout;
  direction?: "horizontal" | "vertical";
}): React.ReactElement {
  return (
    <g
      aria-hidden="true"
      className="sp-chart-grid stroke-border"
      data-slot="chart-grid"
      fill="none"
      shapeRendering="crispEdges"
      strokeWidth={1}
    >
      {positions.map((position, index) => (
        <FadingLine
          key={index}
          presence={presences?.[index]}
          x1={direction === "horizontal" ? 0 : position}
          x2={direction === "horizontal" ? layout.plotWidth : position}
          y1={direction === "horizontal" ? position : 0}
          y2={direction === "horizontal" ? position : layout.plotHeight}
        />
      ))}
    </g>
  );
}

// The labels of both axes: 12 px, muted, in tabular figures.
const axisLabelClassName = "fill-muted-foreground text-xs tabular-nums";

/** The room a label of a left axis takes in a column of them: as tall as a line of 12 px text, in px. */
export const CHART_LABEL_HEIGHT = 14;
/** The space kept between two labels of a left axis, in px. */
export const CHART_LABEL_COLUMN_GAP = 4;

/** The labels of a value axis: along the left of the plot, or below it. */
export function ChartValueAxis({
  ticks,
  layout,
  side,
}: {
  ticks: readonly {
    value: number;
    position: number;
    text: string;
    /** Whether the label comes or goes with new data. */
    presence?: ChartPresence | undefined;
  }[];
  layout: CartesianLayout;
  side: "left" | "bottom";
}): React.ReactElement {
  const placed = ticks.map((tick) =>
    placeAxisLabel(tick.text, tick.position, layout, side),
  );
  // While new data stretches the axis its labels glide with it, and could end up
  // on top of each other: the ones that come or go are left out until they clear.
  const readable = readableLabels(
    ticks.map((tick, index) =>
      side === "left" ? tick.position : placed[index]!.x,
    ),
    placed.map((label) =>
      side === "left" ? CHART_LABEL_HEIGHT : estimateLabelWidth(label.text),
    ),
    ticks.map((tick) => tick.presence),
    side === "left" ? CHART_LABEL_COLUMN_GAP : labelGap,
  );
  return (
    <g
      aria-hidden="true"
      className={cn("sp-chart-axis", axisLabelClassName)}
      data-slot="chart-axis"
      data-side={side}
    >
      {ticks.map((tick, index) =>
        readable[index] ? (
          <FadingText
            dy={side === "left" ? "0.32em" : "0.71em"}
            key={tick.value}
            presence={tick.presence}
            textAnchor={side === "left" ? "end" : "middle"}
            x={placed[index]!.x}
            y={
              side === "left" ? tick.position : layout.plotHeight + labelOffset
            }
          >
            {placed[index]!.text}
          </FadingText>
        ) : null,
      )}
    </g>
  );
}

/**
 * The labels of a category or time axis, along the bottom of the plot or down
 * its left side. However many there are, none collide: the axis shows every k-th
 * label, one k for all of them (the smallest that leaves them clear), so that
 * the labels keep an even rhythm.
 */
export function ChartCategoryAxis({
  labels,
  layout,
  side,
  thin = true,
  fading = false,
}: {
  labels: readonly {
    key: string;
    position: number;
    text: string;
    /** Whether the label comes or goes with new data. */
    presence?: ChartPresence | undefined;
    /** Whether a pill sits on the label: it fades out until the pill has left (rulebook M8). */
    covered?: boolean | undefined;
  }[];
  layout: CartesianLayout;
  side: "bottom" | "left";
  /** Whether to leave labels out so that none collide. A chart that places its labels itself turns this off. */
  thin?: boolean;
  /** Draws the labels ready to fade, which a chart that shows a pill asks for once the pill has been shown. */
  fading?: boolean;
}): React.ReactElement {
  const placed = labels.map((label) =>
    placeAxisLabel(label.text, label.position, layout, side),
  );
  const step = thin
    ? labelStep(
        labels.map((label) => label.position),
        placed.map((label) =>
          side === "bottom"
            ? estimateLabelWidth(label.text)
            : CHART_LABEL_HEIGHT,
        ),
        side === "bottom" ? labelGap : CHART_LABEL_COLUMN_GAP,
      )
    : 1;
  return (
    <g
      aria-hidden="true"
      className={cn("sp-chart-axis", axisLabelClassName)}
      data-slot="chart-axis"
      data-side={side}
    >
      {labels.map((label, index) =>
        index % step === 0 ? (
          <FadingText
            covered={label.covered}
            dy={side === "bottom" ? "0.71em" : "0.32em"}
            fading={fading}
            key={label.key}
            presence={label.presence}
            textAnchor={side === "bottom" ? "middle" : "end"}
            x={placed[index]!.x}
            y={
              side === "bottom"
                ? layout.plotHeight + labelOffset
                : label.position
            }
          >
            {placed[index]!.text}
          </FadingText>
        ) : null,
      )}
    </g>
  );
}

/**
 * A hairline through the plot at the active item. It glides to the next item
 * with the follow motion, fades in and out with the active item, and waits out
 * of sight, where it last was, until the next one is active.
 */
export function ChartCrosshair({
  container,
  position,
  layout,
  direction = "vertical",
}: {
  /** The element whose motion tokens set the glide: the chart. */
  container?: React.RefObject<Element | null> | undefined;
  /** Where the line is, in px from the left (vertical) or the top (horizontal) of the plot; null for none. */
  position: number | null;
  layout: CartesianLayout;
  direction?: "vertical" | "horizontal";
}): React.ReactElement {
  const fade = useFadeClassName();
  // It appears at the item and glides from then on, so it does not slide in
  // from where it was last seen.
  const at = useFollowValue(useLastValue(position) ?? 0, {
    active: position !== null,
    container,
  });
  return (
    <followed.line
      aria-hidden="true"
      className={cn("sp-chart-crosshair", "stroke-border-strong", fade)}
      data-slot="chart-crosshair"
      data-visible={position !== null ? "" : undefined}
      strokeWidth={1}
      x1={direction === "vertical" ? at : 0}
      x2={direction === "vertical" ? at : layout.plotWidth}
      y1={direction === "vertical" ? 0 : at}
      y2={direction === "vertical" ? layout.plotHeight : at}
    />
  );
}

/**
 * The dot of a series at the active item: its colour, ringed in the colour of
 * the surface it sits on. It glides to the next item with the follow motion; on
 * a line or an area it rides the curve there (`trace`), so it does not cut
 * across the plot between two points that are far apart.
 */
export function ChartActiveDot({
  container,
  cx,
  cy,
  color,
  trace,
  visible = true,
}: {
  /** The element whose motion tokens set the glide: the chart. */
  container?: React.RefObject<Element | null> | undefined;
  cx: number;
  cy: number;
  color: string;
  /** The height of the series' curve at an x, null where it is not drawn: what a dot on a line rides along. Without it the dot glides to its height in a straight line. */
  trace?: ((x: number) => number | null) | undefined;
  /** Hides the dot with a fade, and lets it appear in its place when it is shown again. */
  visible?: boolean;
}): React.ReactElement {
  const fade = useFadeClassName();
  const x = useFollowValue(cx, { active: visible, container });
  // Its height follows its place on the curve, not a spring of its own; where
  // there is no curve to ride it glides there.
  const free = useFollowValue(cy, { active: visible && !trace, container });
  const riding = useFollowDerived(x, (along) =>
    // At its place it is exactly where the data puts it.
    Math.abs(along - cx) < 0.01 ? cy : (trace?.(along) ?? cy),
  );
  return (
    <followed.circle
      aria-hidden="true"
      className={cn(
        "sp-chart-active-dot",
        "stroke-(--sp-rw-surface-color,var(--sp-rw-bg-base))",
        fade,
      )}
      cx={x}
      cy={trace ? riding : free}
      data-slot="chart-active-dot"
      data-visible={visible ? "" : undefined}
      fill={color}
      r={4}
      strokeWidth={2}
    />
  );
}

// The empty state of every chart: 14 px, muted.
const emptyClassName = "text-sm text-muted-foreground";

/**
 * What a chart shows in place of its marks when there is nothing to draw: the
 * label in muted 14 px text, in the middle of the plot. Given a `layout` it is
 * SVG text in the plot of a cartesian chart, drawn at the size of its layout.
 * Without one it is HTML over the plot, filling the positioned element it sits
 * in, for a chart whose SVG is scaled to its box, such as the Pie Chart. It is
 * hidden from assistive technology: the chart says it in its description.
 */
export function ChartEmptyState({
  label,
  layout,
}: {
  label: string;
  layout?: CartesianLayout;
}): React.ReactElement {
  if (!layout)
    return (
      <div
        aria-hidden="true"
        className={cn(
          "sp-chart-empty",
          "pointer-events-none absolute inset-0 flex items-center justify-center text-center",
          emptyClassName,
        )}
        data-slot="chart-empty"
      >
        {label}
      </div>
    );
  return (
    <text
      aria-hidden="true"
      className={cn("sp-chart-empty", "fill-current", emptyClassName)}
      data-slot="chart-empty"
      dominantBaseline="middle"
      textAnchor="middle"
      x={layout.margin.left + layout.plotWidth / 2}
      y={layout.margin.top + layout.plotHeight / 2}
    >
      {label}
    </text>
  );
}
