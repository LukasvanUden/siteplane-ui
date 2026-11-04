import { CalendarDate, getDayOfWeek } from "@internationalized/date";

/**
 * The locale's first day of the week, as a day of a Date (0 is Sunday). It
 * reads the same data as the date components' calendars: 1 January 2024 was
 * a Monday, and getDayOfWeek counts from the locale's first day. The locale
 * module owns it, so a composite such as the Task Calendar installs no date
 * foundation of its own.
 */
export function getFirstDayOfWeek(locale: string): number {
  return (1 - getDayOfWeek(new CalendarDate(2024, 1, 1), locale) + 7) % 7;
}
