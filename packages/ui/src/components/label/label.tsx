"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type * as React from "react";

import { cn } from "../../system/utils/cn";
import { baseClass, slotClass } from "../../system/utils/slot-class";

export function Label({
  className,
  render,
  variant = "default",
  ...props
}: useRender.ComponentProps<"label"> & {
  variant?: "default" | "card";
}): React.ReactElement {
  const defaultProps = {
    className: cn(
      slotClass("label", props, render),
      baseClass("label", props, render),
      "inline-flex items-center",
      // The card contour, radius and checked border are the canonical native
      // recipe shared with Card (design-rework.css), not utilities.
      variant === "card" &&
        "flex w-full p-3 not-has-disabled:hover:bg-accent/50 has-data-checked:bg-accent/50",
      className,
    ),
    "data-foundation": "label",
    "data-slot": "label",
    "data-variant": variant,
  };

  return useRender({
    defaultTagName: "label",
    props: mergeProps<"label">(defaultProps, props),
    render,
  });
}
