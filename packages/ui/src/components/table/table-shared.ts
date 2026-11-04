/**
 * Presentation shared by Table (React Aria) and NativeTable (native HTML).
 * Internal: it is not exported from the package index, so both families keep
 * one footer treatment and one cell alignment rule.
 */

import {
  type SiteplaneControlSize,
  useResolvedControlSize,
  useResolvedDensity,
} from "../../system/provider/siteplane-ui-provider";

export type TableAlign = "center" | "end" | "start";

/**
 * The sizes of a table: the provider's control sizes and `xs`, the compact
 * table. A provider never gives `xs`, since its sizes start at sm, so a table
 * takes it from its own `size` prop or from the provider's compact density.
 */
export type TableSize = "xs" | SiteplaneControlSize;

/** Summary rows: a top contour on the subtle surface at medium weight. */
export const tableFooterClassName =
  "border-t bg-surface-subtle font-medium [&>tr]:last:border-b-0";

/**
 * The size of a table: its own `size`, else `xs` under the compact density
 * (the provider's, as ResourceList and FilterBar read it), else the provider's
 * control size. `size="xs"` stays an explicit choice. table.css reads the size
 * from the container's `data-size`: the heading row's height, the rows' height
 * and the cells' block padding follow it for Table and NativeTable alike.
 */
export function useResolvedTableSize(size: TableSize | undefined): TableSize {
  const controlSize = useResolvedControlSize(size);
  const density = useResolvedDensity(undefined);
  return size === undefined && density === "compact" ? "xs" : controlSize;
}

/**
 * Logical alignment follows the writing direction; end-aligned cells hold
 * numbers, so their digits are tabular.
 */
export function tableAlignmentClassName(align: TableAlign | undefined): string {
  if (align === "center") return "text-center";
  if (align === "end") return "text-end tabular-nums";
  return "text-start";
}
