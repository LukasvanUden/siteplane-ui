"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { cva } from "class-variance-authority";
import type React from "react";
import { createContext, useContext } from "react";

import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import {
  ChoiceMenuItemCheck,
  choiceMenuItemCheckGridClassName,
  choiceMenuItemClassName,
  choiceMenuItemEndGridClassName,
  choiceMenuItemEndLabelClassName,
  choiceMenuItemLabelClassName,
  menuRowLabel,
} from "../../system/styles/choice-menu-item";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { baseClass, slotClass } from "../../system/utils/slot-class";
import type { KitRadioGroupProps, KitRadioProps } from "./radio-group-internal";

import "./radio-group.css";

// The look and the size come from radio-group.css through the attributes the
// Radio renders (data-size), so the helper takes no size.
export const radioVariants = cva(
  "sp-radio-motion relative inline-flex shrink-0 cursor-pointer items-center justify-center before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] data-disabled:cursor-not-allowed",
);

const radioIndicatorClassName = "absolute flex items-center justify-center";

const RadioSizeContext = createContext<SiteplaneControlSize | null>(null);

export interface RadioGroupProps extends Omit<
  WithStringClassName<RadioGroupPrimitive.Props>,
  "size"
> {
  size?: SiteplaneControlSize;
}

export function RadioGroup(groupProps: RadioGroupProps): React.ReactElement {
  // Menu and drawer rows pass the internal menu-item profile through
  // KitRadioGroup (radio-group-internal.ts), the same function.
  const {
    className,
    profile = "control",
    size,
    ...props
  } = groupProps as KitRadioGroupProps;
  const resolvedSize = useResolvedControlSize(size);

  return (
    <RadioSizeContext.Provider value={resolvedSize}>
      <RadioGroupPrimitive
        className={cn(
          slotClass("radio-group", props),
          baseClass("radio-group", props),
          "flex flex-col",
          // The 8 px default is a utility, so a gap in className replaces it.
          profile === "control" && "gap-2",
          className,
        )}
        data-foundation="radio-group"
        data-profile={profile}
        data-size={resolvedSize}
        data-slot="radio-group"
        {...props}
      />
    </RadioSizeContext.Provider>
  );
}

export interface RadioProps extends Omit<
  WithStringClassName<RadioPrimitive.Root.Props>,
  "size"
> {
  size?: SiteplaneControlSize;
}

export function Radio(radioProps: RadioProps): React.ReactElement {
  // Menu and drawer rows pass the internal menu-item profile through KitRadio
  // (radio-group-internal.ts), the same function.
  const {
    children,
    className,
    indicatorPosition = "start",
    profile = "control",
    size,
    ...props
  } = radioProps as KitRadioProps;
  const groupSize = useContext(RadioSizeContext);
  const resolvedSize = useResolvedControlSize(size ?? groupSize);
  // An identity row of a menu, such as a workspace in a switcher, leads with
  // its logo or avatar and ends with its check, as MenuRadioItem's end rows.
  const end = profile === "menu-item" && indicatorPosition === "end";

  return (
    <RadioPrimitive.Root
      className={cn(
        slotClass("radio", props),
        baseClass("radio", props),
        profile === "menu-item"
          ? cn(
              choiceMenuItemClassName,
              end
                ? choiceMenuItemEndGridClassName
                : choiceMenuItemCheckGridClassName,
            )
          : radioVariants(),
        className,
      )}
      data-foundation="radio"
      data-indicator-position={end ? "end" : undefined}
      data-profile={profile}
      data-size={resolvedSize}
      data-slot="radio"
      {...props}
    >
      {end ? (
        <>
          <span className={choiceMenuItemEndLabelClassName}>
            {menuRowLabel(children)}
          </span>
          <RadioPrimitive.Indicator
            className="sp-radio-indicator col-start-2"
            data-slot="radio-indicator"
            keepMounted
          >
            <ChoiceMenuItemCheck />
          </RadioPrimitive.Indicator>
        </>
      ) : profile === "menu-item" ? (
        <>
          <RadioPrimitive.Indicator
            className="sp-radio-indicator col-start-1"
            data-slot="radio-indicator"
            keepMounted
          >
            <ChoiceMenuItemCheck />
          </RadioPrimitive.Indicator>
          <span className={choiceMenuItemLabelClassName}>{children}</span>
        </>
      ) : (
        <RadioPrimitive.Indicator
          className={cn("sp-radio-indicator", radioIndicatorClassName)}
          data-slot="radio-indicator"
          keepMounted
        />
      )}
    </RadioPrimitive.Root>
  );
}

export { RadioGroupPrimitive, RadioPrimitive };
