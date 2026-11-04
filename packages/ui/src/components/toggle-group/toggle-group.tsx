"use client";

import type { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import type { VariantProps } from "class-variance-authority";
import * as React from "react";

import { useResolvedControlSize } from "../../system/provider/siteplane-ui-provider";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { Separator } from "../separator";
import { KitSeparator } from "../separator/separator-internal";
import { type toggleVariants } from "../toggle";
import { KitToggle } from "../toggle/toggle-internal";

type ToggleGroupVisualProps = Pick<
  VariantProps<typeof toggleVariants>,
  "size" | "variant"
>;

type ToggleGroupContextValue = ToggleGroupVisualProps & {
  single?: boolean;
};

export const ToggleGroupContext: React.Context<ToggleGroupContextValue> =
  React.createContext<ToggleGroupContextValue>({
    single: false,
    variant: "default",
  });

export function ToggleGroup({
  className,
  variant = "default",
  size,
  orientation = "horizontal",
  multiple = false,
  width = "auto",
  wrap = false,
  children,
  ...props
}: WithStringClassName<ToggleGroupPrimitive.Props> &
  ToggleGroupVisualProps & {
    width?: "auto" | "full";
    wrap?: boolean;
  }): React.ReactElement {
  const single = !multiple;
  const resolvedSize = useResolvedControlSize(size);

  return (
    <ToggleGroupPrimitive
      // The items' gap is the kit's, 2 px in a default group and the 4 px of
      // a Toolbar's items inside a Toolbar (design-rework.css).
      className={cn(
        slotClass("toggle-group", props),
        "flex",
        width === "full" ? "w-full" : "w-fit",
        wrap && "flex-wrap",
        orientation === "vertical" && "flex-col",
        className,
      )}
      data-size={resolvedSize}
      data-slot="toggle-group"
      data-variant={variant}
      // An outline group that wraps draws the edges of its rows
      // (design-rework.css, "A wrapping outline ToggleGroup").
      data-wrap={wrap ? "" : undefined}
      multiple={multiple}
      orientation={orientation}
      {...props}
    >
      <ToggleGroupContext.Provider
        value={{ single, size: resolvedSize, variant }}
      >
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  );
}

export function ToggleGroupItem({
  className,
  children,
  grow = false,
  maxWidth,
  padding = "default",
  ...props
}: WithStringClassName<TogglePrimitive.Props> & {
  grow?: boolean;
  maxWidth?: "label";
  /** `icon` is for an item that is one icon. */
  padding?: "default" | "icon";
}): React.ReactElement {
  const context = React.useContext(ToggleGroupContext);

  return (
    <KitToggle
      className={cn(
        grow && "flex-1",
        maxWidth === "label" && "max-w-40",
        className,
      )}
      data-grow={grow ? "" : undefined}
      data-size={context.size}
      data-variant={context.variant}
      padding={padding}
      profile="group"
      size={context.size}
      variant={context.variant}
      {...props}
    >
      {maxWidth === "label" ? (
        <span className="block min-w-0 max-w-full truncate">{children}</span>
      ) : (
        children
      )}
    </KitToggle>
  );
}

export function ToggleGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: {
  className?: string;
} & React.ComponentProps<typeof Separator>): React.ReactElement {
  return (
    <KitSeparator
      className={className}
      orientation={orientation}
      profile="toggle-group"
      {...props}
    />
  );
}

export { ToggleGroupPrimitive };
