import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "../../system/utils/cn";

// The action takes a column of its own only from 640 px and only beside a
// title or description; below 640 px it wraps under the text, so the grid
// keeps no empty track for it (rulebook S11). The text column is
// minmax(0, 1fr), so a long value wraps instead of pushing the action out
// (rulebook K5).
const alertVariants = cva(
  "relative grid w-full grid-cols-[minmax(0,1fr)] items-start has-[>svg]:grid-cols-[calc(var(--spacing)*4)_minmax(0,1fr)] sm:has-data-[slot=alert-action]:has-[[data-slot=alert-title],[data-slot=alert-description]]:grid-cols-[minmax(0,1fr)_auto] sm:has-[>svg]:has-data-[slot=alert-action]:has-[[data-slot=alert-title],[data-slot=alert-description]]:grid-cols-[calc(var(--spacing)*4)_minmax(0,1fr)_auto] [&>svg]:h-lh [&>svg]:w-4",
  {
    defaultVariants: { variant: "default" },
    variants: {
      variant: {
        default: "[&>svg]:text-muted-foreground",
        error: "[&>svg]:text-destructive",
        info: "[&>svg]:text-info",
        success: "[&>svg]:text-success",
        warning: "[&>svg]:text-warning",
      },
    },
  },
);

// Only an error or a warning interrupts a screen reader (role="alert"). The
// default, info and success tones are a polite status, so an Alert rendered
// after an action does not cut into what is being read, and a page with
// several Alerts keeps a single assertive region at most. A `role` passed in
// wins.
const assertiveVariants: ReadonlySet<string> = new Set(["error", "warning"]);

export function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants>): React.ReactElement {
  const resolvedVariant = variant ?? "default";
  return (
    <div
      className={cn(alertVariants({ variant }), className)}
      data-slot="alert"
      data-variant={resolvedVariant}
      role={assertiveVariants.has(resolvedVariant) ? "alert" : "status"}
      {...props}
    />
  );
}

export function AlertTitle({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn("wrap-anywhere [svg~&]:col-start-2", className)}
      data-slot="alert-title"
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 wrap-anywhere [svg~&]:col-start-2",
        className,
      )}
      data-slot="alert-description"
      {...props}
    />
  );
}

export function AlertAction({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    // Below 640 px the action wraps under the text, in the text's column. From
    // 640 px it sits beside the text and spans two rows only beside a title
    // and a description (rulebook S11).
    <div
      className={cn(
        "flex empty:hidden max-sm:mt-2 [svg~&]:col-start-2 sm:row-start-1 sm:self-center sm:[[data-slot=alert-title]~[data-slot=alert-description]~&]:row-end-3 sm:[[data-slot=alert-description]~&]:col-start-2 sm:[[data-slot=alert-title]~&]:col-start-2 sm:[svg~[data-slot=alert-description]~&]:col-start-3 sm:[svg~[data-slot=alert-title]~&]:col-start-3",
        className,
      )}
      data-slot="alert-action"
      {...props}
    />
  );
}
