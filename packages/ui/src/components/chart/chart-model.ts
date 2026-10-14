/*
 * What the charts with a category or time axis read from their data before any
 * layout, and the small rules their axes share while new data glides in. The
 * Line, Area and Bar Charts all build their rows, values and spans here, so a
 * row, a missing value and a stack mean the same in each of them.
 */

import { chartValue, chartXKey, isTimeData } from "./chart-data";
import { CHART_DEFAULT_LABELS } from "./chart-format";
import { valueExtent } from "./chart-scales";
import { stackSeries } from "./chart-stack";
import type {
  CartesianChartLabels,
  ChartDatum,
  ChartSeries,
  ChartXValue,
} from "./chart-types";

/**
 * Where a part of an axis stands when new data replaces it: `entering` comes in
 * after the parts it replaces, `leaving` goes out before the parts that replace
 * it. A part at rest has none.
 */
export type ChartPresence = "entering" | "leaving";

/** One place along the x axis: a category or a date, with the data that belongs to it. */
export type CartesianRow = {
  /** The key of the row: its text or ISO date, made unique when the data repeats it. */
  id: string;
  x: ChartXValue;
  datum: ChartDatum;
};

export type CartesianModel = {
  /** The rows in the order of the axis: as given for categories, by date for dates. A row with no x is left out. */
  rows: CartesianRow[];
  time: boolean;
  /** Per series, per row: the series' own number, or null. */
  values: (number | null)[][];
  /** Per series, per row: where its mark ends on the value axis: the value, or the top of its band when stacked. */
  tops: (number | null)[][];
  /** Per series, per row: where its mark starts on the value axis: 0, or the bottom of its band when stacked. */
  bases: (number | null)[][];
  /** The span of the value axis the marks need, 0 included. */
  extent: [number, number];
  /** Nothing to draw: no number in any series. */
  empty: boolean;
};

/** What a chart draws, read from the data without any layout. */
export function buildCartesianModel({
  data,
  x,
  series,
  stacked,
}: {
  data: readonly ChartDatum[];
  x: string;
  series: readonly ChartSeries[];
  stacked: boolean;
}): CartesianModel {
  const time = isTimeData(data, x);
  const seen = new Map<string, number>();
  const rows: CartesianRow[] = [];
  for (const datum of data) {
    const raw = datum[x];
    const key = chartXKey(raw);
    if (key === "" || (time && !(raw instanceof Date))) continue;
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    rows.push({
      datum,
      id: count === 0 ? key : `${key}#${count}`,
      x: raw instanceof Date ? raw : String(raw),
    });
  }
  if (time)
    rows.sort((a, b) => (a.x as Date).getTime() - (b.x as Date).getTime());

  const keys = series.map((item) => item.key);
  const values = keys.map((key) =>
    rows.map((row) => chartValue(row.datum, key)),
  );
  const missing = () => keys.map(() => rows.map((): number | null => null));
  let tops: (number | null)[][] = values;
  let bases: (number | null)[][] = values.map((own) =>
    own.map((value) => (value === null ? null : 0)),
  );
  if (stacked) {
    tops = missing();
    bases = missing();
    rows.forEach((row, index) => {
      for (const segment of stackSeries([row.datum], x, keys)) {
        const place = keys.indexOf(segment.series);
        tops[place]![index] = segment.y1;
        bases[place]![index] = segment.y0;
      }
    });
  }
  return {
    bases,
    empty: values.every((own) => own.every((value) => value === null)),
    extent: valueExtent([...tops.flat(), ...bases.flat()]),
    rows,
    time,
    tops,
    values,
  };
}

/**
 * The data of a chart in words, for the description of its plot: where the axis
 * starts and ends, then the lowest and the highest number of each series that
 * has any, such as "Jan to Jun. Desktop: lowest 73, highest 305." A series
 * with a single number says it alone. A chart with no numbers says its empty
 * label. The chart's own formats write the x values and the numbers, and its
 * `labels` the words, which are English by default.
 */
export function cartesianSummary({
  emptyLabel,
  formatValue,
  formatX,
  labels = CHART_DEFAULT_LABELS,
  model,
  series,
}: {
  emptyLabel: string;
  formatValue: (value: number) => string;
  formatX: (value: ChartXValue) => string;
  labels?: Pick<CartesianChartLabels, "highest" | "lowest" | "to">;
  model: CartesianModel;
  series: readonly ChartSeries[];
}): string {
  const first = model.rows[0];
  const last = model.rows[model.rows.length - 1];
  if (model.empty || !first || !last) return emptyLabel;
  const span =
    first === last
      ? formatX(first.x)
      : [formatX(first.x), labels.to, formatX(last.x)]
          .filter(Boolean)
          .join(" ");
  const ranges = series.flatMap((item, place) => {
    const numbers = (model.values[place] ?? []).filter(
      (value): value is number => value !== null,
    );
    if (numbers.length === 0) return [];
    const lowest = numbers.reduce((low, value) => Math.min(low, value));
    const highest = numbers.reduce((high, value) => Math.max(high, value));
    const word = (text: string, value: number) =>
      [text, formatValue(value)].filter(Boolean).join(" ");
    return [
      lowest === highest
        ? `${item.label}: ${formatValue(lowest)}`
        : `${item.label}: ${word(labels.lowest, lowest)}, ${word(labels.highest, highest)}`,
    ];
  });
  // A full stop ends the summary, so that what is read after it, such as the
  // keyboard hint, is heard as a sentence of its own.
  return `${[span, ...ranges].join(". ")}.`;
}

/**
 * Where a keyed row stands in a fade through, from its tween: a row on its way
 * out is `leaving`, one that has not yet arrived `entering`, one at rest neither.
 */
export function presenceOf(entry: {
  leaving: boolean;
  value: number;
}): ChartPresence | undefined {
  return entry.leaving ? "leaving" : entry.value < 1 ? "entering" : undefined;
}

/**
 * Where a tick of the value axis is drawn. One that stays or comes in sits where
 * the axis puts it, and moves with the axis while it glides. One that goes out
 * fades where it stood: the axis may have moved far since, and carried along it
 * would crowd its labels into each other.
 */
export function tickPosition(
  entry: { leaving: boolean; row: { position: number; value: number } },
  scale: (value: number) => number,
): number {
  return entry.leaving ? entry.row.position : scale(entry.row.value);
}

/** The generation of something that is replaced as a whole when its signature changes. */
export type Generation = { count: number; signature: string };

/** The generation after a render with this signature: the same while it stays, the next once it changes. */
export function advanceGeneration(
  state: Generation,
  signature: string,
): Generation {
  return state.signature === signature
    ? state
    : { count: state.count + 1, signature };
}
