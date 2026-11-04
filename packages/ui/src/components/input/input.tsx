"use client";

import { Input as InputPrimitive } from "@base-ui/react/input";
import * as React from "react";

import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import {
  surfaceClassNames,
  type FormControlTextSize,
  type FormControlVariant,
} from "../../system/styles/surface";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { dropSlotClass, slotClass } from "../../system/utils/slot-class";
import { useFieldLabelPlacement } from "../field";
import { FieldStatus, hasFieldHelp } from "../input-group/field-status";
import { InputGroup, InputGroupInput } from "../input-group/input-group";
import type { KitInputProps } from "./input-internal";

import "./input.css";

type InputRenderElementProps = React.ComponentProps<"input"> & {
  "data-slot"?: string;
};

export type InputProps = Omit<
  WithStringClassName<InputPrimitive.Props> &
    React.RefAttributes<HTMLInputElement>,
  "size" | "style"
> & {
  /**
   * The style of the field: it goes to the outer span, with `className`, as
   * on every field (Lukas, 4 November 2026), so a margin or a width moves the
   * whole field. The other native props reach the input.
   */
  style?: React.CSSProperties | undefined;
  size?: SiteplaneControlSize | number;
  textSize?: FormControlTextSize;
  variant?: FormControlVariant;
  unstyled?: boolean;
  nativeInput?: boolean;
  renderInput?: React.ReactElement<InputRenderElementProps>;
  insetStart?: boolean | undefined;
  insetEnd?: boolean | undefined;
  /**
   * A help text behind a help icon at the end of the field, shown in a
   * Tooltip on hover and keyboard focus. The Input then renders in an
   * InputGroup with that `tooltip`; `className`, `style`, `size`, `textSize`
   * and `variant` go to the group.
   */
  tooltip?: React.ReactNode;
  /**
   * While the input is invalid (`aria-invalid`, which an invalid Field sets),
   * an alert icon stands at the end of the field, where the help icon of
   * `tooltip` stands, which gives way to it. It is decorative: the Field ties
   * the error message to the input. A password field, a floating field and an
   * input that keeps its end clear (`insetEnd`) show none. `false` turns it
   * off. Default: `true`.
   */
  showInvalidIcon?: boolean | undefined;
};

/**
 * Kit-internal; the component index does not export it. The `render` of an
 * input that shows text a form must not send, such as the names a FileInput
 * shows while its hidden file input carries the files. Base UI writes the
 * Field's name on the input it renders, and an element passed to `render`
 * overrides it, so this one leaves the input without a name. The Input owns
 * the native element, so this is where the raw tag stands.
 */
export const unnamedInputRender: React.ReactElement<InputRenderElementProps> = (
  <input name={undefined} />
);

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
    insetEnd = false,
    insetStart = false,
    profile = "default",
    profileMode,
    showInvalidIcon = true,
    style,
    tooltip,
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
  // The alert icon of an invalid field follows the field's text: the status
  // of the field (FieldStatus, input-group.css), in a plain Input as in the
  // InputGroup of `tooltip`, where it takes the place of the help icon. Never
  // in a password field, whose end is its reveal action, in a file input, in
  // an input that keeps its end clear for something of its own, or in an
  // element another owner renders. A floating field shows its error in a
  // bubble at the same end instead. An Input in an InputGroup leaves it to the
  // group.
  const alertAllowed =
    showInvalidIcon &&
    !externalElement &&
    !insetEnd &&
    props.type !== "password" &&
    props.type !== "file";
  const invalidIcon =
    alertAllowed && !floating && profile === "default" && !unstyled;
  const visualSize = typeof size === "number" ? undefined : size;
  const nativeSize = typeof size === "number" ? size : undefined;
  const resolvedSize = useResolvedControlSize(visualSize);
  // The control is a field of its size (the field scale, design-rework.css):
  // its height, padding, icons and text follow it, and a Field reads it for
  // its hint. An Input in an InputGroup takes the group's, and an input that
  // assistive technology skips, such as the proxy of a date field, is none.
  const fieldScale =
    profile !== "input-group" &&
    props["aria-hidden"] !== true &&
    props["aria-hidden"] !== "true";
  // The native input fills its control (input.css): the field has no border,
  // so a height per size left a 2 px strip under it, or overflowed below
  // 640 px. Its height, radius, inline padding, line, placeholder and disabled
  // cursor are the kit base of every Input (design-rework.css). The kit
  // styles no native date or time input: the date and time fields are its
  // own (rulebook K3).
  const inputClassName = cn(
    "min-w-0 outline-none",
    props.type === "search" &&
      "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
  );
  const nativeInputProps = props as React.ComponentProps<"input">;
  // `className` and `style` style the field, its outer span (Lukas, 4 November
  // 2026). The input of an InputGroup has no box of its own: its span takes
  // no room (input.css), and the group draws the field. Its style stays on
  // the native input, its one box.
  const controlStyle =
    profile === "input-group" && style !== undefined ? { style } : {};
  const rootStyle = profile === "input-group" ? undefined : style;

  // A hidden input only carries form data. The Legacy wrapper would otherwise
  // produce an empty visible surface.
  if (props.type === "hidden") {
    return (
      <input
        {...nativeInputProps}
        type="hidden"
        {...(style === undefined ? {} : { style })}
      />
    );
  }

  // A help text puts the Input in an InputGroup that shows its help icon: the
  // group draws the field and its status, and the Input in it is the group's
  // control. Without one the Input stays as it is.
  if (profile === "default" && hasFieldHelp(tooltip)) {
    return (
      <InputGroup
        className={className}
        hidden={nativeInputProps.hidden}
        showInvalidIcon={alertAllowed}
        size={visualSize}
        style={style}
        textSize={textSize}
        tooltip={tooltip}
        variant={variant}
      >
        <InputGroupInput
          {...props}
          insetEnd={insetEnd}
          insetStart={insetStart}
          nativeInput={nativeInput}
          {...(renderInput === undefined ? {} : { renderInput })}
          {...(nativeSize === undefined ? {} : { size: nativeSize })}
        />
      </InputGroup>
    );
  }

  return (
    <span
      className={
        cn(
          "sp-input-control sp-base-input",
          fieldScale && "sp-field-scale",
          !unstyled &&
            (variant === "soft"
              ? surfaceClassNames.formControlSoft
              : surfaceClassNames.formControl),
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
      // Only an explicit textSize replaces the text of the size.
      data-text-size={textSize}
      data-unstyled={unstyled || undefined}
      data-variant={variant}
      // A hidden input hides its whole control, so no empty field surface
      // stays on the page; the input itself stays in the form.
      hidden={nativeInputProps.hidden}
      style={rootStyle}
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
          ...controlStyle,
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
          {...controlStyle}
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
      {invalidIcon ? <FieldStatus alert /> : null}
    </span>
  );
}

export { InputPrimitive };
