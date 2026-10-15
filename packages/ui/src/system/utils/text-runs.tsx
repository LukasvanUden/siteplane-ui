import { Children, type ReactNode } from "react";

/**
 * Wraps each run of text children, the strings and numbers between elements,
 * in an element of the caller's, such as the one-line label of a badge, a
 * button or a menu row, so the label can shrink and end with an ellipsis.
 * Elements stay children as they are, so the owner still lays out its icons,
 * shortcuts and other parts. A run of spaces alone stays plain text.
 */
export function wrapTextRuns(
  children: ReactNode,
  wrap: (text: string, index: number) => ReactNode,
): ReactNode[] {
  const parts: ReactNode[] = [];
  let run: (string | number)[] = [];
  const flush = () => {
    const text = run.join("");
    if (text.trim() !== "") parts.push(wrap(text, parts.length));
    else parts.push(...run);
    run = [];
  };
  for (const child of Children.toArray(children)) {
    if (typeof child === "string" || typeof child === "number") {
      run.push(child);
    } else {
      flush();
      parts.push(child);
    }
  }
  flush();
  return parts;
}
