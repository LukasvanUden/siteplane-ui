"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { cva } from "class-variance-authority";
import * as React from "react";

import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import {
  ChoiceMenuItemCheck,
  choiceMenuItemCheckGridClassName,
  choiceMenuItemClassName,
  choiceMenuItemLabelClassName,
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

  return (
    <CheckboxPrimitive.Root
      className={cn(
        slotClass("checkbox", props),
        baseClass("checkbox", props),
        profile === "menu-item"
          ? cn(choiceMenuItemClassName, choiceMenuItemCheckGridClassName)
          : checkboxVariants(),
        className,
      )}
      data-foundation="checkbox"
      data-profile={profile}
      data-size={resolvedSize}
      data-slot="checkbox"
      {...props}
    >
      {profile === "menu-item" ? (
        <>
          <CheckboxPrimitive.Indicator
            className="sp-checkbox-indicator col-start-1"
            data-slot="checkbox-indicator"
            keepMounted
          >
            <ChoiceMenuItemCheck />
          </CheckboxPrimitive.Indicator>
          <span className={choiceMenuItemLabelClassName}>{children}</span>
        </>
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
