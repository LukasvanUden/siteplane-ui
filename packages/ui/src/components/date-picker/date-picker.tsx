"use client";

import { type DateValue } from "@internationalized/date";
import * as React from "react";
import {
  CalendarContext,
  DatePicker as DatePickerPrimitive,
  type DatePickerState,
  Dialog as DatePickerDialogPrimitive,
  Group as DatePickerGroupPrimitive,
  Popover as DatePickerPopoverPrimitive,
  useLocale,
  useSlottedContext,
} from "react-aria-components";

import { isInvalidAriaValue } from "../../system/form/aria-invalid";
import { useFormReset } from "../../system/form/use-form-reset";
import { normalizeFormattedText } from "../../system/locale/formatted-text";
import { useSiteplaneMessages } from "../../system/locale/messages-context";
import { SiteplaneLocaleProvider } from "../../system/locale/siteplane-locale-provider";
import {
  type SiteplaneControlSize,
  SiteplaneUIPortalScope,
} from "../../system/provider/siteplane-ui-provider";
import {
  surfaceClassNames,
  type FormControlTextSize,
} from "../../system/styles/surface";
import { cn } from "../../system/utils/cn";
import { Calendar } from "../calendar";
import {
  calendarMonthBounds,
  type CalendarOptions,
  fromNativeDate,
  isCalendarDayDisabled,
  toNativeDate,
} from "../calendar/calendar";
import {
  useFieldControlBridge,
  useFieldControlProxy,
} from "../field/field-control-bridge";
import { ExternalInputOwner, Input } from "../input/input";
import {
  DatePickerFooter,
  DatePickerPanel,
  DatePickerTrigger,
} from "./date-picker-panel";

import "./date-picker.css";

export type DatePickerProps = {
  "aria-describedby"?: string | undefined;
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  "aria-label"?: string;
  "aria-labelledby"?: string | undefined;
  calendarProps?: CalendarOptions;
  className?: string;
  /**
   * Keeps the popover open while a date is picked, until it is confirmed: the
   * calendar shows a date input and a Today button above its days, and a
   * footer holds Cancel and Apply. Apply sets the picked date and closes the
   * popover; Cancel, Escape and a press outside close it and keep the date as
   * it was.
   */
  confirm?: boolean;
  defaultValue?: Date;
  disabled?: boolean;
  /** The id of the form the date belongs to, like DateField. */
  form?: string;
  formatValue?: ((value: Date | undefined) => React.ReactNode) | undefined;
  locale?: string;
  /** Submits the date as `YYYY-MM-DD` under this name, like DateField. */
  name?: string;
  onValueChange?: (value: Date | undefined) => void;
  placeholder?: React.ReactNode;
  /** A form is not submitted while the picker holds no date. */
  required?: boolean;
  /** The control size, like the other date and time fields. */
  size?: SiteplaneControlSize;
  /**
   * The trigger text: unset is 14 px at `sm` and 16 px from `md`, as in the
   * other date fields; `sm` and `base` set 14 px and 16 px at every size.
   */
  textSize?: FormControlTextSize;
  value?: Date | null;
  /**
   * `fit` is as wide as the trigger's date or placeholder. `full` fills the
   * container, like Input. Default: `fit`.
   */
  width?: "fit" | "full";
};

function toCalendarDate(value: Date | null | undefined) {
  return value ? fromNativeDate(value) : null;
}

function toOptionalNativeDate(
  value: DateValue | null | undefined,
): Date | undefined {
  return value ? toNativeDate(value) : undefined;
}

function formatDatePickerValue(value: DateValue | null | undefined): string {
  if (!value) return "";
  return `${String(value.year).padStart(4, "0")}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`;
}

function noop(): void {}

export function DatePicker(props: DatePickerProps): React.ReactElement {
  const picker = <DatePickerRoot {...props} />;

  return props.locale ? (
    <SiteplaneLocaleProvider locale={props.locale}>
      {picker}
    </SiteplaneLocaleProvider>
  ) : (
    picker
  );
}

function DatePickerRoot({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-label": ariaLabelProp,
  "aria-labelledby": ariaLabelledBy,
  calendarProps,
  className,
  confirm = false,
  defaultValue,
  disabled,
  form,
  formatValue,
  name,
  onValueChange,
  placeholder: placeholderProp,
  required,
  size,
  textSize,
  value,
  width = "fit",
}: DatePickerProps): React.ReactElement {
  const messages = useSiteplaneMessages("datePicker");
  const ariaLabel = ariaLabelProp ?? messages.label;
  const placeholder =
    placeholderProp === undefined ? messages.placeholder : placeholderProp;
  const controlled = value !== undefined;
  const groupRef = React.useRef<HTMLDivElement>(null);
  const field = useFieldControlBridge({
    "aria-describedby": ariaDescribedBy,
    "aria-labelledby": ariaLabelledBy,
    disabled,
    name,
  });
  // React Aria validates the date unless the application controls the invalid
  // state through aria-invalid or an invalid Field.
  const controlledInvalid =
    ariaInvalid !== undefined
      ? isInvalidAriaValue(ariaInvalid)
      : field.invalid || undefined;
  // A required picker outside a Field that stopped a form submission.
  const [missing, setMissing] = React.useState(false);
  const invalid = controlledInvalid ?? (field.valid === false || missing);
  const focusTrigger = () =>
    groupRef.current?.querySelector<HTMLElement>(
      '[data-slot="date-picker-trigger"]',
    ) ?? null;
  // The React Aria trigger drops aria-invalid, so the state is set on the
  // rendered button.
  React.useLayoutEffect(() => {
    const trigger = groupRef.current?.querySelector(
      '[data-slot="date-picker-trigger"]',
    );
    if (invalid) trigger?.setAttribute("aria-invalid", "true");
    else trigger?.removeAttribute("aria-invalid");
  });
  const { locale } = useLocale();
  const shortDateFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    [locale],
  );

  // React Aria's optional props reject `undefined` under
  // exactOptionalPropertyTypes, so unset values are omitted.
  return (
    <DatePickerPrimitive
      {...(field.describedBy === undefined
        ? {}
        : { "aria-describedby": field.describedBy })}
      {...(field.labelledBy ? {} : { "aria-label": ariaLabel })}
      {...(field.labelledBy === undefined
        ? {}
        : { "aria-labelledby": field.labelledBy })}
      className="sp-date-picker sp-base-date-picker contents"
      data-foundation="date-picker"
      data-slot="date-picker"
      {...(controlled
        ? { value: toCalendarDate(value) }
        : { defaultValue: toCalendarDate(defaultValue) })}
      isDateUnavailable={(date) =>
        isCalendarDayDisabled(toNativeDate(date), calendarProps?.disabled)
      }
      isDisabled={field.disabled}
      {...(controlledInvalid === undefined
        ? {}
        : { isInvalid: controlledInvalid })}
      {...(required === undefined ? {} : { isRequired: required })}
      {...calendarMonthBounds(calendarProps ?? {})}
      onChange={(nextValue) => {
        if (nextValue) setMissing(false);
        onValueChange?.(toOptionalNativeDate(nextValue));
      }}
      // A picker that confirms keeps its popover open until Apply.
      shouldCloseOnSelect={!confirm}
    >
      {({ state }) => {
        const nativeValue = toOptionalNativeDate(state.value);
        const label = formatValue
          ? formatValue(nativeValue)
          : nativeValue
            ? normalizeFormattedText(shortDateFormatter.format(nativeValue))
            : placeholder;

        return (
          <>
            <DatePickerGroupPrimitive
              // As wide as its date by default; width="full" fills the
              // container, like Input.
              className={cn(
                width === "full" ? "flex w-full" : "inline-flex",
                "max-w-full",
                className,
              )}
              ref={groupRef}
            >
              <DatePickerTrigger
                data-slot="date-picker-trigger"
                disabled={field.disabled}
                empty={!nativeValue}
                invalid={invalid}
                size={size}
                textSize={textSize}
                valueSlot="date-picker-value"
              >
                {label}
              </DatePickerTrigger>
            </DatePickerGroupPrimitive>
            <DatePickerPopoverPrimitive
              className={cn(
                surfaceClassNames.floatingOverlay,
                "sp-date-picker-popover",
              )}
              data-panel={confirm || undefined}
              data-slot="date-picker-popover"
              offset={4}
              placement="bottom start"
            >
              <SiteplaneUIPortalScope>
                <DatePickerDialogPrimitive
                  className="sp-date-picker-dialog outline-none"
                  data-slot="date-picker-dialog"
                >
                  {confirm ? (
                    <DatePickerConfirmPanel
                      ariaLabel={ariaLabel}
                      calendarProps={calendarProps}
                      state={state}
                    />
                  ) : (
                    <Calendar
                      {...calendarProps}
                      aria-label={ariaLabel}
                      data-slot="date-picker-calendar"
                    />
                  )}
                </DatePickerDialogPrimitive>
              </SiteplaneUIPortalScope>
            </DatePickerPopoverPrimitive>
            <DatePickerFormValue
              controlled={controlled}
              controlledInvalid={controlledInvalid}
              defaultValue={defaultValue}
              disabled={field.disabled}
              focusTarget={focusTrigger}
              form={form}
              name={field.name}
              onMissing={() => {
                setMissing(true);
                focusTrigger()?.focus();
              }}
              required={required}
              state={state}
            />
          </>
        );
      }}
    </DatePickerPrimitive>
  );
}

/**
 * The popover of a picker that confirms (`confirm`): the calendar holds the
 * picked date apart from the picker's own until Apply sets it, so Cancel, or
 * a popover closed any other way, keeps the date as it was. The picked date
 * starts as the picker's date each time the popover opens. The calendar shows
 * a date input and Today above its days, and Cancel and Apply share the
 * footer in two equal halves.
 */
function DatePickerConfirmPanel({
  ariaLabel,
  calendarProps,
  state,
}: {
  ariaLabel: string;
  calendarProps: CalendarOptions | undefined;
  state: DatePickerState;
}): React.ReactElement {
  // The picker hands its calendar its date, its bounds and the focus on open
  // through React Aria's calendar context; the panel keeps all of it but the
  // date, which it holds itself until Apply.
  const pickerCalendar = useSlottedContext(CalendarContext);
  const [picked, setPicked] = React.useState<DateValue | null>(state.value);

  return (
    <DatePickerPanel
      footer={
        <DatePickerFooter
          actionLayout="fill"
          onApply={() => {
            state.setValue(picked);
            state.setOpen(false);
          }}
          onCancel={() => state.setOpen(false)}
        />
      }
    >
      <CalendarContext.Provider
        value={{
          ...pickerCalendar,
          onChange: (next: DateValue | readonly DateValue[] | null) =>
            setPicked(Array.isArray(next) ? (next[0] ?? null) : next),
          value: picked,
        }}
      >
        <Calendar
          {...calendarProps}
          aria-label={ariaLabel}
          data-slot="date-picker-calendar"
          showDateInput
          showToday
        />
      </CalendarContext.Provider>
    </DatePickerPanel>
  );
}

/**
 * The picker's form value, as DateField submits it: `YYYY-MM-DD` under `name`,
 * empty while no date is chosen. Inside a Field a proxy input registers the
 * picker with the Field and Form, which check `required`. Outside a Field a
 * visually hidden text input checks it, since a hidden input takes no part in
 * constraint validation.
 */
function DatePickerFormValue({
  controlled,
  controlledInvalid,
  defaultValue,
  disabled,
  focusTarget,
  form,
  name,
  onMissing,
  required,
  state,
}: {
  controlled: boolean;
  controlledInvalid: boolean | undefined;
  defaultValue: Date | undefined;
  disabled: boolean;
  focusTarget: () => HTMLElement | null;
  form: string | undefined;
  name: string | undefined;
  onMissing: () => void;
  required: boolean | undefined;
  state: DatePickerState;
}): React.ReactElement {
  const resetRef = useFormReset<HTMLInputElement>(form, () => {
    if (!controlled) state.setValue(toCalendarDate(defaultValue));
  });
  const value = formatDatePickerValue(state.value);
  const proxyProps = useFieldControlProxy({
    controlled: controlledInvalid !== undefined,
    disabled,
    displayValidation: state.displayValidation,
    focusTarget,
    form,
    name,
    onRevalidate: state.commitValidation,
    realtimeValidation: state.realtimeValidation,
    required,
    value,
  });

  return (
    <>
      <Input
        disabled={disabled}
        form={form}
        name={name}
        readOnly
        ref={resetRef}
        required={required}
        type="hidden"
        value={value}
      />
      {proxyProps ? (
        <ExternalInputOwner>
          <Input nativeInput unstyled {...proxyProps} />
        </ExternalInputOwner>
      ) : required ? (
        <ExternalInputOwner>
          <Input
            aria-hidden="true"
            className="sr-only"
            disabled={disabled}
            form={form}
            nativeInput
            onChange={noop}
            onInvalid={(event) => {
              event.preventDefault();
              onMissing();
            }}
            required
            tabIndex={-1}
            type="text"
            unstyled
            value={value}
          />
        </ExternalInputOwner>
      ) : null}
    </>
  );
}
