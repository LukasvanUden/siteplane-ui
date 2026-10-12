"use client";

import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";
import type React from "react";

import { cn, type WithStringClassName } from "../../system/utils/cn";

import "./scroll-area.css";

export function ScrollArea({
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  className,
  children,
  scrollFade = false,
  scrollbar = "auto",
  scrollbarGutter = false,
  fill = false,
  clampContentMinWidth = true,
  ...props
}: WithStringClassName<ScrollAreaPrimitive.Root.Props> & {
  scrollFade?: boolean;
  scrollbar?: "auto" | "hidden";
  scrollbarGutter?: boolean;
  fill?: boolean;
  clampContentMinWidth?: boolean;
}): React.ReactElement {
  // The root is presentational; the viewport is what joins the tab order, so
  // it carries the accessible name as a labelled region.
  const viewportLabelProps =
    ariaLabel || ariaLabelledBy
      ? {
          "aria-label": ariaLabel,
          "aria-labelledby": ariaLabelledBy,
          role: "region",
        }
      : undefined;

  // The root fills its container (design-rework.css); a size utility or a
  // consumer's own rule replaces either dimension. A keyboard-focused viewport
  // draws the kit focus outline on the root (design-rework.css), where the
  // scroll fade's mask cannot clip it.
  return (
    <ScrollAreaPrimitive.Root
      className={className}
      data-foundation="scroll-area"
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        {...viewportLabelProps}
        className={cn(
          "h-full rounded-[inherit] outline-none data-has-overflow-y:overscroll-y-contain data-has-overflow-x:overscroll-x-contain",
          scrollFade &&
            "mask-t-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-y-start)))] mask-b-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-y-end)))] mask-l-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-x-start)))] mask-r-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-x-end)))] [--fade-size:1.5rem]",
          scrollbarGutter &&
            "data-has-overflow-y:pe-2.5 data-has-overflow-x:pb-2.5",
        )}
        data-slot="scroll-area-viewport"
      >
        <ScrollAreaPrimitive.Content
          className={cn(fill && "size-full")}
          data-slot="scroll-area-content"
          style={clampContentMinWidth ? { minWidth: 0 } : undefined}
        >
          {children}
        </ScrollAreaPrimitive.Content>
      </ScrollAreaPrimitive.Viewport>
      {scrollbar === "auto" ? (
        <>
          <ScrollBar orientation="vertical" />
          <ScrollBar orientation="horizontal" />
        </>
      ) : null}
      <ScrollAreaPrimitive.Corner data-slot="scroll-area-corner" />
    </ScrollAreaPrimitive.Root>
  );
}

export function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: WithStringClassName<ScrollAreaPrimitive.Scrollbar.Props>): React.ReactElement {
  return (
    <ScrollAreaPrimitive.Scrollbar
      className={cn(
        "siteplane-scroll-area-scrollbar-motion m-1 flex opacity-0 data-[orientation=horizontal]:h-1.5 data-[orientation=vertical]:w-1.5 data-[orientation=horizontal]:flex-col data-hovering:opacity-100 data-scrolling:opacity-100",
        className,
      )}
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        className="relative flex-1 rounded-full bg-foreground/20"
        data-slot="scroll-area-thumb"
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

export { ScrollAreaPrimitive };
