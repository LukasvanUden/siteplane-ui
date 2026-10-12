"use client";

import { Fieldset as FieldsetPrimitive } from "@base-ui/react/fieldset";
import type React from "react";

import { cn, type WithStringClassName } from "../../system/utils/cn";

export function Fieldset({
  className,
  ...props
}: WithStringClassName<FieldsetPrimitive.Root.Props>): React.ReactElement {
  return (
    <FieldsetPrimitive.Root
      className={cn("grid gap-3", className)}
      data-slot="fieldset"
      {...props}
    />
  );
}

export function FieldsetLegend({
  className,
  ...props
}: WithStringClassName<FieldsetPrimitive.Legend.Props>): React.ReactElement {
  return (
    <FieldsetPrimitive.Legend
      className={cn("font-semibold text-foreground", className)}
      data-slot="fieldset-legend"
      {...props}
    />
  );
}

export { FieldsetPrimitive };
