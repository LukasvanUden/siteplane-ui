"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { useRender } from "@base-ui/react/use-render";
import type React from "react";
import { usePopoverFlipMotion } from "./popover-motion";
import { SiteplaneUIPortalScope } from "../../system/provider/siteplane-ui-provider";

import { surfaceClassNames } from "../../system/styles/surface";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { baseClass, slotClass } from "../../system/utils/slot-class";
import { CloseButton } from "../button";

export const PopoverCreateHandle: typeof PopoverPrimitive.createHandle =
  PopoverPrimitive.createHandle;

export const Popover: typeof PopoverPrimitive.Root = PopoverPrimitive.Root;

export function PopoverTrigger({
  className,
  children,
  ...props
}: WithStringClassName<PopoverPrimitive.Trigger.Props>): React.ReactElement {
  return (
    <PopoverPrimitive.Trigger
      className={cn(slotClass("popover-trigger", props), className)}
      data-slot="popover-trigger"
      {...props}
    >
      {children}
    </PopoverPrimitive.Trigger>
  );
}

export function PopoverPopup({
  children,
  className,
  side = "bottom",
  align = "start",
  sideOffset = 4,
  alignOffset = 0,
  tooltipStyle = false,
  viewportPadding = "default",
  anchor,
  portalProps,
  showCloseButton = false,
  closeProps,
  variant = "default",
  ...props
}: WithStringClassName<PopoverPrimitive.Popup.Props> & {
  portalProps?: WithStringClassName<PopoverPrimitive.Portal.Props>;
  side?: PopoverPrimitive.Positioner.Props["side"];
  align?: PopoverPrimitive.Positioner.Props["align"];
  sideOffset?: PopoverPrimitive.Positioner.Props["sideOffset"];
  alignOffset?: PopoverPrimitive.Positioner.Props["alignOffset"];
  tooltipStyle?: boolean;
  viewportPadding?: "compact" | "default";
  anchor?: PopoverPrimitive.Positioner.Props["anchor"];
  /**
   * Shows a close button in the top-end corner, as Dialog, Sheet and Drawer
   * do: the CloseButton at its dense 24 px step, 8 px inside the corner. The
   * first block of the content keeps 8 px clear of it.
   */
  showCloseButton?: boolean;
  closeProps?: WithStringClassName<PopoverPrimitive.Close.Props>;
  /** `glass` lays the shared glass surface over whatever sits behind the popover. */
  variant?: "default" | "glass";
}): React.ReactElement {
  const positionerRef = usePopoverFlipMotion();

  return (
    <PopoverPrimitive.Portal {...portalProps}>
      <SiteplaneUIPortalScope>
        <PopoverPrimitive.Positioner
          align={align}
          alignOffset={alignOffset}
          anchor={anchor}
          className="sp-popover-positioner z-50 h-(--positioner-height) w-(--positioner-width) max-w-(--available-width)"
          data-slot="popover-positioner"
          ref={positionerRef}
          side={side}
          sideOffset={sideOffset}
        >
          <PopoverPrimitive.Popup
            className={cn(
              // Glass keeps the frame and takes the glass surface in place of
              // the opaque one, whose fill, edge and shadow the glass rule draws.
              slotClass("popover-popup", props),
              baseClass("popover", props),
              surfaceClassNames.floatingOverlayFrame,
              variant === "glass"
                ? surfaceClassNames.glass
                : surfaceClassNames.floatingOverlaySurface,
              "flex h-(--popup-height,auto) outline-none before:rounded-[inherit] has-data-[slot=calendar]:before:rounded-[inherit]",
              tooltipStyle && "text-balance before:rounded-[inherit]",
              className,
            )}
            data-foundation="popover"
            data-slot="popover-popup"
            data-tooltip-style={tooltipStyle ? "" : undefined}
            data-variant={variant === "glass" ? variant : undefined}
            {...props}
          >
            <PopoverPrimitive.Viewport
              className={cn(
                // The cross-fade of the current and the previous content is
                // the popover viewport rule in design-rework.css.
                "sp-popover-viewport",
                "relative size-full max-h-(--available-height) overflow-clip px-(--viewport-inline-padding) data-instant:transition-none",
                tooltipStyle ? "" : "not-data-transitioning:overflow-y-auto",
                // The first block sits beside the corner close button and ends
                // 8 px before it, 40 px from the edge, the viewport's own
                // padding included.
                showCloseButton &&
                  "[&>:is([data-current],[data-previous])>:first-child]:pe-[calc(--spacing(10)-var(--viewport-inline-padding))]",
              )}
              data-padding={viewportPadding}
              data-slot="popover-viewport"
            >
              {children}
            </PopoverPrimitive.Viewport>
            {showCloseButton && (
              // The CloseButton at its dense 24 px step, 8 px inside the
              // top-end corner, as the close of every overlay; it names itself.
              <PopoverClose
                className="absolute end-2 top-2"
                render={<CloseButton size="2xs" />}
                {...closeProps}
              />
            )}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </SiteplaneUIPortalScope>
    </PopoverPrimitive.Portal>
  );
}

export function PopoverClose({
  ...props
}: WithStringClassName<PopoverPrimitive.Close.Props>): React.ReactElement {
  return (
    <PopoverPrimitive.Close
      data-slot="popover-close"
      {...props}
      className={cn(slotClass("popover-close", props), props.className)}
    />
  );
}

/**
 * The header of a popover: its title over its description, 4 px apart, as in
 * the header of a Dialog, a Sheet or a Drawer (design-rework.css). The space
 * to the content after it, such as a form, is the content's.
 */
export function PopoverHeader({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn(
      slotClass("popover-header", props, render),
      "flex flex-col",
      className,
    ),
    "data-slot": "popover-header",
  };
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function PopoverTitle({
  className,
  ...props
}: WithStringClassName<PopoverPrimitive.Title.Props>): React.ReactElement {
  return (
    <PopoverPrimitive.Title
      className={cn(slotClass("popover-title", props), className)}
      data-slot="popover-title"
      {...props}
    />
  );
}

export function PopoverDescription({
  className,
  ...props
}: WithStringClassName<PopoverPrimitive.Description.Props>): React.ReactElement {
  return (
    <PopoverPrimitive.Description
      className={cn(
        slotClass("popover-description", props),
        "wrap-anywhere",
        className,
      )}
      data-slot="popover-description"
      {...props}
    />
  );
}

// PopoverContent is an alias of PopoverPopup.
export { PopoverPrimitive, PopoverPopup as PopoverContent };
