/**
 * Presentation shared by Table (React Aria) and NativeTable (native HTML).
 * Internal: it is not exported from the package index, so both families keep
 * one footer treatment and one cell alignment rule.
 */

export type TableAlign = "center" | "end" | "start";

/** Summary rows: a top contour on the subtle surface at medium weight. */
export const tableFooterClassName =
  "border-t bg-surface-subtle font-medium [&>tr]:last:border-b-0";

/**
 * The size scale that table.css reads on the container: the heading row's
 * height and the cells' block padding, 32/4 px at sm, 36/6 at default, 40/8 at
 * lg and 48/12 at xl.
 */
export const tableContainerSizeClassName =
  "[--table-cell-padding-block:var(--sp-rw-space-1-5)] [--table-head-height:var(--sp-rw-space-9)] data-[size=sm]:[--table-cell-padding-block:var(--sp-rw-space-1)] data-[size=sm]:[--table-head-height:var(--sp-rw-space-8)] data-[size=lg]:[--table-cell-padding-block:var(--sp-rw-space-2)] data-[size=lg]:[--table-head-height:var(--sp-rw-space-10)] data-[size=xl]:[--table-cell-padding-block:var(--sp-rw-space-3)] data-[size=xl]:[--table-head-height:var(--sp-rw-space-12)]";

/**
 * Logical alignment follows the writing direction; end-aligned cells hold
 * numbers, so their digits are tabular.
 */
export function tableAlignmentClassName(align: TableAlign | undefined): string {
  if (align === "center") return "text-center";
  if (align === "end") return "text-end tabular-nums";
  return "text-start";
}
