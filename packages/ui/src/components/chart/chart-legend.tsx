"use client";

/*
 * The legend of a chart and the focused series. The hover is adapted from bklit
 * UI (chart-legend-hover.tsx, legend/legend.tsx, legend/legend-item.tsx and
 * chart-legend.tsx, MIT): a mouse over an entry makes its series the focused
 * one, leaving it clears that, and the other entries step back. Everything else
 * is Siteplane's own.
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
import { MotionItem, MotionList } from "../motion";
import {
  chartLegendDimClassName,
  seriesSteppedBack,
  useChartDimClassName,
} from "./chart-dimming";
import { retainKey } from "./chart-interaction";

/** The 8 px dot that names a series, in the legend and in the tooltip. */
export function ChartSwatch({ color }: { color: string }): React.ReactElement {
  return (
    <span
      aria-hidden="true"
      className="size-2 shrink-0 rounded-full"
      // The colour is a series colour, a token or what the consumer supplies as
      // data, so it can only be set as a value.
      style={{ background: color }}
    />
  );
}

/**
 * The dot before the name of a series, in a legend entry or a tooltip row: in
 * a box one line of the name tall, so that it centres on the name's first line
 * however many lines follow (rulebook I5). The row it starts aligns its items
 * at their top.
 */
export function ChartLabelSwatch({
  color,
}: {
  color: string;
}): React.ReactElement {
  return (
    <span className="flex h-lh shrink-0 items-center">
      <ChartSwatch color={color} />
    </span>
  );
}

export type ChartLegendItem = {
  key: string;
  label: string;
  color: string;
  /** Read out to assistive technology after the label, never shown. */
  value?: string;
};

/**
 * The series that has the mouse in the legend. A visual aid and nothing more:
 * it moves no focus, opens no tooltip and changes no name that a screen reader
 * reads.
 */
export type ChartSeriesFocus = {
  /** The key of the series whose entry the mouse is over; null while none is. */
  focusedKey: string | null;
  setFocusedKey: (key: string | null) => void;
};

/**
 * The state of the focused series, for a chart that has a legend to own it: the
 * chart passes it to its legend, which sets it, and reads it for its marks. A
 * series that leaves the data is no longer the focused one: the entry that had
 * the mouse is gone, and no pointer leave will come to clear it.
 */
export function useChartSeriesFocus(keys: readonly string[]): ChartSeriesFocus {
  const [focusedKey, setFocusedKey] = React.useState<string | null>(null);
  const retained = retainKey(keys, focusedKey);
  if (focusedKey !== null && retained === null) setFocusedKey(null);
  return { focusedKey: retained, setFocusedKey };
}

/**
 * What makes an entry of the legend the focused series: a mouse over it, and
 * nothing else. A touch or a pen has no hover to show, as in bklit UI, so
 * neither sets or clears the focus; an entry is no focus stop, so the keyboard
 * does not either.
 */
export function legendEntryHandlers(
  key: string,
  setFocusedKey: (key: string | null) => void,
): {
  onPointerEnter: React.PointerEventHandler<HTMLElement>;
  onPointerLeave: React.PointerEventHandler<HTMLElement>;
} {
  return {
    onPointerEnter: (event) => {
      if (event.pointerType === "mouse") setFocusedKey(key);
    },
    onPointerLeave: (event) => {
      if (event.pointerType === "mouse") setFocusedKey(null);
    },
  };
}

/**
 * The series of a chart, each with its dot. Items go through the motion list,
 * so a series that comes or goes animates and the others glide. Given the
 * chart's `focus`, a mouse over an entry makes its series the focused one and
 * the other entries step back, as the marks of the chart do, unless `fade` is
 * off. The legend never grows wider than the room it is given: a long label
 * wraps, and a word too long for its line breaks inside it (rulebook K5),
 * while the dot stays on the label's first line (I5).
 */
export function ChartLegend({
  items,
  layout = "list",
  focus,
  fade = true,
  className,
}: {
  items: readonly ChartLegendItem[];
  /** `list` stacks the items in a column; `row` lays them out in a wrapping row, below a plot. */
  layout?: "list" | "row";
  /** The chart's focused series: the legend sets it under a mouse and fades the entries that are not it. */
  focus?: ChartSeriesFocus;
  /**
   * Whether the entries that are not the focused series fade. A Pie Chart's do
   * not: its colours are shades of one hue, and a faded entry would take the
   * colour of another one.
   */
  fade?: boolean;
  className?: string;
}): React.ReactElement {
  // A column opens and closes the space between its items; a row sets it with gap.
  const place =
    layout === "row" ? ({ layout: "flow" } as const) : ({ gap: 1 } as const);
  const dimClassName = useChartDimClassName("mark");
  // A div and not the figure's caption: the caption would name the chart's
  // figure after its series, and the chart is named by its label alone.
  return (
    <div
      className={cn("sp-chart-legend", "min-w-0 max-w-full", className)}
      data-slot="chart-legend"
    >
      <MotionList
        className={cn(
          "text-sm text-muted-foreground",
          layout === "row" && "flex flex-wrap justify-center gap-x-4 gap-y-1",
        )}
        {...place}
      >
        {items.map((item) => (
          <MotionItem key={item.key}>
            <div
              className={cn(
                "flex items-start gap-2",
                focus && fade && dimClassName,
                focus &&
                  fade &&
                  seriesSteppedBack(focus.focusedKey, item.key) &&
                  chartLegendDimClassName,
              )}
              data-focused={focus?.focusedKey === item.key ? "" : undefined}
              {...(focus
                ? legendEntryHandlers(item.key, focus.setFocusedKey)
                : undefined)}
            >
              <ChartLabelSwatch color={item.color} />
              <span className="min-w-0 wrap-anywhere">
                {item.label}
                {item.value !== undefined && (
                  <span className="sr-only">: {item.value}</span>
                )}
              </span>
            </div>
          </MotionItem>
        ))}
      </MotionList>
    </div>
  );
}
