"use client";

import { Input as InputPrimitive } from "@base-ui/react/input";
import * as React from "react";

import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import {
  formControlSurfaceClassNames,
  formControlTextClassNames,
  surfaceClassNames,
  type FormControlTextSize,
  type FormControlVariant,
} from "../../system/styles/surface";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { dropSlotClass, slotClass } from "../../system/utils/slot-class";
import { useFieldLabelPlacement } from "../field";
import type { KitInputProps } from "./input-internal";

import "./input.css";

type InputRenderElementProps = React.ComponentProps<"input"> & {
  "data-slot"?: string;
};

export type InputProps = Omit<
  WithStringClassName<InputPrimitive.Props> &
    React.RefAttributes<HTMLInputElement>,
  "size"
> & {
  size?: SiteplaneControlSize | number;
  textSize?: FormControlTextSize;
  variant?: FormControlVariant;
  unstyled?: boolean;
  nativeInput?: boolean;
  renderInput?: React.ReactElement<InputRenderElementProps>;
  hidePickerIndicator?: boolean;
  insetStart?: boolean | undefined;
  insetEnd?: boolean | undefined;
};

const ExternalInputOwnerContext = React.createContext(false);

/**
 * Kit-internal boundary; the component index does not export it. Components
 * whose own behavior owner already connects the input to its field (Base UI
 * Combobox and Autocomplete inputs, React Aria color fields, hidden form
 * adapters) render the Input chassis inside it. There, `nativeInput` and
 * `renderInput` pass the element through unchanged instead of registering it
 * with an enclosing Field a second time.
 */
export function ExternalInputOwner({
  children,
}: {
  children?: React.ReactNode;
}): React.ReactElement {
  return (
    <ExternalInputOwnerContext.Provider value>
      {children}
    </ExternalInputOwnerContext.Provider>
  );
}

export function Input(inputProps: InputProps): React.ReactElement {
  // Kit components pass the internal profiles through KitInput
  // (input-internal.ts), the same function with the wider props type.
  const {
    className,
    size,
    textSize,
    variant = "default",
    unstyled = false,
    nativeInput = false,
    renderInput,
    hidePickerIndicator = false,
    insetEnd = false,
    insetStart = false,
    profile = "default",
    profileMode,
    style,
    ...props
  } = inputProps as KitInputProps;
  const externalOwner = React.useContext(ExternalInputOwnerContext);
  const externalElement = externalOwner && Boolean(renderInput || nativeInput);
  // A floating Field lays out the text field it holds (design-rework.css,
  // "Floating label fields"). A hidden or file input keeps its own layout, and
  // so does an element another owner renders, such as the hidden proxy of a
  // segmented date field, unless it is the input of a Combobox or Autocomplete.
  // A floating field takes no leading icon, so every label and value in a form
  // starts on one line: an input whose start edge is inset for an adjoining
  // element, such as an icon, a Combobox or Autocomplete start addon or an
  // InputGroup addon, keeps the label above it.
  const floating =
    useFieldLabelPlacement() === "floating" &&
    !insetStart &&
    props.type !== "hidden" &&
    props.type !== "file" &&
    (!externalElement ||
      (profile === "combobox" && profileMode !== "embedded"));
  // A blank placeholder lets CSS tell an empty field (:placeholder-shown), so
  // the label rests in an empty field and floats over a value before hydration.
  const floatingPlaceholder =
    floating && props.placeholder === undefined ? { placeholder: " " } : {};
  const visualSize = typeof size === "number" ? undefined : size;
  const nativeSize = typeof size === "number" ? size : undefined;
  const resolvedSize = useResolvedControlSize(visualSize);
  const resolvedTextSize =
    textSize ??
    (resolvedSize === "lg" || resolvedSize === "xl" ? "base" : undefined);
  // The native input fills its control: the field has no border, so a height
  // per size left a 2 px strip under it, or overflowed below 640 px. Its
  // height, radius, inline padding, line, placeholder and disabled cursor are
  // the kit base of every Input (design-rework.css).
  const inputClassName = cn(
    "w-full min-w-0 outline-none",
    props.type === "search" &&
      "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
    hidePickerIndicator && "sp-input-hide-picker",
    props.type === "date" && "sp-date-input",
  );
  const nativeInputProps = props as React.ComponentProps<"input">;
  const nativeInputStyle =
    typeof style !== "function" && style !== undefined ? { style } : {};

  // A hidden input only carries form data. The Legacy wrapper would otherwise
  // produce an empty visible surface.
  if (props.type === "hidden") {
    return <input {...nativeInputProps} type="hidden" {...nativeInputStyle} />;
  }

  return (
    <span
      className={
        cn(
          "sp-input-control sp-base-input",
          !unstyled &&
            (variant === "soft"
              ? surfaceClassNames.formControlSoft
              : cn(
                  surfaceClassNames.formControl,
                  formControlSurfaceClassNames[variant],
                )),
          resolvedTextSize && formControlTextClassNames[resolvedTextSize],
          profile === "sidebar" && "w-full",
          // A host's slot reaches the native input with the other props,
          // so its class stays off the control.
          dropSlotClass(className, props),
        ) || undefined
      }
      data-foundation="input"
      data-inset-end={insetEnd || undefined}
      data-inset-start={insetStart || undefined}
      data-label-placement={floating ? "floating" : undefined}
      data-profile={profile}
      data-profile-mode={profileMode}
      data-size={resolvedSize}
      data-slot="input-control"
      // Only an explicit textSize replaces the size-based field text.
      data-text-size={textSize}
      data-unstyled={unstyled || undefined}
      data-variant={variant}
      // A hidden input hides its whole control, so no empty field surface
      // stays on the page; the input itself stays in the form.
      hidden={nativeInputProps.hidden}
    >
      {externalElement ? (
        // The surrounding behavior owner already supplies id, labelling,
        // description and validation for this element.
        React.cloneElement(renderInput ?? <input />, {
          ...nativeInputProps,
          ...floatingPlaceholder,
          className: cn(
            "sp-input",
            inputClassName,
            renderInput?.props.className,
          ),
          "data-slot": "input",
          size: nativeSize,
          ...nativeInputStyle,
        })
      ) : (
        // `nativeInput` and `renderInput` use the same Field control as the
        // default input, so FieldLabel, FieldDescription, FieldError and Field
        // state reach the rendered element.
        <InputPrimitive
          className={
            renderInput
              ? undefined
              : cn(slotClass("input", props), inputClassName)
          }
          data-slot="input"
          size={nativeSize}
          style={style}
          {...props}
          {...floatingPlaceholder}
          render={
            renderInput
              ? React.cloneElement(renderInput, {
                  className: cn(
                    "sp-input",
                    inputClassName,
                    renderInput.props.className,
                  ),
                  "data-slot": "input",
                })
              : props.render
          }
        />
      )}
    </span>
  );
}

export { InputPrimitive };
