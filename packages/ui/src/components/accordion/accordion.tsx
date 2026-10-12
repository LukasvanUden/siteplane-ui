"use client";

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ChevronDownIcon } from "lucide-react";
import type React from "react";

import { cn, type WithStringClassName } from "../../system/utils/cn";
import { KitButton } from "../button/button-internal";

export function Accordion(
  props: WithStringClassName<AccordionPrimitive.Root.Props>,
): React.ReactElement {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

export function AccordionItem({
  className,
  ...props
}: WithStringClassName<AccordionPrimitive.Item.Props>): React.ReactElement {
  return (
    <AccordionPrimitive.Item
      className={className}
      data-slot="accordion-item"
      {...props}
    />
  );
}

export function AccordionTrigger({
  className,
  children,
  render,
  ...props
}: WithStringClassName<AccordionPrimitive.Trigger.Props>): React.ReactElement {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          "siteplane-accordion-motion group min-w-0 flex-1",
          className,
        )}
        data-profile="accordion-trigger"
        data-slot="accordion-trigger"
        render={
          render ?? (
            <KitButton
              align="between"
              multiline
              profile="accordion-trigger"
              variant="text"
              width="full"
            />
          )
        }
        {...props}
      >
        <span className="min-w-0 flex-1 wrap-anywhere">{children}</span>
        <ChevronDownIcon
          className="siteplane-accordion-motion pointer-events-none shrink-0"
          data-slot="accordion-indicator"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionPanel({
  className,
  children,
  ...props
}: WithStringClassName<AccordionPrimitive.Panel.Props>): React.ReactElement {
  return (
    <AccordionPrimitive.Panel
      className={cn(
        "siteplane-accordion-motion h-(--accordion-panel-height) overflow-hidden data-ending-style:h-0 data-starting-style:h-0",
        className,
      )}
      data-slot="accordion-panel"
      {...props}
    >
      <div>{children}</div>
    </AccordionPrimitive.Panel>
  );
}

export { AccordionPrimitive, AccordionPanel as AccordionContent };
