/**
 * The spaces that servers and browsers write differently in formatted text.
 * ICU 72 and later put a narrow no-break space (U+202F) before AM and PM and a
 * thin space (U+2009) around the dash of a date range, and older and newer ICU
 * data disagree on the no-break space (U+00A0) of other formats. Node writes
 * them, while Chrome writes a plain space in their place, so a page that the
 * server renders holds other text than the browser renders, and React rejects
 * the hydration (error #418). The class is built from the three code points,
 * so the source shows which characters it holds.
 */
const unstableSpaces = new RegExp(
  `[${String.fromCodePoint(0x00a0, 0x2009, 0x202f)}]`,
  "g",
);

/**
 * Text that `Intl` formatted, with each space that ICU versions disagree on
 * written as a plain space, so the server and the browser render the same
 * text. The kit's formatted text goes through it: the segments of the Time
 * Field and the Date Time Picker, which React Aria builds with
 * `formatToParts`, the hour names of the time selector, the calendar headings,
 * the Date Picker and Task Calendar dates, and the numbers and dates of the
 * charts.
 */
export function normalizeFormattedText(text: string): string {
  return text.replace(unstableSpaces, " ");
}
