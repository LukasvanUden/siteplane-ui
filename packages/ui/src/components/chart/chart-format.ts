import type { ChartXValue } from "./chart-types";

/** Charts format numbers and dates in this locale unless they are given another, so the server and the client agree. */
export const CHART_DEFAULT_LOCALE = "en-US";

// Intl formatters are costly to build and charts ask for them on every render.
const formatters = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>();
function cached<T extends Intl.NumberFormat | Intl.DateTimeFormat>(
  key: string,
  create: () => T,
): T {
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = create();
    formatters.set(key, formatter);
  }
  return formatter as T;
}

/** A value as the locale writes a number: 1,234.5 */
export function chartNumberFormatter(
  locale: string = CHART_DEFAULT_LOCALE,
): (value: number) => string {
  const format = cached(
    `number|${locale}`,
    () => new Intl.NumberFormat(locale),
  );
  return (value) => format.format(value);
}

/** A value as a compact tick label: 1.2K */
export function chartTickFormatter(
  locale: string = CHART_DEFAULT_LOCALE,
): (value: number) => string {
  const format = cached(
    `tick|${locale}`,
    () =>
      new Intl.NumberFormat(locale, {
        maximumFractionDigits: 1,
        notation: "compact",
      }),
  );
  return (value) => format.format(value);
}

// The compact form keeps one fraction digit of the thousands, millions, ... a
// value reaches. A value that needs more than that would be rounded.
const compactUnits = [1e12, 1e9, 1e6, 1e3];
function fitsCompact(value: number): boolean {
  const unit = compactUnits.find((candidate) => Math.abs(value) >= candidate);
  const tenths = (value / (unit ?? 1)) * 10;
  return (
    Math.abs(tenths - Math.round(tenths)) < 1e-9 * Math.max(1, Math.abs(tenths))
  );
}

/**
 * The labels of a value axis. A formatter that is given writes them. Otherwise
 * they are compact (1.2K), unless that would round a tick, as 1,005 would read
 * 1K: then they are written out.
 */
export function chartTickLabels(
  ticks: readonly number[],
  locale: string = CHART_DEFAULT_LOCALE,
  format?: (value: number) => string,
): string[] {
  if (format) return ticks.map((tick) => format(tick));
  const write = ticks.every(fitsCompact)
    ? chartTickFormatter(locale)
    : chartNumberFormatter(locale);
  return ticks.map((tick) => write(tick));
}

/**
 * An x value as text: a category as it is, a date short (Jan 5) or long (Jan 5,
 * 2026). Dates are written in UTC, so that the server and the client agree
 * whatever time zone each runs in; a date at midnight UTC, as `new
 * Date("2026-01-05")` gives, reads as that day everywhere.
 */
export function chartXFormatter(
  locale: string = CHART_DEFAULT_LOCALE,
  length: "short" | "long" = "short",
): (value: ChartXValue) => string {
  const format = cached(
    `date|${length}|${locale}`,
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
        ...(length === "long" ? { year: "numeric" } : {}),
      }),
  );
  return (value) =>
    value instanceof Date
      ? Number.isNaN(value.getTime())
        ? ""
        : format.format(value)
      : value;
}
