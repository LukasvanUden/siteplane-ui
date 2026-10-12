"use client";

import type * as React from "react";

import { cn } from "../../system/utils/cn";
import { useResolvedDensity } from "../../system/provider/siteplane-ui-provider";

export interface FilterBarProps extends React.ComponentProps<"section"> {
  density?: "compact" | "default";
}

export function FilterBar({
  className,
  density,
  ...props
}: FilterBarProps): React.ReactElement {
  const resolvedDensity = useResolvedDensity(density);

  return (
    <section
      className={cn(
        "grid min-w-0 gap-3 data-[density=compact]:gap-2",
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

export function FilterBarActiveFilters({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn("flex min-w-0 flex-wrap items-center gap-1.5", className)}
      data-pattern="filter-bar-active-filters"
      {...props}
    />
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
