"use client";

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import type React from "react";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { KitButton } from "../button/button-internal";

export function Collapsible(
  props: WithStringClassName<CollapsiblePrimitive.Root.Props>,
): React.ReactElement {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}
export function CollapsibleTrigger({
  className,
  render,
  ...props
}: WithStringClassName<CollapsiblePrimitive.Trigger.Props>): React.ReactElement {
  return (
    // A long unbroken label (a URL, an email) wraps instead of overflowing
    // the trigger (rulebook K5).
    <CollapsiblePrimitive.Trigger
      className={cn("siteplane-collapsible-motion wrap-anywhere", className)}
      data-profile="collapsible-trigger"
      data-slot="collapsible-trigger"
      render={
        render ?? (
          <KitButton
            align="between"
            multiline
            profile="collapsible-trigger"
            variant="text"
            width="full"
          />
        )
      }
      {...props}
    />
  );
}
export function CollapsiblePanel({
  className,
  ...props
}: WithStringClassName<CollapsiblePrimitive.Panel.Props>): React.ReactElement {
  return (
    <CollapsiblePrimitive.Panel
      className={cn(
        "siteplane-collapsible-motion h-(--collapsible-panel-height) overflow-hidden data-ending-style:h-0 data-starting-style:h-0",
        className,
      )}
      data-slot="collapsible-panel"
      {...props}
    />
  );
}
export { CollapsiblePrimitive, CollapsiblePanel as CollapsibleContent };
