"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import type React from "react";

import { SiteplaneUIPortalScope } from "../../system/provider/siteplane-ui-provider";
import { surfaceClassNames } from "../../system/styles/surface";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";

export const TooltipCreateHandle: typeof TooltipPrimitive.createHandle =
  TooltipPrimitive.createHandle;

export function TooltipProvider({
  delay = 700,
  timeout = 550,
  ...props
}: TooltipPrimitive.Provider.Props): React.ReactElement {
  return (
    <TooltipPrimitive.Provider delay={delay} timeout={timeout} {...props} />
  );
}

export const Tooltip: typeof TooltipPrimitive.Root = TooltipPrimitive.Root;

/** How far the arrow reaches out of the popup: --sp-rw-space-1, in px. */
const TOOLTIP_ARROW_DEPTH = 4;

export function TooltipTrigger(
  props: WithStringClassName<TooltipPrimitive.Trigger.Props>,
): React.ReactElement {
  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      {...props}
      className={cn(slotClass("tooltip-trigger", props), props.className)}
    />
  );
}

export type TooltipTone = "neutral" | "error";
/**
 * @deprecated The earlier names of the two tones: `default` is `neutral` and
 * `destructive` is `error`.
 */
export type TooltipDeprecatedTone = "default" | "destructive";

export function TooltipPopup({
  className,
  align = "center",
  sideOffset = 4,
  side = "top",
  anchor,
  disableAnchorTracking,
  arrow = false,
  children,
  interactive = true,
  portalProps,
  tone = "neutral",
  variant = "default",
  ...props
}: WithStringClassName<TooltipPrimitive.Popup.Props> & {
  align?: TooltipPrimitive.Positioner.Props["align"];
  side?: TooltipPrimitive.Positioner.Props["side"];
  sideOffset?: TooltipPrimitive.Positioner.Props["sideOffset"];
  anchor?: TooltipPrimitive.Positioner.Props["anchor"];
  /**
   * Stops the popup from watching its anchor and itself for changes of size
   * and place. For an anchor that its owner moves and hands over again at
   * every frame, such as the card of a chart that trails its item, which
   * would otherwise set the watching up anew at every frame.
   */
  disableAnchorTracking?: TooltipPrimitive.Positioner.Props["disableAnchorTracking"];
  /**
   * Points an arrow at the anchor. The arrow reaches into the side offset,
   * so the gap between the arrow's tip and the anchor stays `sideOffset`.
   */
  arrow?: boolean;
  /**
   * `false` lets the pointer pass through the popup, for a bubble that only
   * reports, such as a field's error.
   */
  interactive?: boolean;
  portalProps?: WithStringClassName<TooltipPrimitive.Portal.Props>;
  /**
   * `error` fills the popup with the solid destructive colour of the Badge's
   * destructive variant, for an error; `neutral`, the default, keeps the
   * secondary surface. `default` and `destructive` are the deprecated earlier
   * names of `neutral` and `error`.
   */
  tone?: TooltipTone | TooltipDeprecatedTone;
  /**
   * `glass` lays the shared glass surface over whatever sits behind the
   * tooltip. `tone` applies to the default surface only.
   */
  variant?: "default" | "glass";
}): React.ReactElement {
  return (
    <TooltipPrimitive.Portal {...portalProps}>
      <SiteplaneUIPortalScope>
        <TooltipPrimitive.Positioner
          align={align}
          anchor={anchor}
          disableAnchorTracking={disableAnchorTracking}
          className={cn(
            "sp-tooltip-positioner",
            "z-50 max-w-(--available-width)",
            // The positioner is as large as the popup was when it opened: Base
            // UI measures it then and sets `--positioner-width` and
            // `--positioner-height`, which fix its size, and it glides when its
            // place changes. A popup with an anchor of its own is placed by
            // whoever supplies it: the anchor moves frame by frame and the
            // content may change in place (the card of a chart that trails its
            // item, with rows and rolling digits). So its positioner neither
            // transitions nor holds a measured size, which the content would
            // outgrow and lose its padding to: it is as large as its content.
            anchor === undefined
              ? "h-(--positioner-height) w-(--positioner-width) transition-[top,left,right,bottom,transform] duration-(--motion-duration-fast) ease-(--motion-ease-state) data-instant:transition-none"
              : "h-max w-max",
            !interactive && "pointer-events-none",
          )}
          data-slot="tooltip-positioner"
          side={side}
          sideOffset={
            arrow && typeof sideOffset === "number"
              ? sideOffset + TOOLTIP_ARROW_DEPTH
              : sideOffset
          }
        >
          <TooltipPrimitive.Popup
            className={cn(
              slotClass("tooltip-popup", props),
              "sp-floating-panel relative flex h-(--popup-height,auto) w-(--popup-width,auto) origin-(--transform-origin) text-balance before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] data-instant:duration-0",
              // Glass takes the glass surface in place of the opaque one, whose
              // fill, text colour and shadow the glass rule draws.
              variant === "glass" && surfaceClassNames.glass,
              !interactive && "pointer-events-none",
              className,
            )}
            data-slot="tooltip-popup"
            // Only the error tone paints; glass keeps its own surface.
            data-tone={
              (tone === "error" || tone === "destructive") &&
              variant !== "glass"
                ? "error"
                : undefined
            }
            data-variant={variant === "glass" ? variant : undefined}
            {...props}
          >
            {arrow && (
              <TooltipPrimitive.Arrow
                className="sp-tooltip-arrow"
                data-slot="tooltip-arrow"
              />
            )}
            {/* The cross-fade of the current and the previous content, with
                its width and its reduced-motion rules, is the viewport rule
                it shares with Popover in design-rework.css. */}
            <TooltipPrimitive.Viewport
              className="sp-tooltip-viewport relative size-full overflow-clip data-instant:transition-none **:data-previous:truncate"
              data-slot="tooltip-viewport"
            >
              {children}
            </TooltipPrimitive.Viewport>
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </SiteplaneUIPortalScope>
    </TooltipPrimitive.Portal>
  );
}

// TooltipContent is the shadcn name of TooltipPopup.
export { TooltipPrimitive, TooltipPopup as TooltipContent };
