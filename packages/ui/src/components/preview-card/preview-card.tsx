"use client";

import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card";
import type React from "react";
import { SiteplaneUIPortalScope } from "../../system/provider/siteplane-ui-provider";
import { surfaceClassNames } from "../../system/styles/surface";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
export const PreviewCard: typeof PreviewCardPrimitive.Root =
  PreviewCardPrimitive.Root;
export function PreviewCardTrigger(
  props: WithStringClassName<PreviewCardPrimitive.Trigger.Props>,
): React.ReactElement {
  return (
    <PreviewCardPrimitive.Trigger
      data-slot="preview-card-trigger"
      {...props}
      className={cn(slotClass("preview-card-trigger", props), props.className)}
    />
  );
}
export function PreviewCardPopup({
  className,
  children,
  side = "bottom",
  align = "center",
  sideOffset = 4,
  alignOffset = 0,
  anchor,
  portalProps,
  ...props
}: WithStringClassName<PreviewCardPrimitive.Popup.Props> & {
  side?: PreviewCardPrimitive.Positioner.Props["side"];
  align?: PreviewCardPrimitive.Positioner.Props["align"];
  sideOffset?: PreviewCardPrimitive.Positioner.Props["sideOffset"];
  alignOffset?: PreviewCardPrimitive.Positioner.Props["alignOffset"];
  anchor?: PreviewCardPrimitive.Positioner.Props["anchor"];
  portalProps?: WithStringClassName<PreviewCardPrimitive.Portal.Props>;
}) {
  return (
    <PreviewCardPrimitive.Portal {...portalProps}>
      <SiteplaneUIPortalScope>
        <PreviewCardPrimitive.Positioner
          align={align}
          alignOffset={alignOffset}
          anchor={anchor}
          className="sp-preview-card-positioner z-50"
          data-slot="preview-card-positioner"
          side={side}
          sideOffset={sideOffset}
        >
          <PreviewCardPrimitive.Popup
            className={cn(
              slotClass("preview-card-popup", props),
              surfaceClassNames.floatingOverlay,
              "flex w-64 origin-(--transform-origin) text-balance rounded-lg p-4 text-sm before:rounded-[inherit]",
              className,
            )}
            data-slot="preview-card-popup"
            {...props}
          >
            {children}
          </PreviewCardPrimitive.Popup>
        </PreviewCardPrimitive.Positioner>
      </SiteplaneUIPortalScope>
    </PreviewCardPrimitive.Portal>
  );
}
export { PreviewCardPrimitive };
