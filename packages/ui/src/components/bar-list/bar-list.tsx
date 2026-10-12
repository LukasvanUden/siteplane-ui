"use client";

import * as React from "react";

import { cn } from "../../system/utils/cn";
import {
  CHART_DEFAULT_LOCALE,
  chartNumberFormatter,
} from "../chart/chart-format";
import { chartBrandShades } from "../chart/chart-palette";
import {
  MotionItem,
  MotionList,
  MotionNumber,
  useTweenedRows,
} from "../motion";

export type BarListItem = {
  /** Names the row for as long as it is in the data, so that its bar glides when the data changes. Unique in the list. */
  id: string;
  label: string;
  value: number;
  /** Shown before the label. Pass an svg element to take the icon size of the kit; it is decoration. */
  icon?: React.ReactNode;
};

export type BarListProps = {
  /** The rows, in the order they are shown. */
  data: readonly BarListItem[];
  /** The accessible name of the list. */
  label: string;
  /** Writes a value at the end of its row. */
  formatValue?: (value: number) => string;
  /** The locale of the numbers. */
  locale?: string;
  /** A CSS colour or token for the bars. The lightest brand shade by default. */
  color?: string;
  /** Shown in place of the rows when there is no data. */
  emptyLabel?: string;
  className?: string;
};

const lightestShade = chartBrandShades[chartBrandShades.length - 1]!;
// Every value above zero keeps at least this share of the track, so that a small
// value is still a bar and never a hairline.
const smallestShare = 2;
const hundredths = (value: number) => Math.round(value * 100) / 100;

// A figure that changes in place rolls to its new value; text without digits has
// nothing to roll. It sits on the first line of its label (rulebook I5): the
// row's padding above it, a line of the label's height.
function Value({ text }: { text: string }) {
  const className = "justify-self-end py-1.5 text-sm font-medium";
  return /[0-9]/.test(text) ? (
    <MotionNumber className={className} value={text} />
  ) : (
    <span className={cn(className, "tabular-nums")}>{text}</span>
  );
}

/**
 * Ranked rows with a label, an optional icon, a bar and a value: each bar is as
 * long as its value is large next to the largest, and at least 2 % of the track
 * for any value above zero. The rows keep the order of the data, and glide when
 * it changes: a row that is new grows its bar out of nothing, one that is gone
 * shrinks away, and the others move to their new place.
 */
export function BarList({
  data,
  label,
  formatValue,
  locale = CHART_DEFAULT_LOCALE,
  color = lightestShade,
  emptyLabel = "No data",
  className,
}: BarListProps): React.ReactElement {
  const list = React.useRef<HTMLUListElement>(null);
  const format = formatValue ?? chartNumberFormatter(locale);
  // A value that is not a number counts as 0, as it does in the Pie Chart.
  const rows = data.map((item) => ({
    ...item,
    value: Number.isFinite(item.value) ? item.value : 0,
  }));
  const largest = Math.max(0, ...rows.map((row) => row.value));
  // The bars as they are drawn now, in percent of the track: the largest value
  // fills it, any other value above zero takes its share of that but at least
  // 2 %, and a value that is zero or negative has no bar. When the data changes
  // each bar glides to its new width; at rest this is the data itself.
  const bars = useTweenedRows(
    rows,
    (row) =>
      row.value > 0 ? Math.max((row.value / largest) * 100, smallestShare) : 0,
    { container: list },
  );
  return (
    <MotionList
      aria-label={label}
      // One grid for all the rows: the values share one column, so that every
      // bar has the same track whatever its value is written like.
      className={cn("grid grid-cols-[minmax(0,1fr)_auto] gap-x-6", className)}
      data-slot="bar-list"
      gap={2}
      ref={list}
    >
      {bars.map((bar) => (
        <MotionItem
          className="col-span-full grid grid-cols-subgrid items-start"
          key={bar.key}
          // A row that the data no longer has is on its way out.
          {...(bar.leaving ? { "aria-hidden": true } : {})}
        >
          <div className="relative min-w-0">
            {/* The bar is an SVG, so that its width and its colour are
                attributes of the data and not an inline style. It starts where
                the text starts, and its corners are the kit's. */}
            <svg
              aria-hidden="true"
              className="absolute inset-y-0 start-0 h-full overflow-hidden rounded-md"
              data-slot="bar-list-bar"
              width={`${hundredths(bar.value)}%`}
            >
              <rect fill={color} height="100%" width="100%" />
            </svg>
            {/* A row is 32 px for a label of one line. A long label wraps
                (rulebook K5), and the row and its bar grow with it. */}
            <div className="relative flex min-h-8 items-center gap-2 px-2 py-1.5 text-sm">
              {bar.row.icon && (
                <span
                  aria-hidden="true"
                  className="inline-flex shrink-0 [&>svg]:size-4"
                >
                  {bar.row.icon}
                </span>
              )}
              <span className="min-w-0 wrap-anywhere">{bar.row.label}</span>
            </div>
          </div>
          <Value text={format(bar.row.value)} />
        </MotionItem>
      ))}
      {data.length === 0 && (
        <MotionItem className="col-span-full" key="bar-list-empty">
          <p className="flex h-8 items-center px-2 text-sm text-muted-foreground">
            {emptyLabel}
          </p>
        </MotionItem>
      )}
    </MotionList>
  );
}
