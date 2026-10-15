"use client";

import * as React from "react";

import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
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
import { Separator } from "../separator";

export type BarListItem = {
  /** Names the row for as long as it is in the data, so that its bar glides when the data changes. Unique in the list. */
  id: string;
  label: string;
  /**
   * A second, quieter line under the label, such as the path under a page
   * title. It stays on one line, ends in an ellipsis when it is too long and
   * keeps its full text in its title.
   */
  description?: string;
  value: number;
  /** Shown before the label. Pass an svg element to take the icon size of the kit; it is decoration. */
  icon?: React.ReactNode;
};

/** The names of the two columns of a Bar List, shown in a heading row above the rows. */
export type BarListHeading = {
  /** What the rows are, such as "Top pages", above the labels. */
  label: string;
  /** What the values count, such as "Visitors", above the values. */
  value: string;
};

export type BarListProps = {
  /** The rows, in the order they are shown. */
  data: readonly BarListItem[];
  /** The accessible name of the list. */
  label: string;
  /**
   * A heading row with the names of the columns above the rows, over a
   * separator: what the labels are and what the values count.
   */
  heading?: BarListHeading;
  /** Writes a value at the end of its row. */
  formatValue?: (value: number) => string;
  /** The locale of the numbers. */
  locale?: string;
  /** A CSS colour or token for the bars. The lightest brand shade by default. */
  color?: string;
  /** Shown in place of the rows when there is no data. */
  emptyLabel?: string;
  /** Classes for the list, or with a `heading` for the frame that holds the heading and the list. */
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
  const className =
    "justify-self-end py-1.5 text-sm font-(--sp-rw-font-weight-label)";
  return /[0-9]/.test(text) ? (
    <MotionNumber className={className} value={text} />
  ) : (
    <span className={cn(className, "tabular-nums")}>{text}</span>
  );
}

/**
 * Ranked rows with a label, an optional second line, an optional icon, a bar
 * and a value: each bar is as long as its value is large next to the largest,
 * and at least 2 % of the track for any value above zero. The rows keep the
 * order of the data, and glide when it changes: a row that is new grows its bar
 * out of nothing, one that is gone shrinks away, and the others move to their
 * new place. A heading row can name the two columns above the rows.
 */
export function BarList({
  data,
  label,
  heading,
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
  const rowsList = (
    <MotionList
      aria-label={label}
      // One grid for all the rows: the values share one column, so that every
      // bar has the same track whatever its value is written like.
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] gap-x-6",
        !heading && className,
      )}
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
              className="sp-bar-list-bar absolute inset-y-0 start-0 h-full overflow-hidden rounded-md"
              data-slot="bar-list-bar"
              width={`${hundredths(bar.value)}%`}
            >
              <rect fill={color} height="100%" width="100%" />
            </svg>
            {/* A row is 32 px for a label of one line. The label and its
                second line each stay on one line and end in an ellipsis, with
                the full text in their title (rulebook K5, dense rows); a second
                line makes the row and its bar taller. The icon sits on the
                first line (I5). The second line is quieter than the label by
                its size and the secondary text color, which keeps 4.5:1 on the
                lightest bar in both themes, where the tertiary did not. */}
            <div className="relative flex min-h-8 items-start gap-2 px-2 py-1.5 text-sm">
              {bar.row.icon && (
                <span
                  aria-hidden="true"
                  className="inline-flex h-5 shrink-0 items-center [&>svg]:size-4"
                >
                  {bar.row.icon}
                </span>
              )}
              <span className="grid min-w-0">
                <span className="truncate" title={bar.row.label}>
                  {bar.row.label}
                </span>
                {bar.row.description ? (
                  <span
                    className={cn(
                      slotClass("bar-list-description"),
                      "truncate text-(length:--sp-rw-font-13) leading-(--sp-rw-line-18) text-(--sp-rw-fg-secondary)",
                    )}
                    data-slot="bar-list-description"
                    title={bar.row.description}
                  >
                    {bar.row.description}
                  </span>
                ) : null}
              </span>
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
  if (!heading) return rowsList;
  // The heading names the columns above the rows: its label stands over the
  // labels, at the start of the bars, and its value name over the values, at
  // the end of the row. A separator runs between it and the rows.
  return (
    <div
      className={cn(
        slotClass("bar-list-frame"),
        "flex flex-col gap-2",
        className,
      )}
      data-slot="bar-list-frame"
    >
      <div
        className={cn(
          slotClass("bar-list-heading"),
          "flex items-start justify-between gap-6 text-sm font-(--sp-rw-font-weight-label) text-(--sp-rw-fg-tertiary)",
        )}
        data-slot="bar-list-heading"
      >
        <span className="min-w-0 truncate" title={heading.label}>
          {heading.label}
        </span>
        <span className="shrink-0">{heading.value}</span>
      </div>
      <Separator role="presentation" />
      {rowsList}
    </div>
  );
}
