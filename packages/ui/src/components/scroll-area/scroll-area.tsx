"use client";

import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";
import type React from "react";

import { cn, type WithStringClassName } from "../../system/utils/cn";
import { baseClass, slotClass } from "../../system/utils/slot-class";

import "./scroll-area.css";

export type ScrollAreaProps =
  WithStringClassName<ScrollAreaPrimitive.Root.Props> & {
    scrollFade?: boolean;
    scrollbar?: "auto" | "hidden";
    scrollbarGutter?: boolean;
    fill?: boolean;
    clampContentMinWidth?: boolean;
    /**
     * The ref of the viewport, the element that scrolls (slot
     * `scroll-area-viewport`). `ref` goes to the root, which does not scroll.
     * A component that follows or moves the scroll position, such as the
     * Message Scroller, reads `scrollTop` and listens for `scroll` there.
     */
    viewportRef?: React.Ref<HTMLDivElement> | undefined;
  };

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
  viewportRef,
  ...props
}: ScrollAreaProps): React.ReactElement {
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
      className={cn(baseClass("scroll-area", props), className)}
      data-foundation="scroll-area"
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        {...viewportLabelProps}
        ref={viewportRef}
        className={cn(
          "sp-scroll-area-viewport",
          "h-full rounded-[inherit] outline-none data-has-overflow-y:overscroll-y-contain data-has-overflow-x:overscroll-x-contain",
          scrollFade &&
            "mask-t-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-y-start)))] mask-b-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-y-end)))] mask-l-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-x-start)))] mask-r-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-x-end)))] [--fade-size:1.5rem]",
          scrollbarGutter &&
            "data-has-overflow-y:pe-2.5 data-has-overflow-x:pb-2.5",
        )}
        data-slot="scroll-area-viewport"
      >
        <ScrollAreaPrimitive.Content
          className={cn("sp-scroll-area-content", fill && "size-full")}
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
      <ScrollAreaPrimitive.Corner
        className="sp-scroll-area-corner"
        data-slot="scroll-area-corner"
      />
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
        slotClass("scroll-area-scrollbar", props),
        "sp-scroll-area-scrollbar-motion m-1 flex opacity-0 data-[orientation=horizontal]:h-1.5 data-[orientation=vertical]:w-1.5 data-[orientation=horizontal]:flex-col data-hovering:opacity-100 data-scrolling:opacity-100",
        className,
      )}
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        className="sp-scroll-area-thumb relative flex-1 rounded-full bg-foreground/20"
        data-slot="scroll-area-thumb"
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

export { ScrollAreaPrimitive };
