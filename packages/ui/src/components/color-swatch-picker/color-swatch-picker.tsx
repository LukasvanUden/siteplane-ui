"use client";

import * as React from "react";
import { useFormReset } from "../../system/form/use-form-reset";
import {
  ListBoxContext,
  type ListBoxRenderProps,
  ColorSwatchPicker as ColorSwatchPickerPrimitive,
  ColorSwatchPickerItem as ColorSwatchPickerItemPrimitive,
} from "react-aria-components";

import {
  type SiteplaneControlSize,
  type SiteplaneRadius,
  useResolvedControlSize,
  useResolvedRadius,
} from "../../system/provider/siteplane-ui-provider";
import { cn } from "../../system/utils/cn";
import {
  noOwnerValidation,
  useFieldControlBridge,
  useFieldControlProxy,
} from "../field/field-control-bridge";
import { ExternalInputOwner, Input } from "../input/input";
import {
  ColorSwatchFace,
  type ColorSwatchIndicator,
} from "./color-swatch-face";

import "./color-swatch-picker.css";

export type { ColorSwatchIndicator } from "./color-swatch-face";

/**
 * One choice. It is a `color`, or an `image` that fills the swatch (the
 * optional `color` then shows until the image has loaded). `imageSize` and
 * `imagePosition` take CSS `background-size` and `background-position`
 * values to show part of the image; by default it covers the swatch, centred.
 */
export type ColorSwatchPickerOption = {
  disabled?: boolean;
  label: string;
  value: string;
} & (
  | {
      color: string;
      image?: undefined;
      imagePosition?: undefined;
      imageSize?: undefined;
    }
  | {
      color?: string | undefined;
      image: string;
      imagePosition?: string | undefined;
      imageSize?: string | undefined;
    }
);

export interface ColorSwatchPickerProps extends Omit<
  React.ComponentProps<"div">,
  "children" | "defaultValue" | "onChange"
> {
  defaultValue?: string | undefined;
  disabled?: boolean | undefined;
  form?: string | undefined;
  /**
   * How the selected swatch shows its selection: `check` (the default) puts a
   * check inside it, `ring` draws an accent ring around it, like a row of image
   * thumbnails.
   */
  indicator?: ColorSwatchIndicator | undefined;
  inputRef?: React.Ref<HTMLInputElement> | undefined;
  name?: string | undefined;
  onValueChange?: ((value: string) => void) | undefined;
  options: readonly ColorSwatchPickerOption[];
  readOnly?: boolean | undefined;
  required?: boolean | undefined;
  size?: SiteplaneControlSize | undefined;
  value?: string | undefined;
}

export function ColorSwatchPicker({
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  className,
  defaultValue,
  disabled,
  form,
  indicator = "check",
  inputRef,
  name,
  onValueChange,
  options,
  readOnly,
  required,
  size,
  value,
  ...props
}: ColorSwatchPickerProps): React.ReactElement {
  // Inside a Field, FieldLabel names the listbox, FieldDescription and
  // FieldError describe it, and the Field supplies name and disabled state.
  const field = useFieldControlBridge({
    "aria-describedby": ariaDescribedBy,
    "aria-labelledby": ariaLabelledBy,
    disabled,
    name,
  });
  const fieldDisabled = field.disabled;
  const fieldName = field.name;
  const inField = field.inField;
  const invalid = field.valid === false;
  const resolvedSize = useResolvedControlSize(size);
  const radius = useResolvedRadius<SiteplaneRadius>(undefined);
  const controlled = value !== undefined;
  const [resetVersion, setResetVersion] = React.useState(0);
  const markerRef = useFormReset<HTMLInputElement>(form, () => {
    if (!controlled) setResetVersion((current) => current + 1);
  });
  const optionEntries = React.useMemo(
    () =>
      options.map((option, index) => ({
        identity: getOptionIdentity(index),
        option,
      })),
    [options],
  );
  const selectedIdentity = optionEntries.find(
    ({ option }) => option.value === value,
  )?.identity;
  const defaultIdentity = optionEntries.find(
    ({ option }) => option.value === defaultValue,
  )?.identity;
  // React Aria's ColorSwatchPicker drops aria-invalid, aria-readonly and
  // aria-required from its props; its listbox receives these states through
  // the ListBox render. The form inputs follow the listbox: an option must not
  // contain another interactive element. With every option disabled, React
  // Aria makes the listbox itself a tab stop; a disabled picker leaves the
  // tab order instead and is announced as disabled.
  const listboxContext = React.useMemo(
    () => ({
      render: (
        listboxProps: React.JSX.IntrinsicElements["div"],
        { state }: ListBoxRenderProps,
      ) => (
        <>
          <div
            {...listboxProps}
            aria-disabled={fieldDisabled || undefined}
            aria-invalid={invalid || undefined}
            aria-readonly={readOnly || undefined}
            aria-required={required || undefined}
            tabIndex={fieldDisabled ? undefined : listboxProps.tabIndex}
          />
          {fieldName || required || inputRef ? (
            <SwatchFormValue
              disabled={fieldDisabled}
              form={form}
              inputRef={inputRef}
              listboxId={listboxProps.id}
              name={fieldName}
              optionEntries={optionEntries}
              readOnly={readOnly}
              required={required}
              selectedKeys={state.selectionManager.selectedKeys}
            />
          ) : null}
          {inField ? (
            <SwatchFieldProxy
              disabled={fieldDisabled}
              form={form}
              listboxId={listboxProps.id}
              name={fieldName}
              optionEntries={optionEntries}
              readOnly={readOnly}
              required={required}
              selectedKeys={state.selectionManager.selectedKeys}
            />
          ) : null}
        </>
      ),
    }),
    [
      fieldDisabled,
      fieldName,
      form,
      inField,
      inputRef,
      invalid,
      optionEntries,
      readOnly,
      required,
    ],
  );

  return (
    <>
      <ListBoxContext.Provider value={listboxContext}>
        <ColorSwatchPickerPrimitive
          {...(props as React.ComponentProps<
            typeof ColorSwatchPickerPrimitive
          >)}
          {...(field.describedBy === undefined
            ? {}
            : { "aria-describedby": field.describedBy })}
          {...(field.labelledBy || ariaLabel === undefined
            ? {}
            : { "aria-label": ariaLabel })}
          {...(field.labelledBy === undefined
            ? {}
            : { "aria-labelledby": field.labelledBy })}
          className={cn(
            "sp-color-swatch-picker sp-color-swatch-scope",
            className,
          )}
          data-disabled={fieldDisabled || undefined}
          data-indicator={indicator}
          data-radius={radius}
          data-size={resolvedSize}
          data-slot="color-swatch-picker"
          {...(controlled || readOnly
            ? { value: selectedIdentity ?? defaultIdentity ?? "#ffffff" }
            : defaultIdentity === undefined
              ? {}
              : { defaultValue: defaultIdentity })}
          key={controlled ? undefined : resetVersion}
          onChange={(color) => {
            if (readOnly) return;
            const identity = color.toString("hex").toLowerCase();
            const match = optionEntries.find(
              (entry) => entry.identity === identity,
            );
            if (match) onValueChange?.(match.option.value);
          }}
        >
          {optionEntries.map(({ identity, option }) => (
            <ColorSwatchPickerItemPrimitive
              key={option.value}
              aria-label={option.label}
              className="sp-color-swatch-picker-item sp-color-swatch-item"
              color={identity}
              data-slot="color-swatch-picker-item"
              {...(fieldDisabled
                ? { isDisabled: true }
                : option.disabled === undefined
                  ? {}
                  : { isDisabled: option.disabled })}
            >
              {({ isSelected }) => (
                <ColorSwatchFace
                  color={option.color}
                  image={option.image}
                  imagePosition={option.imagePosition}
                  imageSize={option.imageSize}
                  indicator={indicator}
                  label={option.label}
                  selected={isSelected}
                />
              )}
            </ColorSwatchPickerItemPrimitive>
          ))}
        </ColorSwatchPickerPrimitive>
      </ListBoxContext.Provider>
      <Input
        aria-hidden="true"
        disabled
        form={form}
        ref={markerRef}
        type="hidden"
      />
    </>
  );
}

// A form adapter reads the collection's selection; it owns no second selection
// state. A visually hidden text input also participates in native validation.
function SwatchFormValue({
  disabled,
  form,
  inputRef,
  listboxId,
  name,
  optionEntries,
  readOnly,
  required,
  selectedKeys,
}: Pick<
  ColorSwatchPickerProps,
  "disabled" | "form" | "inputRef" | "name" | "readOnly" | "required"
> & {
  listboxId: string | undefined;
  optionEntries: SwatchOptionEntry[];
  selectedKeys: Iterable<React.Key>;
}) {
  const selected = getSelectedOption(optionEntries, selectedKeys);
  // The listbox owns the field semantics; this adapter stays out of a Field.
  return (
    <ExternalInputOwner>
      <Input
        aria-hidden="true"
        className="sr-only"
        disabled={disabled}
        form={form}
        name={name}
        nativeInput
        onChange={() => {}}
        onInvalid={(event) => {
          event.preventDefault();
          if (!listboxId) return;
          event.currentTarget.ownerDocument
            .getElementById(listboxId)
            ?.querySelector<HTMLElement>(
              '[role="option"]:not([aria-disabled="true"])',
            )
            ?.focus();
        }}
        readOnly={readOnly}
        ref={inputRef}
        required={required}
        tabIndex={-1}
        type="text"
        unstyled
        value={selected?.option.value ?? ""}
      />
    </ExternalInputOwner>
  );
}

// Inside a Field, a visually hidden proxy registers the picker with Field and
// Form like the date fields: FieldLabel focuses the selected or first
// available swatch, and Form validation checks `required`, so FieldError
// explains a missing choice.
function SwatchFieldProxy({
  disabled,
  form,
  listboxId,
  name,
  optionEntries,
  readOnly,
  required,
  selectedKeys,
}: Pick<
  ColorSwatchPickerProps,
  "disabled" | "form" | "name" | "readOnly" | "required"
> & {
  listboxId: string | undefined;
  optionEntries: SwatchOptionEntry[];
  selectedKeys: Iterable<React.Key>;
}): React.ReactElement | null {
  const proxyProps = useFieldControlProxy({
    controlled: false,
    disabled: Boolean(disabled),
    displayValidation: noOwnerValidation,
    focusTarget: () => getFocusableSwatch(listboxId),
    form,
    name,
    onRevalidate: () => {},
    realtimeValidation: noOwnerValidation,
    required,
    value: getSelectedOption(optionEntries, selectedKeys)?.option.value ?? "",
  });

  return proxyProps ? (
    <ExternalInputOwner>
      <Input nativeInput readOnly={readOnly} unstyled {...proxyProps} />
    </ExternalInputOwner>
  ) : null;
}

type SwatchOptionEntry = { identity: string; option: ColorSwatchPickerOption };

function getSelectedOption(
  optionEntries: SwatchOptionEntry[],
  selectedKeys: Iterable<React.Key>,
): SwatchOptionEntry | undefined {
  const selectedKey = [...selectedKeys][0];
  return optionEntries.find(
    ({ identity }) => `${identity}ff` === String(selectedKey).toLowerCase(),
  );
}

function getFocusableSwatch(listboxId: string | undefined): HTMLElement | null {
  const listbox = listboxId ? document.getElementById(listboxId) : null;
  return (
    listbox?.querySelector<HTMLElement>(
      '[role="option"][aria-selected="true"]:not([aria-disabled="true"])',
    ) ??
    listbox?.querySelector<HTMLElement>(
      '[role="option"]:not([aria-disabled="true"])',
    ) ??
    null
  );
}

function getOptionIdentity(index: number): string {
  return `#${(index + 1).toString(16).padStart(6, "0")}`;
}
