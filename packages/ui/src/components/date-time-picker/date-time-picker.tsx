"use client";

import {
  CalendarDateTime,
  type DateValue,
  Time,
  toCalendarDateTime as toCalendarDateTimeAt,
} from "@internationalized/date";
import { CalendarDaysIcon, ClockIcon } from "lucide-react";
import * as React from "react";
import {
  Button as DateTimeButtonPrimitive,
  DateFieldStateContext,
  DateInput as DateTimeInputPrimitive,
  DatePicker as DateTimePickerPrimitive,
  type DatePickerState,
  DateSegment as DateTimeSegmentPrimitive,
  Dialog as DateTimeDialogPrimitive,
  DialogTrigger as TimeSelectorTriggerPrimitive,
  Group as DateTimeGroupPrimitive,
  Popover as DateTimePopoverPrimitive,
} from "react-aria-components";

import { isInvalidAriaValue } from "../../system/form/aria-invalid";
import { useFormReset } from "../../system/form/use-form-reset";
import { SiteplaneLocaleProvider } from "../../system/locale/siteplane-locale-provider";
import {
  type SiteplaneControlSize,
  SiteplaneUIPortalScope,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import {
  formControlTextClassNames,
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
import { TimeFieldOptionColumn } from "../time-field/time-field";

// The shared date segment styles are owned by DateField.
import "../date-field/date-field.css";
import "./date-time-picker.css";

export type DateTimePickerValue = {
  date: Date;
  time: {
    hour: number;
    minute: number;
  };
};

export interface DateTimePickerProps {
  "aria-describedby"?: string | undefined;
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  "aria-label"?: string;
  "aria-labelledby"?: string | undefined;
  calendarProps?: CalendarOptions;
  className?: string;
  defaultValue?: DateTimePickerValue;
  disabled?: boolean;
  form?: string;
  locale?: string;
  minuteStep?: number;
  name?: string;
  onValueChange?: (value: DateTimePickerValue | undefined) => void;
  openDatePickerLabel?: string;
  openTimePickerLabel?: string;
  readOnly?: boolean;
  required?: boolean;
  size?: SiteplaneControlSize;
  textSize?: FormControlTextSize;
  value?: DateTimePickerValue | null;
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

const hourOptions = Array.from({ length: 24 }, (_, hour) =>
  String(hour).padStart(2, "0"),
);

function normalizeTime(value: DateTimePickerValue["time"]) {
  return {
    hour: Math.min(Math.max(Math.trunc(value.hour) || 0, 0), 23),
    minute: Math.min(Math.max(Math.trunc(value.minute) || 0, 0), 59),
  };
}

function toCalendarDateTime(
  value: DateTimePickerValue | null | undefined,
): CalendarDateTime | null {
  if (!value) return null;
  const time = normalizeTime(value.time);
  return new CalendarDateTime(
    value.date.getFullYear(),
    value.date.getMonth() + 1,
    value.date.getDate(),
    time.hour,
    time.minute,
  );
}

function toNativeValue(
  value: DateValue | null | undefined,
): DateTimePickerValue | undefined {
  if (!value || !("hour" in value)) return undefined;
  return {
    date: toNativeDate(value),
    time: { hour: value.hour, minute: value.minute },
  };
}

function formatValue(value: DateValue | null | undefined): string {
  const nativeValue = toNativeValue(value);
  if (!nativeValue) return "";
  return `${String(nativeValue.date.getFullYear()).padStart(4, "0")}-${String(nativeValue.date.getMonth() + 1).padStart(2, "0")}-${String(nativeValue.date.getDate()).padStart(2, "0")}T${String(nativeValue.time.hour).padStart(2, "0")}:${String(nativeValue.time.minute).padStart(2, "0")}`;
}

/**
 * The Calendar's month bounds as date-time bounds of the picker: from the
 * start of the first allowed day to 23:59 on the last.
 */
function dateTimeBounds(calendarProps: CalendarOptions | undefined): {
  maxValue?: CalendarDateTime;
  minValue?: CalendarDateTime;
} {
  const { maxValue, minValue } = calendarMonthBounds(calendarProps ?? {});
  return {
    ...(maxValue === undefined
      ? {}
      : { maxValue: toCalendarDateTimeAt(maxValue, new Time(23, 59)) }),
    ...(minValue === undefined
      ? {}
      : { minValue: toCalendarDateTimeAt(minValue) }),
  };
}

function getSegmentPart(
  segment: React.ComponentProps<typeof DateTimeSegmentPrimitive>["segment"],
): "date" | "hidden" | "time" {
  if (
    segment.type === "hour" ||
    segment.type === "minute" ||
    segment.type === "second" ||
    segment.type === "dayPeriod" ||
    segment.type === "timeZoneName"
  ) {
    return "time";
  }
  if (segment.type !== "literal") return "date";
  if (segment.text.includes(":")) return "time";
  if (/^[./\-\s]+$/.test(segment.text)) return "date";
  return "hidden";
}

// The picker's DateInput keeps its own field state; the segments tell the
// picker whether it shows a cleared segment.
function DateTimeSegment({
  onClearedChange,
  segment,
}: {
  onClearedChange: (cleared: boolean) => void;
  segment: React.ComponentProps<typeof DateTimeSegmentPrimitive>["segment"];
}): React.ReactElement {
  const cleared = hasClearedSegment(React.useContext(DateFieldStateContext));
  React.useLayoutEffect(() => onClearedChange(cleared));
  const part = getSegmentPart(segment);
  return (
    <DateTimeSegmentPrimitive
      className={cn(
        "siteplane-date-time-picker-segment",
        part === "date" && "siteplane-date-field-segment",
        part === "time" && "siteplane-time-field-segment",
      )}
      data-date-time-part={part}
      data-literal-kind={
        segment.type === "literal" && /[.:/-]/.test(segment.text)
          ? "separator"
          : undefined
      }
      data-slot="date-time-picker-segment"
      segment={segment}
    />
  );
}

function DateTimeHiddenInput({
  cleared,
  controlled,
  controlledInvalid,
  controlRef,
  defaultValue,
  field,
  focusTarget,
  form,
  required,
  segmented,
  state,
}: {
  cleared: boolean;
  controlled: boolean;
  controlledInvalid: boolean | undefined;
  controlRef: React.RefObject<HTMLDivElement | null>;
  defaultValue: DateTimePickerValue | undefined;
  field: FieldControlBridge;
  focusTarget: () => HTMLElement | null;
  form: string | undefined;
  required: boolean | undefined;
  segmented: SegmentedValue<DateValue>;
  state: DatePickerState;
}): React.ReactElement {
  const inputRef = useFormReset<HTMLInputElement>(form, () => {
    if (!controlled) state.setValue(toCalendarDateTime(defaultValue));
  });
  // A cleared segment leaves the picker without a value, although React Aria
  // still holds the last complete one.
  const fieldValue = cleared ? null : state.value;
  const serializedValue = formatValue(fieldValue);
  React.useLayoutEffect(() => {
    segmented.sync({ cleared, effective: fieldValue, value: state.value });
  });
  const proxyProps = useFieldControlProxy({
    controlled: controlledInvalid !== undefined,
    disabled: field.disabled,
    displayValidation: state.displayValidation,
    focusTarget,
    form,
    name: field.name,
    onRevalidate: state.commitValidation,
    realtimeValidation: state.realtimeValidation,
    required,
    value: serializedValue,
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
        name={field.name}
        readOnly
        ref={inputRef}
        required={required}
        type="hidden"
        value={serializedValue}
      />
      {proxyProps ? (
        <ExternalInputOwner>
          <Input nativeInput unstyled {...proxyProps} />
        </ExternalInputOwner>
      ) : null}
    </>
  );
}

function TimeSelector({
  minuteStep,
  onClose,
  open,
  state,
}: {
  minuteStep: number;
  onClose: () => void;
  open: boolean;
  state: DatePickerState;
}): React.ReactElement {
  const resolvedStep = Math.min(Math.max(Math.trunc(minuteStep) || 5, 1), 60);
  const minuteOptions = React.useMemo(
    () =>
      Array.from({ length: Math.ceil(60 / resolvedStep) }, (_, index) =>
        String(index * resolvedStep).padStart(2, "0"),
      ),
    [resolvedStep],
  );
  const hour = state.timeValue?.hour ?? 0;
  const minute = state.timeValue?.minute ?? 0;

  return (
    <div
      className="siteplane-time-field-selector"
      data-slot="date-time-picker-time-selector"
    >
      <TimeFieldOptionColumn
        label="Hours"
        onValueChange={(nextHour) =>
          state.setTimeValue(new Time(Number(nextHour), minute))
        }
        open={open}
        options={hourOptions}
        slot="time-field-hours"
        value={String(hour).padStart(2, "0")}
      />
      <TimeFieldOptionColumn
        label="Minutes"
        onValueChange={(nextMinute) => {
          state.setTimeValue(new Time(hour, Number(nextMinute)));
          onClose();
        }}
        open={open}
        options={minuteOptions}
        slot="time-field-minutes"
        value={String(minute).padStart(2, "0")}
      />
    </div>
  );
}

export function DateTimePicker({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  calendarProps,
  className,
  defaultValue,
  disabled,
  form,
  locale,
  minuteStep = 5,
  name,
  onValueChange,
  openDatePickerLabel = "Open date calendar",
  openTimePickerLabel = "Open time selector",
  readOnly,
  required,
  size,
  textSize,
  value,
  variant = "default",
}: DateTimePickerProps): React.ReactElement {
  const controlled = value !== undefined;
  const resolvedSize = useResolvedControlSize(size);
  const resolvedTextSize =
    textSize ??
    (resolvedSize === "lg" || resolvedSize === "xl" ? "base" : undefined);
  const [timeOpen, setTimeOpen] = React.useState(false);
  const controlRef = React.useRef<HTMLDivElement>(null);
  const field = useFieldControlBridge({
    "aria-describedby": ariaDescribedBy,
    "aria-labelledby": ariaLabelledBy,
    disabled,
    name,
  });
  const fieldAriaLabel = field.labelledBy ? undefined : ariaLabel;
  // React Aria validates the typed date and time unless the application
  // controls the invalid state through aria-invalid or an invalid Field.
  const controlledInvalid =
    ariaInvalid !== undefined
      ? isInvalidAriaValue(ariaInvalid)
      : field.invalid || undefined;
  // A cleared segment empties the picker's value.
  const [cleared, setCleared] = React.useState(false);
  const segmented = useSegmentedValue<DateValue>({
    controlled,
    defaultValue: toCalendarDateTime(defaultValue),
    incompleteMessage: "Enter a complete date and time.",
    onValueChange: (nextValue) => onValueChange?.(toNativeValue(nextValue)),
    required,
    serialize: formatValue,
    value: toCalendarDateTime(value),
  });
  // React Aria's optional props reject `undefined` under
  // exactOptionalPropertyTypes, so unset values are omitted.
  const picker = (
    <DateTimePickerPrimitive<CalendarDateTime>
      {...(field.describedBy === undefined
        ? {}
        : { "aria-describedby": field.describedBy })}
      {...(fieldAriaLabel === undefined
        ? {}
        : { "aria-label": fieldAriaLabel })}
      {...(field.labelledBy === undefined
        ? {}
        : { "aria-labelledby": field.labelledBy })}
      className="contents"
      data-foundation="date-time-picker"
      data-slot="date-time-picker"
      {...(controlled
        ? { value: segmented.ownerValue as CalendarDateTime | null }
        : { defaultValue: toCalendarDateTime(defaultValue) })}
      granularity="minute"
      hourCycle={24}
      isDateUnavailable={(date) =>
        isCalendarDayDisabled(toNativeDate(date), calendarProps?.disabled)
      }
      isDisabled={field.disabled}
      {...(controlledInvalid === undefined
        ? {}
        : { isInvalid: controlledInvalid })}
      {...(readOnly === undefined ? {} : { isReadOnly: readOnly })}
      {...(required === undefined ? {} : { isRequired: required })}
      {...dateTimeBounds(calendarProps)}
      onChange={segmented.onOwnerChange}
      shouldCloseOnSelect
      shouldForceLeadingZeros
      validate={segmented.validate}
    >
      {({ isInvalid, state }) => (
        <>
          <DateTimeGroupPrimitive
            className={cn("inline-flex max-w-full", className)}
          >
            <InputGroup
              aria-label={undefined}
              // The default width never shrinks below the segments in a flex
              // row (shrink-0 while w-max); a width utility replaces both.
              className={cn(
                "siteplane-date-time-picker-control w-max [&.w-max]:shrink-0",
                className,
              )}
              data-invalid={
                (controlledInvalid ?? (isInvalid || field.valid === false)) ||
                undefined
              }
              data-readonly={(readOnly && !field.disabled) || undefined}
              data-size={resolvedSize}
              data-slot="date-time-picker-control"
              ref={controlRef}
              // The field text scale: 14 px, or 16 px at xl.
              textSize={
                textSize ?? (resolvedSize === "xl" ? "base" : undefined)
              }
              variant={variant}
            >
              <DateTimeInputPrimitive
                className="contents"
                data-foundation="date-field"
                data-profile="input-group"
                data-slot="date-time-picker-input"
              >
                {(segment) => (
                  <DateTimeSegment
                    onClearedChange={setCleared}
                    segment={segment}
                  />
                )}
              </DateTimeInputPrimitive>
              <InputGroupAddon
                align="inline-end"
                data-date-time-part="date-action"
              >
                <Button
                  aria-label={openDatePickerLabel}
                  data-slot="date-time-picker-date-trigger"
                  disabled={field.disabled || readOnly}
                  render={<DateTimeButtonPrimitive />}
                  profile="field-action"
                  size={actionSizes[resolvedSize]}
                >
                  <CalendarDaysIcon aria-hidden="true" />
                </Button>
              </InputGroupAddon>
              <InputGroupText
                aria-hidden="true"
                className="mx-1 text-muted-foreground"
                data-date-time-part="separator"
                data-slot="date-time-picker-separator"
              >
                ,
              </InputGroupText>
              <InputGroupAddon
                align="inline-end"
                data-date-time-part="time-action"
              >
                <TimeSelectorTriggerPrimitive
                  isOpen={timeOpen}
                  onOpenChange={setTimeOpen}
                >
                  <Button
                    aria-label={openTimePickerLabel}
                    data-slot="date-time-picker-time-trigger"
                    disabled={field.disabled || readOnly || !state.dateValue}
                    render={<DateTimeButtonPrimitive slot={null} />}
                    profile="field-action"
                    size={actionSizes[resolvedSize]}
                  >
                    <ClockIcon aria-hidden="true" />
                  </Button>
                  <DateTimePopoverPrimitive
                    className={cn(
                      surfaceClassNames.floatingOverlay,
                      "siteplane-time-field-popover siteplane-date-time-picker-time-popover",
                      resolvedTextSize
                        ? formControlTextClassNames[resolvedTextSize]
                        : "text-base sm:text-sm",
                    )}
                    data-slot="date-time-picker-time-popover"
                    offset={6}
                    placement="bottom end"
                  >
                    <SiteplaneUIPortalScope>
                      <DateTimeDialogPrimitive
                        aria-label="Choose time"
                        className="outline-none"
                      >
                        <TimeSelector
                          minuteStep={minuteStep}
                          onClose={() => setTimeOpen(false)}
                          open={timeOpen}
                          state={state}
                        />
                      </DateTimeDialogPrimitive>
                    </SiteplaneUIPortalScope>
                  </DateTimePopoverPrimitive>
                </TimeSelectorTriggerPrimitive>
              </InputGroupAddon>
            </InputGroup>
          </DateTimeGroupPrimitive>
          <DateTimePopoverPrimitive
            className={cn(
              surfaceClassNames.floatingOverlay,
              "siteplane-date-time-picker-calendar-popover",
            )}
            data-slot="date-time-picker-calendar-popover"
            offset={4}
            placement="bottom start"
          >
            <SiteplaneUIPortalScope>
              <DateTimeDialogPrimitive
                className="outline-none"
                data-slot="date-time-picker-calendar-dialog"
              >
                <Calendar
                  {...calendarProps}
                  {...(fieldAriaLabel === undefined
                    ? {}
                    : { "aria-label": fieldAriaLabel })}
                  {...(fieldAriaLabel || field.labelledBy === undefined
                    ? {}
                    : { "aria-labelledby": field.labelledBy })}
                  className="siteplane-date-time-picker-calendar"
                  data-slot="date-time-picker-calendar"
                />
              </DateTimeDialogPrimitive>
            </SiteplaneUIPortalScope>
          </DateTimePopoverPrimitive>
          <DateTimeHiddenInput
            cleared={cleared}
            controlled={controlled}
            controlledInvalid={controlledInvalid}
            controlRef={controlRef}
            defaultValue={defaultValue}
            field={field}
            focusTarget={() =>
              controlRef.current?.querySelector<HTMLElement>(
                '[role="spinbutton"], [role="textbox"]',
              ) ?? null
            }
            form={form}
            required={required}
            segmented={segmented}
            state={state}
          />
        </>
      )}
    </DateTimePickerPrimitive>
  );

  return locale ? (
    <SiteplaneLocaleProvider locale={locale}>{picker}</SiteplaneLocaleProvider>
  ) : (
    picker
  );
}
