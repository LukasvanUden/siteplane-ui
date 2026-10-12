/**
 * What a rolling number is made of, kept apart from the component so that it
 * can be checked without a DOM. A number is cut into characters, and every
 * character gets a key that names the place it holds: the units digit, the
 * group separator after the thousands, the percent sign. A character that keeps
 * its place while the number changes is the same cell, so a digit rolls and a
 * sign that stays does nothing; a place that appears or goes opens or closes its
 * width. The server and the first render show the final text.
 */

/** The locale of a number that names none: fixed, so the server and the client agree. */
export const defaultNumberLocales = "en-US";

export type NumberToken =
  | { kind: "digit"; text: string; value: number }
  | { kind: "group" | "decimal"; text: string }
  | { kind: "text"; text: string };

export type NumberCell =
  | { key: string; kind: "digit"; text: string; value: number }
  | { key: string; kind: "static"; text: string };

export function localeKey(locales: Intl.LocalesArgument): string {
  if (locales === undefined) return "";
  return Array.isArray(locales) ? locales.join(",") : String(locales);
}

const latinDigits: readonly string[] = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
];
const glyphCache = new Map<string, readonly string[]>();
const decimalCache = new Map<string, string>();

/**
 * The ten digits as the locale writes them, in order: "0" to "9" for most, the
 * Arabic-Indic digits for others. A wheel shows these glyphs.
 */
export function digitGlyphs(locales: Intl.LocalesArgument): readonly string[] {
  const id = localeKey(locales);
  let glyphs = glyphCache.get(id);
  if (!glyphs) {
    try {
      const format = new Intl.NumberFormat(locales, { useGrouping: false });
      glyphs = latinDigits.map((_, digit) => format.format(digit));
    } catch {
      glyphs = latinDigits;
    }
    glyphCache.set(id, glyphs);
  }
  return glyphs;
}

/** The decimal separator of the locale, which tells a preformatted string where its fraction starts. */
export function decimalSeparator(locales: Intl.LocalesArgument): string {
  const id = localeKey(locales);
  let separator = decimalCache.get(id);
  if (!separator) {
    try {
      separator =
        new Intl.NumberFormat(locales)
          .formatToParts(1.1)
          .find((part) => part.type === "decimal")?.value ?? ".";
    } catch {
      separator = ".";
    }
    decimalCache.set(id, separator);
  }
  return separator;
}

/** A number as Intl writes it, cut into digits, separators and the rest. */
export function numberTokens(
  value: number,
  locales: Intl.LocalesArgument,
  format?: Intl.NumberFormatOptions,
): NumberToken[] {
  const glyphs = digitGlyphs(locales);
  const tokens: NumberToken[] = [];
  for (const part of new Intl.NumberFormat(locales, format).formatToParts(
    value,
  )) {
    if (part.type === "integer" || part.type === "fraction") {
      for (const char of part.value) {
        const digit = glyphs.indexOf(char);
        tokens.push(
          digit >= 0
            ? { kind: "digit", text: char, value: digit }
            : { kind: "text", text: char },
        );
      }
    } else if (part.type === "group" || part.type === "decimal") {
      tokens.push({ kind: part.type, text: part.value });
    } else {
      tokens.push({ kind: "text", text: part.value });
    }
  }
  return tokens;
}

// A number inside a string: digits, with group and decimal separators between
// them. A space is a separator only when exactly three digits follow it, so
// "4 12" stays two numbers.
const numericRun =
  /[0-9]+(?:(?:[,.\u00A0\u202F'\u2019]| (?=[0-9]{3}(?![0-9])))[0-9]+)*/g;
// The rest of the string: a sign, a currency symbol or a percent sign alone, so
// that each can come and go by itself, and any other text as one piece.
const textPiece =
  /[+\-\u2212\u00B1]|\p{Sc}|[%\u2030\u2031]|[^+\-\u2212\u00B1\p{Sc}%\u2030\u2031]+/gu;

/**
 * A string that is already formatted, cut the same way. Latin digits are
 * digits; the locale says which separator is the decimal one. A string without
 * digits is text only.
 */
export function stringTokens(
  text: string,
  locales: Intl.LocalesArgument,
): NumberToken[] {
  const decimal = decimalSeparator(locales);
  const tokens: NumberToken[] = [];
  const pushText = (segment: string) => {
    for (const piece of segment.match(textPiece) ?? [])
      tokens.push({ kind: "text", text: piece });
  };
  let cursor = 0;
  for (const match of text.matchAll(numericRun)) {
    pushText(text.slice(cursor, match.index));
    const run = match[0];
    const last = [...run].findLastIndex((char) => char < "0" || char > "9");
    // The last separator is the decimal point when it is the locale's own and
    // the only one of its kind; "1.234.567" has none.
    const decimalAt =
      last >= 0 && run[last] === decimal && run.split(decimal).length === 2
        ? last
        : -1;
    [...run].forEach((char, index) => {
      tokens.push(
        char >= "0" && char <= "9"
          ? { kind: "digit", text: char, value: Number(char) }
          : { kind: index === decimalAt ? "decimal" : "group", text: char },
      );
    });
    cursor = match.index + run.length;
  }
  pushText(text.slice(cursor));
  return tokens;
}

/** The value a string stands for: its first number, negative after a minus sign. NaN without digits. */
export function tokensValue(tokens: readonly NumberToken[]): number {
  const first = tokens.findIndex((token) => token.kind === "digit");
  if (first < 0) return Number.NaN;
  let digits = "";
  for (const token of tokens.slice(first)) {
    if (token.kind === "digit") digits += token.value;
    else if (token.kind === "decimal") digits += ".";
    else if (token.kind === "text") break;
  }
  const negative = tokens
    .slice(0, first)
    .some(
      (token) =>
        token.kind === "text" &&
        (token.text.includes("-") || token.text.includes("\u2212")),
    );
  return Number(digits) * (negative ? -1 : 1);
}

/**
 * The cells of a number, each with the key of the place it holds. Digits are
 * keyed by their distance from the decimal point (units, tens, hundreds to the
 * left; tenths, hundredths to the right) and separators by the digits that
 * follow them, so "9,990" and "10,000" share every place but the new one. Text
 * is keyed by what it says and where it stands (before a number, after it), so
 * a "%" that stays is not a new "%" when a minus sign comes.
 */
export function numberCells(tokens: readonly NumberToken[]): NumberCell[] {
  const cells: NumberCell[] = [];
  const seen = new Map<string, number>();
  let run = -1;
  let gap = 0;
  let index = 0;
  while (index < tokens.length) {
    const token = tokens[index]!;
    if (token.kind === "text") {
      const base = `t${gap}:${token.text}`;
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      cells.push({
        key: count === 0 ? base : `${base}#${count}`,
        kind: "static",
        text: token.text,
      });
      index += 1;
      continue;
    }

    let end = index;
    while (end < tokens.length && tokens[end]!.kind !== "text") end += 1;
    run += 1;
    gap += 1;
    const numeric = tokens.slice(index, end);
    const point = numeric.findIndex((entry) => entry.kind === "decimal");
    const integerEnd = point < 0 ? numeric.length : point;
    let toRight = numeric
      .slice(0, integerEnd)
      .filter((entry) => entry.kind === "digit").length;
    let fraction = 0;
    numeric.forEach((entry, position) => {
      if (position === point) {
        cells.push({ key: `r${run}.d`, kind: "static", text: entry.text });
      } else if (entry.kind === "digit") {
        const key =
          position < integerEnd
            ? `r${run}.i${(toRight -= 1)}`
            : `r${run}.f${fraction++}`;
        cells.push({
          key,
          kind: "digit",
          text: entry.text,
          value: entry.value,
        });
      } else {
        cells.push({
          key:
            position < integerEnd
              ? `r${run}.g${toRight}`
              : `r${run}.h${fraction}`,
          kind: "static",
          text: entry.text,
        });
      }
    });
    index = end;
  }
  return cells;
}

/** The direction a number moved in: 1 up, -1 down. Up when nothing is known or nothing moved. */
export function numberTrend(from: number, to: number): 1 | -1 {
  return to < from ? -1 : 1;
}

export const mod = (value: number, size: number) =>
  ((value % size) + size) % size;

/**
 * Where a wheel at `position` rolls to for `digit`: the nearest place beyond it
 * in the direction of the trend that shows the digit. The wheel is endless: 9 is
 * followed by 0, so a number that rises rolls every wheel upward, as an
 * odometer does. A wheel stopped between two digits (a change that arrives
 * while it still rolls) goes on from there.
 */
export function wheelTarget(
  position: number,
  digit: number,
  trend: 1 | -1,
): number {
  if (trend > 0) {
    const from = Math.ceil(position);
    return from + mod(digit - from, 10);
  }
  const from = Math.floor(position);
  return from - mod(from - digit, 10);
}

/** The places a wheel shows on its way: `count` rows from `base`; a row's digit is its place modulo 10. */
export function wheelRange(
  from: number,
  to: number,
): { base: number; count: number } {
  const base = Math.floor(Math.min(from, to));
  return { base, count: Math.ceil(Math.max(from, to)) - base + 1 };
}
