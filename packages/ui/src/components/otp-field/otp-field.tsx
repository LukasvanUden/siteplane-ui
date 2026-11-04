"use client";

import { OTPField as BaseOTPField } from "@base-ui/react/otp-field";
import { Separator as BaseSeparator } from "@base-ui/react/separator";
import * as React from "react";

import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import {
  type FormControlSurface,
  surfaceClassNames,
} from "../../system/styles/surface";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
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

/**
 * The display sizes of separate slots: squares of 64, 80 and 96 px with
 * display digits, for a code that is the content of its screen, such as a
 * verification step.
 */
export type OTPFieldDisplay = "sm" | "md" | "lg";

const OTPFieldContext = React.createContext<{
  layout: OTPFieldLayout;
}>({ layout: "separate" });

export type OTPFieldProps = WithStringClassName<
  React.ComponentProps<typeof OTPFieldPrimitive.Root>
> & {
  /**
   * Separate slots for display in place of field-sized ones: `sm` 64 px, `md`
   * 80 px and `lg` 96 px squares, with digits of 48 px at `sm` and `md` and of
   * 60 px at `lg`. `size` is ignored
   * while it is set, and the field's hint takes the text beside a larger
   * field. A joined field keeps the field's size.
   */
  display?: OTPFieldDisplay | undefined;
  layout?: OTPFieldLayout | undefined;
  size?: SiteplaneControlSize | undefined;
  variant?: FormControlSurface | undefined;
};

export function OTPField({
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  children,
  className,
  display,
  id,
  layout = "separate",
  size,
  variant = "default",
  ...props
}: OTPFieldProps): React.ReactElement {
  const joined = layout === "joined";
  // Display slots take no size of the ladder; beside them the field's hint
  // takes the text of a larger field (md).
  const displayed = display !== undefined && !joined;
  const resolvedSize = useResolvedControlSize(displayed ? "md" : size);
  const generatedInputId = React.useId();
  const resolvedInputId = id ?? (ariaLabel ? generatedInputId : undefined);
  const context = React.useMemo(() => ({ layout }), [layout]);

  return (
    <OTPFieldContext.Provider value={context}>
      {ariaLabel && !ariaLabelledBy ? (
        <Label className="sr-only" htmlFor={resolvedInputId}>
          {ariaLabel}
        </Label>
      ) : null}
      <OTPFieldPrimitive.Root
        aria-labelledby={ariaLabelledBy}
        className={cn(
          slotClass("otp-field", props),
          // The slots and their text follow the field scale of the size
          // (design-rework.css), and so does the gap between separate slots
          // (otp-field.css).
          "sp-field-scale",
          !joined && "flex items-center",
          className,
        )}
        data-display={displayed ? display : undefined}
        data-layout={layout}
        data-size={resolvedSize}
        data-slot="otp-field"
        data-variant={variant}
        id={resolvedInputId}
        // A joined field is an InputGroup of the field's size: the field
        // surface and its invalid state stay with the component that owns
        // them, with the text of an Input of that size. Focus is not the
        // field's: the current slot draws the ring of a separate slot
        // (otp-field.css). The slots show no alert icon.
        {...(joined
          ? {
              render: (
                <InputGroup
                  showInvalidIcon={false}
                  size={resolvedSize}
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
 * selection highlight. The caret is the native one in the kit's caret colour,
 * like every field's, shown only in the focused empty slot (otp-field.css).
 */
const slotClassName =
  "text-center selection:bg-transparent selection:text-foreground";

/**
 * A slot: its input in a box as large as the input, which holds the slot's
 * text size that the input takes.
 */
function OTPFieldSlot({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <span className="sp-otp-field-slot" data-slot="otp-field-slot">
      {children}
    </span>
  );
}

export function OTPFieldInput({
  className,
  ...props
}: OTPFieldInputProps): React.ReactElement {
  const { layout } = React.useContext(OTPFieldContext);

  if (layout === "joined") {
    // The field draws the surface; the slot is a bare cell inside it that keeps
    // the state logic of a separate slot (otp-field.css). One divider precedes
    // each slot and only the ones that follow another slot show, so every pair
    // of characters is separated.
    return (
      <>
        <Separator orientation="vertical" role="presentation" />
        <OTPFieldSlot>
          <OTPFieldPrimitive.Input
            className={cn(
              slotClass("otp-field-input", props),
              slotClassName,
              className,
            )}
            data-slot="otp-field-input"
            spellCheck={false}
            {...props}
          />
        </OTPFieldSlot>
      </>
    );
  }

  // The slot's box and text follow the field's size: kit rules in
  // design-rework.css, so a size or text utility in className still wins.
  return (
    <OTPFieldSlot>
      <OTPFieldPrimitive.Input
        className={cn(
          slotClass("otp-field-input", props),
          surfaceClassNames.formControlCell,
          slotClassName,
          className,
        )}
        data-slot="otp-field-input"
        spellCheck={false}
        {...props}
      />
    </OTPFieldSlot>
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
