"use client";

import { OTPField as BaseOTPField } from "@base-ui/react/otp-field";
import { Separator as BaseSeparator } from "@base-ui/react/separator";
import * as React from "react";

import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import {
  formControlSurfaceClassNames,
  type FormControlSurface,
  surfaceClassNames,
} from "../../system/styles/surface";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { InputGroup } from "../input-group";
import { Separator } from "../separator";
import { Label } from "../label";

import "./otp-field.css";

/** Base UI 1.7 removed Separator from the OTP namespace. */
export const OTPFieldPrimitive = {
  Input: BaseOTPField.Input,
  Root: BaseOTPField.Root,
  Separator: BaseSeparator,
} as const;

/**
 * `separate` draws one box per slot. `joined` draws the slots as one field
 * with the surface of an Input and a thin divider between the characters.
 */
export type OTPFieldLayout = "separate" | "joined";

const OTPFieldContext = React.createContext<{
  layout: OTPFieldLayout;
  variant: FormControlSurface;
}>({ layout: "separate", variant: "default" });

export type OTPFieldProps = WithStringClassName<
  React.ComponentProps<typeof OTPFieldPrimitive.Root>
> & {
  layout?: OTPFieldLayout | undefined;
  size?: SiteplaneControlSize | undefined;
  variant?: FormControlSurface | undefined;
};

export function OTPField({
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  children,
  className,
  id,
  layout = "separate",
  size,
  variant = "default",
  ...props
}: OTPFieldProps): React.ReactElement {
  const resolvedSize = useResolvedControlSize(size);
  const generatedInputId = React.useId();
  const resolvedInputId = id ?? (ariaLabel ? generatedInputId : undefined);
  const joined = layout === "joined";
  const context = React.useMemo(() => ({ layout, variant }), [layout, variant]);

  return (
    <OTPFieldContext.Provider value={context}>
      {ariaLabel && !ariaLabelledBy ? (
        <Label className="sr-only" htmlFor={resolvedInputId}>
          {ariaLabel}
        </Label>
      ) : null}
      <OTPFieldPrimitive.Root
        aria-labelledby={ariaLabelledBy}
        className={cn(!joined && "flex items-center gap-2", className)}
        data-layout={layout}
        data-size={resolvedSize}
        data-slot="otp-field"
        data-variant={variant}
        id={resolvedInputId}
        // A joined field is an InputGroup: the field surface and its invalid
        // state stay with the component that owns them, with the same text size
        // as an Input. Focus is not the field's: the current slot draws the ring
        // of a separate slot (otp-field.css).
        {...(joined
          ? {
              render: (
                <InputGroup
                  textSize={
                    resolvedSize === "lg" || resolvedSize === "xl"
                      ? "base"
                      : undefined
                  }
                  variant={variant}
                />
              ),
            }
          : {})}
        {...props}
      >
        {children}
      </OTPFieldPrimitive.Root>
    </OTPFieldContext.Provider>
  );
}

export type OTPFieldInputProps = WithStringClassName<
  React.ComponentProps<typeof OTPFieldPrimitive.Input>
>;

/**
 * What a slot shows in both layouts: the character is centred, and there is no
 * caret and no selection highlight, so the focus ring is the only mark of the
 * current slot.
 */
const slotClassName =
  "text-center caret-transparent selection:bg-transparent selection:text-foreground";

export function OTPFieldInput({
  className,
  ...props
}: OTPFieldInputProps): React.ReactElement {
  const { layout, variant } = React.useContext(OTPFieldContext);

  if (layout === "joined") {
    // The field draws the surface; the slot is a bare cell inside it that keeps
    // the state logic of a separate slot (otp-field.css). One divider precedes
    // each slot and only the ones that follow another slot show, so every pair
    // of characters is separated.
    return (
      <>
        <Separator orientation="vertical" role="presentation" />
        <OTPFieldPrimitive.Input
          className={cn(slotClassName, className)}
          data-slot="otp-field-input"
          spellCheck={false}
          {...props}
        />
      </>
    );
  }

  return (
    <OTPFieldPrimitive.Input
      className={cn(
        surfaceClassNames.formControlCell,
        formControlSurfaceClassNames[variant],
        slotClassName,
        "in-[[data-slot=otp-field][data-size=sm]]:text-sm in-[[data-slot=otp-field][data-size=lg]]:text-lg in-[[data-slot=otp-field][data-size=xl]]:text-lg in-[[data-slot=otp-field][data-size=sm]]:leading-8 in-[[data-slot=otp-field][data-size=lg]]:leading-10 in-[[data-slot=otp-field][data-size=xl]]:leading-6 leading-9 sm:in-[[data-slot=otp-field][data-size=lg]]:text-base sm:in-[[data-slot=otp-field][data-size=xl]]:text-lg sm:in-[[data-slot=otp-field][data-size=sm]]:leading-7 sm:in-[[data-slot=otp-field][data-size=lg]]:leading-9 sm:in-[[data-slot=otp-field][data-size=xl]]:leading-6 sm:leading-8",
        className,
      )}
      data-slot="otp-field-input"
      spellCheck={false}
      {...props}
    />
  );
}

export type OTPFieldSeparatorProps = React.ComponentProps<typeof Separator>;

export function OTPFieldSeparator({
  className,
  ...props
}: OTPFieldSeparatorProps): React.ReactElement {
  return (
    <OTPFieldPrimitive.Separator
      render={
        <Separator className={className} orientation="horizontal" {...props} />
      }
    />
  );
}
