"use client";

import { NumberField as NumberFieldPrimitive } from "@base-ui/react/number-field";
import { MinusIcon, PlusIcon } from "lucide-react";
import * as React from "react";

import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import {
  formControlSurfaceClassNames,
  formControlTextClassNames,
  type FormControlSurface,
  type FormControlTextSize,
  surfaceClassNames,
} from "../../system/styles/surface";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { KitButton } from "../button/button-internal";
import { Label } from "../label";

import "./number-field.css";

export const NumberFieldContext: React.Context<{
  fieldId: string;
  size: SiteplaneControlSize;
  textSize?: FormControlTextSize | undefined;
  variant: FormControlSurface;
} | null> = React.createContext<{
  fieldId: string;
  size: SiteplaneControlSize;
  textSize?: FormControlTextSize | undefined;
  variant: FormControlSurface;
} | null>(null);

export function NumberField({
  id,
  className,
  emphasized = false,
  size,
  textSize,
  variant = "default",
  ...props
}: WithStringClassName<NumberFieldPrimitive.Root.Props> & {
  /** A semibold value one text step larger, for a number that is the content. */
  emphasized?: boolean | undefined;
  size?: SiteplaneControlSize | undefined;
  textSize?: FormControlTextSize | undefined;
  variant?: FormControlSurface | undefined;
}): React.ReactElement {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const resolvedSize = useResolvedControlSize(size);
  // The value follows the field text scale, as Input does: 14 px from sm to
  // lg and 16 px at xl. textSize="base" sets 16 px at every size.
  // An emphasized value is one step larger and semibold: 16 px at sm, 18 px
  // at md and lg and 20 px at xl, whatever the textSize (design-rework.css).
  const resolvedTextSize =
    textSize ?? (resolvedSize === "xl" ? "base" : undefined);

  return (
    <NumberFieldContext.Provider
      value={{
        fieldId,
        size: resolvedSize,
        textSize: resolvedTextSize,
        variant,
      }}
    >
      <NumberFieldPrimitive.Root
        className={cn(
          // Compact by default; number-field.css derives the width from the
          // control size. A width utility in className replaces it.
          "flex w-(--number-field-width) max-w-full flex-col items-start gap-2",
          className,
        )}
        data-emphasized={emphasized || undefined}
        data-size={resolvedSize}
        data-slot="number-field"
        data-text-size={resolvedTextSize}
        data-variant={variant}
        id={fieldId}
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
        surfaceClassNames.formControl,
        formControlSurfaceClassNames[context?.variant ?? "default"],
        "justify-between [&_svg]:pointer-events-none [&_svg]:shrink-0",
        context?.textSize && formControlTextClassNames[context.textSize],
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
  const context = React.useContext(NumberFieldContext);
  return (
    <NumberFieldPrimitive.Decrement
      className={className}
      data-profile="joined-start"
      data-slot="number-field-decrement"
      render={
        render ?? (
          <KitButton
            profile="joined-start"
            shape="square"
            size={context?.size}
            variant="ghost"
          />
        )
      }
      {...props}
    >
      <MinusIcon />
    </NumberFieldPrimitive.Decrement>
  );
}

export function NumberFieldIncrement({
  className,
  render,
  ...props
}: WithStringClassName<NumberFieldPrimitive.Increment.Props>): React.ReactElement {
  const context = React.useContext(NumberFieldContext);
  return (
    <NumberFieldPrimitive.Increment
      className={className}
      data-profile="joined-end"
      data-slot="number-field-increment"
      render={
        render ?? (
          <KitButton
            profile="joined-end"
            shape="square"
            size={context?.size}
            variant="ghost"
          />
        )
      }
      {...props}
    >
      <PlusIcon />
    </NumberFieldPrimitive.Increment>
  );
}

export function NumberFieldInput({
  className,
  ...props
}: WithStringClassName<NumberFieldPrimitive.Input.Props>): React.ReactElement {
  return (
    <NumberFieldPrimitive.Input
      className={cn(
        "w-full min-w-0 grow bg-transparent in-data-[size=sm]:px-[calc(--spacing(2.5)-1px)] in-data-[size=xl]:px-[calc(--spacing(4)-1px)] px-[calc(--spacing(3)-1px)] text-center tabular-nums leading-7 in-data-[size=sm]:leading-6 outline-none",
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
        "flex cursor-ew-resize data-disabled:cursor-not-allowed",
        className,
      )}
      data-slot="number-field-scrub-area"
      {...props}
    >
      {/* The label takes the scrub area's cursor and fades with a disabled
          field (design-rework.css, the shared label rules). */}
      <Label className="cursor-[inherit]" htmlFor={context.fieldId}>
        {label}
      </Label>
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
