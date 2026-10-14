"use client";

import type * as React from "react";

import { cn } from "../../system/utils/cn";
import { useResolvedDensity } from "../../system/provider/siteplane-ui-provider";
import { MotionReveal } from "../motion";

export interface FilterBarProps extends React.ComponentProps<"section"> {
  density?: "compact" | "default";
}

/**
 * The space between the bar's rows is `--filter-bar-gap`: 12 px, 8 px in the
 * compact density. FilterBarActiveFilters reads the same value, so the space
 * above the active filters opens and closes with their row instead of
 * appearing in one step. The rows stack in a flex column, where the row's
 * negative margin can take the gap back while the row is still closed.
 */
export function FilterBar({
  className,
  density,
  ...props
}: FilterBarProps): React.ReactElement {
  const resolvedDensity = useResolvedDensity(density);

  return (
    <section
      className={cn(
        "flex min-w-0 flex-col gap-(--filter-bar-gap) [--filter-bar-gap:calc(var(--spacing)*3)] data-[density=compact]:[--filter-bar-gap:calc(var(--spacing)*2)]",
        className,
      )}
      data-density={resolvedDensity}
      data-pattern="filter-bar"
      {...props}
    />
  );
}

export function FilterBarControls({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-wrap items-center justify-between gap-2",
        className,
      )}
      data-pattern="filter-bar-controls"
      {...props}
    />
  );
}

export function FilterBarSearch({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn("min-w-0", className)}
      data-pattern="filter-bar-search"
      {...props}
    />
  );
}

export function FilterBarFilters({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn("flex min-w-0 flex-wrap items-center gap-2", className)}
      data-pattern="filter-bar-filters"
      {...props}
    />
  );
}

export interface FilterBarActiveFiltersProps extends React.ComponentProps<"div"> {
  /**
   * Shows the row. While no filter applies, set it to `false`: the row
   * collapses with a fade and keeps its last tags while it goes, and the space
   * above it closes with it, so the collection below glides up. Default `true`.
   */
  open?: boolean | undefined;
}

/**
 * The applied filters under the controls. The row reveals itself like a
 * FieldError: the reveal takes back the bar's gap and the row gives it again
 * as its own top padding, so the space opens and closes with the row.
 */
export function FilterBarActiveFilters({
  className,
  open = true,
  ...props
}: FilterBarActiveFiltersProps): React.ReactElement {
  return (
    <MotionReveal className="-mt-(--filter-bar-gap)" open={open}>
      <div
        className={cn(
          "flex min-w-0 flex-wrap items-center gap-1.5 pt-(--filter-bar-gap)",
          className,
        )}
        data-pattern="filter-bar-active-filters"
        {...props}
      />
    </MotionReveal>
  );
}

export function FilterBarActions({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn("flex shrink-0 items-center gap-2", className)}
      data-pattern="filter-bar-actions"
      {...props}
    />
  );
}
