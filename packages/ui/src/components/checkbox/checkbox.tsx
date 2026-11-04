"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { cva } from "class-variance-authority";
import * as React from "react";

import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import {
  ChoiceMenuItemContent,
  choiceIndicatorPosition,
  choiceMenuItemClassName,
  choiceMenuItemGridClassNames,
} from "../../system/styles/choice-menu-item";
import { CheckboxGlyph } from "../../system/styles/checkbox-glyph";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { baseClass, slotClass } from "../../system/utils/slot-class";
import type { KitCheckboxProps } from "./checkbox-internal";

import "./checkbox.css";

// The look and the size come from checkbox.css through the attributes the
// Checkbox renders (data-size), so the helper takes no size.
export const checkboxVariants = cva(
  "sp-checkbox-motion relative inline-flex shrink-0 cursor-pointer items-center justify-center before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] data-disabled:cursor-not-allowed",
);

export const CheckboxSizeContext =
  React.createContext<SiteplaneControlSize | null>(null);

export interface CheckboxProps extends Omit<
  WithStringClassName<CheckboxPrimitive.Root.Props>,
  "size"
> {
  size?: SiteplaneControlSize;
}

export function Checkbox(checkboxProps: CheckboxProps): React.ReactElement {
  // Menu and drawer rows pass the internal menu-item profile through
  // KitCheckbox (checkbox-internal.ts), the same function.
  const {
    children,
    className,
    profile = "control",
    size,
    ...props
  } = checkboxProps as KitCheckboxProps;
  const groupSize = React.useContext(CheckboxSizeContext);
  const resolvedSize = useResolvedControlSize(size ?? groupSize);
  // A menu row ends with its check, as the Menu's check rows do (I8).
  const position =
    profile === "menu-item" ? choiceIndicatorPosition(undefined) : undefined;

  return (
    <CheckboxPrimitive.Root
      className={cn(
        slotClass("checkbox", props),
        baseClass("checkbox", props),
        position
          ? cn(choiceMenuItemClassName, choiceMenuItemGridClassNames[position])
          : checkboxVariants(),
        className,
      )}
      data-foundation="checkbox"
      data-indicator-position={position}
      data-profile={profile}
      data-size={resolvedSize}
      data-slot="checkbox"
      {...props}
    >
      {position ? (
        <ChoiceMenuItemContent
          indicator={CheckboxPrimitive.Indicator}
          indicatorClassName="sp-checkbox-indicator"
          indicatorSlot="checkbox-indicator"
          position={position}
        >
          {children}
        </ChoiceMenuItemContent>
      ) : (
        <CheckboxPrimitive.Indicator
          className="sp-checkbox-indicator pointer-events-none absolute flex items-center justify-center"
          data-slot="checkbox-indicator"
          render={(props: React.ComponentProps<"span">) => (
            <span {...props}>
              <CheckboxGlyph size={resolvedSize} />
            </span>
          )}
        />
      )}
    </CheckboxPrimitive.Root>
  );
}

export { CheckboxPrimitive };
