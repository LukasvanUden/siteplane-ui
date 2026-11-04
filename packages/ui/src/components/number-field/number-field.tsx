"use client";

import { NumberField as NumberFieldPrimitive } from "@base-ui/react/number-field";
import {
  CaretDownIcon,
  CaretUpIcon,
  MinusIcon,
  PlusIcon,
} from "@phosphor-icons/react/dist/ssr";
import * as React from "react";

import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import {
  type FormControlSurface,
  type FormControlTextSize,
  surfaceClassNames,
} from "../../system/styles/surface";
import {
  useFormatLocale,
  useSiteplaneMessages,
} from "../../system/locale/messages-context";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { KitButton } from "../button/button-internal";
import { Label } from "../label";

import "./number-field.css";

/**
 * Where the step buttons sit: `split` puts the decrement at the start of the
 * group and the increment at its end; `stacked` puts them in a column at the
 * end, the increment above the decrement.
 */
export type NumberFieldSteppers = "split" | "stacked";

export const NumberFieldContext: React.Context<{
  fieldId: string;
  size: SiteplaneControlSize;
  steppers?: NumberFieldSteppers | undefined;
  variant: FormControlSurface;
} | null> = React.createContext<{
  fieldId: string;
  size: SiteplaneControlSize;
  steppers?: NumberFieldSteppers | undefined;
  variant: FormControlSurface;
} | null>(null);

export function NumberField({
  id,
  className,
  emphasized = false,
  size,
  steppers = "split",
  textSize,
  variant = "default",
  width = "full",
  locale: localeProp,
  ...props
}: WithStringClassName<NumberFieldPrimitive.Root.Props> & {
  /** A semibold value one text step larger, for a number that is the content. */
  emphasized?: boolean | undefined;
  size?: SiteplaneControlSize | undefined;
  /**
   * `stacked` puts the step buttons in a column at the end of the group, with
   * chevrons, and starts the value at the start of the field.
   */
  steppers?: NumberFieldSteppers | undefined;
  textSize?: FormControlTextSize | undefined;
  variant?: FormControlSurface | undefined;
  /**
   * `full` fills the container, like Input. `fit` keeps the compact width of
   * the steppers and a 7rem value field, room for an amount such as $1,250.00.
   */
  width?: "fit" | "full" | undefined;
}): React.ReactElement {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  // Its own locale, else the provider's; without either, Base UI's default.
  const locale = useFormatLocale(localeProp, undefined);
  // The field is on the field scale of its size (design-rework.css): its
  // height, the value's padding and text follow it, as Input's do, 14 px at
  // sm and 16 px from md; textSize sets one text at every size. An emphasized
  // value is one step larger and semibold: 16 px at sm, 18 px at md and lg and
  // 20 px at xl, whatever the textSize.
  const resolvedSize = useResolvedControlSize(size);

  return (
    <NumberFieldContext.Provider
      value={{
        fieldId,
        size: resolvedSize,
        steppers,
        variant,
      }}
    >
      <NumberFieldPrimitive.Root
        className={cn(
          // The field fills its container, like Input; the compact width of
          // width="fit" comes from the control size (number-field.css). A
          // width utility in className replaces either.
          slotClass("number-field", props),
          "sp-field-scale flex max-w-full flex-col items-start gap-1.5",
          width === "fit" ? "w-(--number-field-width)" : "w-full",
          className,
        )}
        data-emphasized={emphasized || undefined}
        data-size={resolvedSize}
        data-slot="number-field"
        data-steppers={steppers === "stacked" ? steppers : undefined}
        data-text-size={textSize}
        data-variant={variant}
        id={fieldId}
        locale={locale}
        {...props}
      />
    </NumberFieldContext.Provider>
  );
}

export function NumberFieldGroup({
  className,
  ...props
}: WithStringClassName<NumberFieldPrimitive.Group.Props>): React.ReactElement {
  const context = React.useContext(NumberFieldContext);
  return (
    <NumberFieldPrimitive.Group
      className={cn(
        slotClass("number-field-group", props),
        surfaceClassNames.formControl,
        // Stacked steppers share a column at the end: the group is a grid of
        // the value and that column (number-field.css).
        context?.steppers === "stacked" ? "grid" : "justify-between",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      data-slot="number-field-group"
      {...props}
    />
  );
}

export function NumberFieldDecrement({
  className,
  render,
  ...props
}: WithStringClassName<NumberFieldPrimitive.Decrement.Props>): React.ReactElement {
  const messages = useSiteplaneMessages("numberField");
  const context = React.useContext(NumberFieldContext);
  const stacked = context?.steppers === "stacked";
  // A stacked decrement is the lower half of the column at the end of the
  // group: the joined-end profile in its lower mode (design-rework.css). The
  // attributes reach a custom render too, as the profile does.
  const profile = stacked ? "joined-end" : "joined-start";
  return (
    <NumberFieldPrimitive.Decrement
      // Base UI's own name is English; the kit's message replaces it, and an
      // aria-label of the app replaces that.
      aria-label={messages.decrease}
      className={cn(
        slotClass("number-field-decrement", props, render),
        className,
      )}
      data-profile={profile}
      data-profile-mode={stacked ? "lower" : undefined}
      data-slot="number-field-decrement"
      render={
        render ?? (
          <KitButton
            // The steppers are part of the field, which flashes no border
            // when a press ends (Button's flashesBorder).
            data-flash={false}
            profile={profile}
            shape="square"
            size={context?.size}
            variant="ghost"
          />
        )
      }
      {...props}
    >
      {stacked ? (
        <CaretDownIcon aria-hidden="true" />
      ) : (
        <MinusIcon aria-hidden="true" />
      )}
    </NumberFieldPrimitive.Decrement>
  );
}

export function NumberFieldIncrement({
  className,
  render,
  ...props
}: WithStringClassName<NumberFieldPrimitive.Increment.Props>): React.ReactElement {
  const messages = useSiteplaneMessages("numberField");
  const context = React.useContext(NumberFieldContext);
  const stacked = context?.steppers === "stacked";
  return (
    <NumberFieldPrimitive.Increment
      aria-label={messages.increase}
      className={cn(
        slotClass("number-field-increment", props, render),
        className,
      )}
      data-profile="joined-end"
      // The upper half of the stacked column (design-rework.css).
      data-profile-mode={stacked ? "upper" : undefined}
      data-slot="number-field-increment"
      render={
        render ?? (
          <KitButton
            // The steppers are part of the field, which flashes no border
            // when a press ends (Button's flashesBorder).
            data-flash={false}
            profile="joined-end"
            shape="square"
            size={context?.size}
            variant="ghost"
          />
        )
      }
      {...props}
    >
      {stacked ? (
        <CaretUpIcon aria-hidden="true" />
      ) : (
        <PlusIcon aria-hidden="true" />
      )}
    </NumberFieldPrimitive.Increment>
  );
}

export function NumberFieldInput({
  className,
  ...props
}: WithStringClassName<NumberFieldPrimitive.Input.Props>): React.ReactElement {
  const context = React.useContext(NumberFieldContext);
  return (
    <NumberFieldPrimitive.Input
      className={cn(
        slotClass("number-field-input", props),
        // The inline padding of the size is a kit rule (design-rework.css),
        // and the value takes the group's text line. Between split steppers
        // the value is centred; beside stacked ones it starts at the start.
        "w-full min-w-0 grow bg-transparent tabular-nums outline-none",
        context?.steppers === "stacked" ? "text-start" : "text-center",
        className,
      )}
      data-slot="number-field-input"
      {...props}
    />
  );
}

export function NumberFieldScrubArea({
  className,
  label,
  ...props
}: WithStringClassName<NumberFieldPrimitive.ScrubArea.Props> & {
  label: string;
}): React.ReactElement {
  const context = React.useContext(NumberFieldContext);
  if (!context)
    throw new Error(
      "NumberFieldScrubArea must be used within a NumberField component for accessibility.",
    );
  return (
    <NumberFieldPrimitive.ScrubArea
      className={cn(
        slotClass("number-field-scrub-area", props),
        "flex cursor-ew-resize data-disabled:cursor-not-allowed",
        className,
      )}
      data-slot="number-field-scrub-area"
      {...props}
    >
      {/* The label takes the scrub area's cursor and fades with a disabled
          field (design-rework.css, the shared label rules). */}
      <Label htmlFor={context.fieldId}>{label}</Label>
      <NumberFieldPrimitive.ScrubAreaCursor className="drop-shadow-[0_1px_1px_--theme(--color-black/50%)] filter">
        <CursorGrowIcon />
      </NumberFieldPrimitive.ScrubAreaCursor>
    </NumberFieldPrimitive.ScrubArea>
  );
}

export function CursorGrowIcon(
  props: React.ComponentProps<"svg">,
): React.ReactElement {
  return (
    <svg
      aria-hidden="true"
      fill="black"
      height="14"
      stroke="white"
      viewBox="0 0 24 14"
      width="26"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M19.5 5.5L6.49737 5.51844V2L1 6.9999L6.5 12L6.49737 8.5L19.5 8.5V12L25 6.9999L19.5 2V5.5Z" />
    </svg>
  );
}

export { NumberFieldPrimitive };
