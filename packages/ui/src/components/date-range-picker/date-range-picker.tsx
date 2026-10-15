"use client";

import { type CalendarDate, type DateValue } from "@internationalized/date";
import { CalendarDaysIcon } from "lucide-react";
import * as React from "react";
import {
  Button as DateRangeButtonPrimitive,
  DateFieldContext,
  DateFieldStateContext,
  DateInput as DateRangeInputPrimitive,
  DateRangePicker as DateRangePickerPrimitive,
  type DateRangePickerState,
  DateSegment as DateRangeSegmentPrimitive,
  Dialog as DateRangeDialogPrimitive,
  Group as DateRangeGroupPrimitive,
  Popover as DateRangePopoverPrimitive,
  type RangeValue,
  useLocale,
  useSlottedContext,
} from "react-aria-components";

import { isInvalidAriaValue } from "../../system/form/aria-invalid";
import { useFormReset } from "../../system/form/use-form-reset";
import { normalizeFormattedText } from "../../system/locale/formatted-text";
import { SiteplaneLocaleProvider } from "../../system/locale/siteplane-locale-provider";
import {
  type SiteplaneControlSize,
  SiteplaneUIPortalScope,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import {
  surfaceClassNames,
  type FormControlTextSize,
  type FormControlVariant,
} from "../../system/styles/surface";
import { cn } from "../../system/utils/cn";
import { Button } from "../button";
import { Calendar } from "../calendar";
import {
  calendarMonthBounds,
  type CalendarOptions,
  type DateRange,
  fromNativeDate,
  isCalendarDayDisabled,
  toNativeDate,
} from "../calendar/calendar";
import {
  type FieldControlBridge,
  hasClearedSegment,
  type SegmentedValue,
  useFieldControlBridge,
  useFieldControlProxy,
  useFieldErrorSegments,
  useSegmentedValue,
} from "../field/field-control-bridge";
import { Input } from "../input";
import { ExternalInputOwner } from "../input/input";
import { InputGroup, InputGroupAddon, InputGroupText } from "../input-group";

// The shared date segment styles are owned by DateField.
import "../date-field/date-field.css";
import "./date-range-picker.css";

// The range shape is the Calendar's, so a range moves between the picker and
// a range Calendar as it is.
export type { DateRange } from "../calendar/calendar";

export interface DateRangePickerProps {
  "aria-describedby"?: string | undefined;
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  "aria-label"?: string;
  "aria-labelledby"?: string | undefined;
  calendarProps?: CalendarOptions;
  className?: string;
  defaultValue?: DateRange;
  disabled?: boolean;
  endLabel?: string;
  endName?: string;
  form?: string;
  /**
   * `action-end` ends the field with the button that opens the calendar;
   * `none` leaves the range to typing, as DateField's `iconMode="none"` does,
   * for a range beside a calendar of its own.
   */
  iconMode?: "action-end" | "none" | undefined;
  /**
   * The error a required picker shows while its range is incomplete, such as
   * after a segment is cleared. Default: "Enter a complete date range."
   */
  incompleteLabel?: string;
  locale?: string;
  onValueChange?: (value: DateRange | undefined) => void;
  openPickerLabel?: string;
  readOnly?: boolean;
  required?: boolean;
  size?: SiteplaneControlSize;
  startLabel?: string;
  startName?: string;
  textSize?: FormControlTextSize;
  value?: DateRange | null;
  variant?: FormControlVariant;
}

const actionSizes = {
  md: "icon-xs",
  lg: "icon-xs",
  sm: "icon-2xs",
  xl: "icon-sm",
} as const satisfies Record<
  SiteplaneControlSize,
  "icon-2xs" | "icon-xs" | "icon-sm"
>;

function toCalendarDate(value: Date | null | undefined): CalendarDate | null {
  return value ? fromNativeDate(value) : null;
}

function toOptionalNativeDate(
  value: DateValue | null | undefined,
): Date | undefined {
  return value ? toNativeDate(value) : undefined;
}

function toInternalRange(
  value: DateRange | null | undefined,
): RangeValue<CalendarDate> | null {
  const start = toCalendarDate(value?.from);
  const end = toCalendarDate(value?.to);
  return start && end ? { end, start } : null;
}

function toNativeRange(
  value: RangeValue<DateValue | null> | null | undefined,
): DateRange | undefined {
  if (!value?.start && !value?.end) return undefined;
  return {
    from: toOptionalNativeDate(value.start),
    to: toOptionalNativeDate(value.end),
  };
}

function formatDate(value: DateValue | null | undefined): string {
  if (!value) return "";
  return `${String(value.year).padStart(4, "0")}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`;
}

function formatRange(value: RangeValue<DateValue | null> | null): string {
  return value?.start && value.end
    ? `${formatDate(value.start)}/${formatDate(value.end)}`
    : "";
}

type ClearedEndpoints = { end: boolean; start: boolean };

function DateRangeHiddenInputs({
  cleared,
  controlled,
  controlledInvalid,
  controlRef,
  defaultValue,
  endName,
  field,
  focusTarget,
  form,
  required,
  segmented,
  startName,
  state,
}: {
  cleared: ClearedEndpoints;
  controlled: boolean;
  controlledInvalid: boolean | undefined;
  controlRef: React.RefObject<HTMLDivElement | null>;
  defaultValue: DateRange | undefined;
  endName: string | undefined;
  field: FieldControlBridge;
  focusTarget: () => HTMLElement | null;
  form: string | undefined;
  required: boolean | undefined;
  segmented: SegmentedValue<RangeValue<DateValue>>;
  startName: string | undefined;
  state: DateRangePickerState;
}): React.ReactElement {
  const startInputRef = useFormReset<HTMLInputElement>(form, () => {
    if (!controlled) state.setValue(toInternalRange(defaultValue));
  });
  // A date with a cleared segment has no value, although React Aria still
  // holds the last complete one.
  const startValue = cleared.start ? null : state.value.start;
  const endValue = cleared.end ? null : state.value.end;
  const start = formatDate(startValue);
  const end = formatDate(endValue);
  React.useLayoutEffect(() => {
    const ownerValue =
      state.value.start && state.value.end
        ? { end: state.value.end, start: state.value.start }
        : null;
    segmented.sync({
      cleared: cleared.start || cleared.end,
      effective:
        startValue && endValue ? { end: endValue, start: startValue } : null,
      value: ownerValue,
    });
  });
  const proxyProps = useFieldControlProxy({
    controlled: controlledInvalid !== undefined,
    disabled: field.disabled,
    displayValidation: state.displayValidation,
    focusTarget,
    form,
    name: undefined,
    onRevalidate: state.commitValidation,
    realtimeValidation: state.realtimeValidation,
    required,
    value: start && end ? `${start}/${end}` : "",
  });
  useFieldErrorSegments(controlRef, {
    controlled: controlledInvalid !== undefined,
    ownerInvalid: state.isInvalid,
  });

  return (
    <>
      <Input
        disabled={field.disabled}
        form={form}
        name={startName}
        readOnly
        ref={startInputRef}
        required={required}
        type="hidden"
        value={start}
      />
      <Input
        disabled={field.disabled}
        form={form}
        name={endName}
        readOnly
        required={required}
        type="hidden"
        value={end}
      />
      {proxyProps ? (
        <ExternalInputOwner>
          <Input nativeInput unstyled {...proxyProps} />
        </ExternalInputOwner>
      ) : null}
    </>
  );
}

// React Aria names each date segment with its date field's name and the range
// label, such as "month, Start Date, Trip dates". A label replaces the
// localized Start Date or End Date field name.
function DateRangeEndpoint({
  label,
  onClearedChange,
  slot,
}: {
  label: string | undefined;
  onClearedChange: (slot: "end" | "start", cleared: boolean) => void;
  slot: "end" | "start";
}): React.ReactElement {
  const fieldProps = useSlottedContext(DateFieldContext, slot);

  return (
    <DateFieldContext.Provider
      value={
        label && fieldProps
          ? { ...fieldProps, "aria-label": label }
          : fieldProps
      }
    >
      <DateRangeInputPrimitive
        className={cn(
          "sp-base-date-field",
          `sp-date-range-picker-${slot}`,
          "contents",
        )}
        data-foundation="date-field"
        data-profile="input-group"
        data-slot={`date-range-picker-${slot}`}
        slot={slot}
      >
        {(segment) => (
          <DateRangeSegment
            onClearedChange={(cleared) => onClearedChange(slot, cleared)}
            segment={segment}
          />
        )}
      </DateRangeInputPrimitive>
    </DateFieldContext.Provider>
  );
}

// The start date, the dash and the end date read in the locale's direction,
// which React Aria's arrow keys follow, whatever the page's: an en-US range
// stays 01/01/2024 – 10/14/2026 in a right-to-left page. The dir attribute
// also isolates the row from the text around it; date-range-picker.css keeps
// the field's insets on the field's sides.
function DateRangeSegments({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const { direction } = useLocale();

  return (
    <div
      className="sp-date-range-picker-segments"
      data-slot="date-range-picker-segments"
      dir={direction}
    >
      {children}
    </div>
  );
}

// Each date of the range keeps its own field state inside its DateInput; the
// segments tell the picker whether that date shows a cleared segment.
function DateRangeSegment({
  onClearedChange,
  segment,
}: {
  onClearedChange: (cleared: boolean) => void;
  segment: React.ComponentProps<typeof DateRangeSegmentPrimitive>["segment"];
}): React.ReactElement {
  const cleared = hasClearedSegment(React.useContext(DateFieldStateContext));
  React.useLayoutEffect(() => onClearedChange(cleared));

  // The segment shows the text that the server's ICU and the browser's agree
  // on, as the Date Field's do (date-field.tsx), so the prerendered range
  // hydrates.
  return (
    <DateRangeSegmentPrimitive
      className="sp-date-field-segment sp-date-segment"
      data-literal-kind={
        segment.type === "literal" && /[./-]/.test(segment.text)
          ? "separator"
          : undefined
      }
      data-slot="date-field-segment"
      segment={segment}
    >
      {({ text }) => normalizeFormattedText(text)}
    </DateRangeSegmentPrimitive>
  );
}

export function DateRangePicker({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  calendarProps,
  className,
  defaultValue,
  disabled,
  endLabel,
  endName,
  form,
  iconMode = "action-end",
  incompleteLabel = "Enter a complete date range.",
  locale,
  onValueChange,
  openPickerLabel = "Open date range calendar",
  readOnly,
  required,
  size,
  startLabel,
  startName,
  textSize,
  value,
  variant = "default",
}: DateRangePickerProps): React.ReactElement {
  const controlled = value !== undefined;
  const resolvedSize = useResolvedControlSize(size);
  const controlRef = React.useRef<HTMLDivElement>(null);
  const field = useFieldControlBridge({
    "aria-describedby": ariaDescribedBy,
    "aria-labelledby": ariaLabelledBy,
    disabled,
  });
  const fieldAriaLabel = field.labelledBy ? undefined : ariaLabel;
  // React Aria validates typed dates unless the application controls the
  // invalid state through aria-invalid or an invalid Field.
  const controlledInvalid =
    ariaInvalid !== undefined
      ? isInvalidAriaValue(ariaInvalid)
      : field.invalid || undefined;
  // A cleared segment empties the range's value.
  const [cleared, setCleared] = React.useState<ClearedEndpoints>({
    end: false,
    start: false,
  });
  const onClearedChange = React.useCallback(
    (slot: "end" | "start", next: boolean) =>
      setCleared((current) =>
        current[slot] === next ? current : { ...current, [slot]: next },
      ),
    [],
  );
  const segmented = useSegmentedValue<RangeValue<DateValue>>({
    controlled,
    defaultValue: toInternalRange(defaultValue),
    incompleteMessage: incompleteLabel,
    onValueChange: (nextValue) =>
      onValueChange?.(
        nextValue?.start && nextValue.end
          ? toNativeRange(nextValue)
          : undefined,
      ),
    required,
    serialize: formatRange,
    value: toInternalRange(value),
  });
  // React Aria's optional props reject `undefined` under
  // exactOptionalPropertyTypes, so unset values are omitted.
  const picker = (
    <DateRangePickerPrimitive
      {...(field.describedBy === undefined
        ? {}
        : { "aria-describedby": field.describedBy })}
      {...(fieldAriaLabel === undefined
        ? {}
        : { "aria-label": fieldAriaLabel })}
      {...(field.labelledBy === undefined
        ? {}
        : { "aria-labelledby": field.labelledBy })}
      className="sp-date-range-picker sp-base-date-range-picker contents"
      data-foundation="date-range-picker"
      data-slot="date-range-picker"
      {...(controlled
        ? { value: segmented.ownerValue }
        : { defaultValue: toInternalRange(defaultValue) })}
      isDateUnavailable={(date) =>
        isCalendarDayDisabled(toNativeDate(date), calendarProps?.disabled)
      }
      isDisabled={field.disabled}
      {...(controlledInvalid === undefined
        ? {}
        : { isInvalid: controlledInvalid })}
      {...(readOnly === undefined ? {} : { isReadOnly: readOnly })}
      {...(required === undefined ? {} : { isRequired: required })}
      {...calendarMonthBounds(calendarProps ?? {})}
      // Typed segments start from the calendar's today, `todayDate` when set.
      {...(calendarProps?.todayDate === undefined
        ? {}
        : { placeholderValue: fromNativeDate(calendarProps.todayDate) })}
      onChange={segmented.onOwnerChange}
      shouldCloseOnSelect
      shouldForceLeadingZeros
      validate={segmented.validate}
    >
      {({ isInvalid, state }) => (
        <>
          <DateRangeGroupPrimitive
            className={cn("inline-flex max-w-full", className)}
          >
            <InputGroup
              aria-label={undefined}
              className={cn("sp-date-range-control w-full", className)}
              data-icon-mode={iconMode}
              data-invalid={
                (controlledInvalid ?? (isInvalid || field.valid === false)) ||
                undefined
              }
              data-readonly={(readOnly && !field.disabled) || undefined}
              data-size={resolvedSize}
              data-slot="date-range-picker-control"
              ref={controlRef}
              // The field text scale: 14 px, or 16 px at xl.
              textSize={
                textSize ?? (resolvedSize === "xl" ? "base" : undefined)
              }
              variant={variant}
            >
              <DateRangeSegments>
                <DateRangeEndpoint
                  label={startLabel}
                  onClearedChange={onClearedChange}
                  slot="start"
                />
                <InputGroupText
                  aria-hidden="true"
                  className="mx-1 text-foreground"
                  data-slot="date-range-picker-separator"
                >
                  –
                </InputGroupText>
                <DateRangeEndpoint
                  label={endLabel}
                  onClearedChange={onClearedChange}
                  slot="end"
                />
              </DateRangeSegments>
              {iconMode === "action-end" ? (
                <InputGroupAddon align="inline-end" className="ms-auto">
                  <Button
                    aria-label={openPickerLabel}
                    data-slot="date-range-picker-trigger"
                    disabled={field.disabled || readOnly}
                    render={<DateRangeButtonPrimitive />}
                    profile="field-action"
                    size={actionSizes[resolvedSize]}
                  >
                    <CalendarDaysIcon aria-hidden="true" />
                  </Button>
                </InputGroupAddon>
              ) : null}
            </InputGroup>
          </DateRangeGroupPrimitive>
          {/* Without its button the range opens no calendar: React Aria's
              picker works with its date fields alone. */}
          {iconMode === "action-end" ? (
            <DateRangePopoverPrimitive
              className={cn(
                "sp-date-range-picker-popover",
                surfaceClassNames.floatingOverlay,
                "sp-date-range-popover",
              )}
              data-slot="date-range-picker-popover"
              offset={4}
              placement="bottom end"
            >
              <SiteplaneUIPortalScope>
                <DateRangeDialogPrimitive
                  className="sp-date-range-picker-dialog outline-none"
                  data-slot="date-range-picker-dialog"
                >
                  <Calendar
                    {...calendarProps}
                    {...(fieldAriaLabel === undefined
                      ? {}
                      : { "aria-label": fieldAriaLabel })}
                    {...(fieldAriaLabel || field.labelledBy === undefined
                      ? {}
                      : { "aria-labelledby": field.labelledBy })}
                    className="sp-date-range-calendar"
                    data-slot="date-range-picker-calendar"
                    selectionMode="range"
                  />
                </DateRangeDialogPrimitive>
              </SiteplaneUIPortalScope>
            </DateRangePopoverPrimitive>
          ) : null}
          <DateRangeHiddenInputs
            cleared={cleared}
            controlled={controlled}
            controlledInvalid={controlledInvalid}
            controlRef={controlRef}
            defaultValue={defaultValue}
            endName={endName}
            field={field}
            focusTarget={() =>
              controlRef.current?.querySelector<HTMLElement>(
                '[role="spinbutton"], [role="textbox"]',
              ) ?? null
            }
            form={form}
            required={required}
            segmented={segmented}
            startName={startName}
            state={state}
          />
        </>
      )}
    </DateRangePickerPrimitive>
  );

  return locale ? (
    <SiteplaneLocaleProvider locale={locale}>{picker}</SiteplaneLocaleProvider>
  ) : (
    picker
  );
}
