import type { ChartDatum } from "./chart-types";

/** The finite number at `key`, or null for a missing, empty or non-finite value. */
export function chartValue(datum: ChartDatum, key: string): number | null {
  const value = datum[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

const isValidDate = (value: unknown): value is Date =>
  value instanceof Date && !Number.isNaN(value.getTime());

/** A stable key for an x value: the text itself, or a Date's ISO string. Nothing and an invalid date have no key. */
export function chartXKey(value: unknown): string {
  if (value instanceof Date)
    return isValidDate(value) ? value.toISOString() : "";
  return value === null || value === undefined ? "" : String(value);
}

/** True when every non-empty x value of the data is a valid Date, and there is at least one. */
export function isTimeData(data: readonly ChartDatum[], x: string): boolean {
  let dates = 0;
  for (const datum of data) {
    const value = datum[x];
    if (value === null || value === undefined) continue;
    if (!isValidDate(value)) return false;
    dates++;
  }
  return dates > 0;
}
