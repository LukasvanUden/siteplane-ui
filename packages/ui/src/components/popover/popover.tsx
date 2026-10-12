"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { XIcon } from "lucide-react";
import type React from "react";
import { usePopoverFlipMotion } from "./popover-motion";
import { SiteplaneUIPortalScope } from "../../system/provider/siteplane-ui-provider";

import { surfaceClassNames } from "../../system/styles/surface";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { KitButton } from "../button/button-internal";

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
      className={className}
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
   * do: the 24 px overlay-dismiss Button 8 px inside the corner. The first
   * block of the content keeps 8 px clear of it.
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
          className="z-50 h-(--positioner-height) w-(--positioner-width) max-w-(--available-width)"
          data-slot="popover-positioner"
          ref={positionerRef}
          side={side}
          sideOffset={sideOffset}
        >
          <PopoverPrimitive.Popup
            className={cn(
              // Glass keeps the frame and takes the glass surface in place of
              // the opaque one, whose fill, edge and shadow the glass rule draws.
              surfaceClassNames.floatingOverlayFrame,
              variant === "glass"
                ? surfaceClassNames.glass
                : surfaceClassNames.floatingOverlaySurface,
              "flex h-(--popup-height,auto) outline-none before:rounded-[inherit] has-data-[slot=calendar]:before:rounded-[inherit]",
              tooltipStyle && "w-fit text-balance before:rounded-[inherit]",
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
              <PopoverClose
                aria-label="Close"
                className="absolute end-2 top-2"
                render={
                  <KitButton
                    profile="overlay-dismiss"
                    shape="square"
                    variant="ghost"
                  />
                }
                {...closeProps}
              >
                <XIcon />
              </PopoverClose>
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
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />;
}

export function PopoverTitle({
  className,
  ...props
}: WithStringClassName<PopoverPrimitive.Title.Props>): React.ReactElement {
  return (
    <PopoverPrimitive.Title
      className={className}
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
        "wrap-anywhere [[data-slot=popover-viewport]>[data-current]>[data-slot=popover-title]+&]:mt-1",
        className,
      )}
      data-slot="popover-description"
      {...props}
    />
  );
}

// PopoverContent is the shadcn name of PopoverPopup.
export { PopoverPrimitive, PopoverPopup as PopoverContent };
