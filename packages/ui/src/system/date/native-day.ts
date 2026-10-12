/**
 * The native Date, at local midnight, of a calendar day of a React Aria date
 * or date-time value, as the Calendar and the date and time controls report
 * it. `new Date(year, monthIndex, day)` reads the years 0 to 99 as 1900 to
 * 1999, so a year typed digit by digit into a controlled field jumped (0020
 * became 1920); `setFullYear` keeps every year as it is.
 */
export function toNativeDay(value: {
  day: number;
  month: number;
  year: number;
}): Date {
  const date = new Date(2000, 0, 1);
  date.setFullYear(value.year, value.month - 1, value.day);
  return date;
}

/**
 * The time of the local midnight that starts the day of `date`, for comparing
 * days whatever their time. It keeps every year, as `toNativeDay` does.
 */
export function nativeDayTime(date: Date): number {
  return toNativeDay({
    day: date.getDate(),
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  }).getTime();
}
