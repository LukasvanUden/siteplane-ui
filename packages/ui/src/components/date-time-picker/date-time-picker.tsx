"use client";

import {
  type CalendarDate,
  CalendarDateTime,
  type DateValue,
  getLocalTimeZone,
  Time,
  toCalendarDate,
  toCalendarDateTime as toCalendarDateTimeAt,
  today,
} from "@internationalized/date";
import { CalendarBlankIcon } from "@phosphor-icons/react/dist/ssr";
import * as React from "react";
import {
  Button as DateTimeButtonPrimitive,
  CalendarContext,
  DateFieldStateContext,
  DateInput as DateTimeInputPrimitive,
  DatePicker as DateTimePickerPrimitive,
  type DatePickerState,
  DateSegment as DateTimeSegmentPrimitive,
  Dialog as DateTimeDialogPrimitive,
  Group as DateTimeGroupPrimitive,
  Popover as DateTimePopoverPrimitive,
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
  fromNativeDate,
  isCalendarDayDisabled,
  toNativeDate,
} from "../calendar/calendar";
import { DateInputGroup } from "../date-field/date-input-group";
import {
  DatePickerFooter,
  DatePickerPanel,
  DatePickerTrigger,
} from "../date-picker/date-picker-panel";
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
import { InputGroup, InputGroupAddon } from "../input-group";
import {
  type TimeFieldHourCycle,
  TimeFieldOptionColumn,
  timeSegmentPart,
} from "../time-field/time-field";

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
  /**
   * The clock the time segments and the button's list of times show: `24`
   * (00 to 23), or `12` with the locale's AM and PM. The value stays in
   * 24-hour time.
   */
  hourCycle?: TimeFieldHourCycle;
  /**
   * The error a required picker shows while its date and time are
   * incomplete, such as after a segment is cleared. Default: "Enter a
   * complete date and time."
   */
  incompleteLabel?: string;
  locale?: string;
  /**
   * The minutes between the times of the button's panel
   * (`trigger="button"`), 30 by default, unless `timeSlots` names them. The
   * field types its time into segments, which take any minute.
   */
  minuteStep?: number;
  name?: string;
  onValueChange?: (value: DateTimePickerValue | undefined) => void;
  openDatePickerLabel?: string;
  /**
   * The text of the button (`trigger="button"`) while no date and time are
   * set. Default: "Choose date".
   */
  placeholder?: React.ReactNode;
  readOnly?: boolean;
  required?: boolean;
  /**
   * While the value is invalid, an alert icon stands at the end of the field,
   * before its calendar button, where the help icon of `tooltip` stands,
   * which gives way to it, as in an Input. It is decorative: the Field ties
   * the error message to the field. `false` turns it off. Default: `true`.
   */
  showInvalidIcon?: boolean;
  size?: SiteplaneControlSize;
  textSize?: FormControlTextSize;
  /**
   * The times the button's panel lists under "Available times"
   * (`trigger="button"`), in 24-hour time. Default: every `minuteStep`
   * minutes of the day.
   */
  timeSlots?: readonly DateTimePickerValue["time"][];
  /**
   * Help text that a help icon at the end of the field shows in a tooltip,
   * as Input's `tooltip` does. The help icon sits before the field's calendar
   * button.
   */
  tooltip?: React.ReactNode;
  /**
   * `field` types the date and the time into segments, with a button for the
   * calendar at its end (Lukas, 4 November 2026: the time has no button of
   * its own). `button` is a Button that shows the date and the time and opens
   * a panel: the calendar beside a list of times, and in the footer the date
   * to type, Today, and Cancel and Apply. The panel holds what is picked
   * until Apply sets it; Cancel, Escape and a press outside keep the value as
   * it was. Default: `field`.
   */
  trigger?: "button" | "field";
  value?: DateTimePickerValue | null;
  variant?: FormControlVariant;
  /**
   * `fit` is as wide as the date, the time and the calendar button, or the
   * button as wide as its text. `full` fills the container, like Input.
   * Default: `fit`.
   */
  width?: "fit" | "full";
}

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

type DateTimeSegmentValue = React.ComponentProps<
  typeof DateTimeSegmentPrimitive
>["segment"];

// The picker's DateInput keeps its own field state; the segments tell the
// picker whether it shows a cleared segment.
function DateTimeSegment({
  onClearedChange,
  segment,
}: {
  onClearedChange: (cleared: boolean) => void;
  segment: DateTimeSegmentValue;
}): React.ReactElement {
  const fieldState = React.useContext(DateFieldStateContext);
  const cleared = hasClearedSegment(fieldState);
  React.useLayoutEffect(() => onClearedChange(cleared));
  // The date and the time read as one run of text, the value of a Date Field
  // with a time: the hour, the minute, the day period and the literals before
  // them, the comma after the date included, are the Time Field's segments
  // (time-field.tsx), so the picker draws the separator the locale writes, with
  // the spaces it writes, and no comma of its own.
  const timePart = timeSegmentPart(segment, fieldState?.segments ?? []);
  // The segment shows the text the server and the browser agree on: Node's
  // formatToParts puts a narrow no-break space before AM and PM where the
  // browser has a plain one (time-field.tsx).
  return (
    <DateTimeSegmentPrimitive
      className={cn(
        "sp-date-time-picker-segment",
        timePart ? "sp-time-segment" : "sp-date-segment",
      )}
      // A separator cancels the padding of the segments beside it: the date
      // separators, the colon, the comma after the date and the space before
      // AM or PM.
      data-literal-kind={
        timePart === "separator" ||
        (!timePart && segment.type === "literal" && /[./-]/.test(segment.text))
          ? "separator"
          : undefined
      }
      data-slot="date-time-picker-segment"
      segment={segment}
    >
      {({ text }) => normalizeFormattedText(text)}
    </DateTimeSegmentPrimitive>
  );
}

// The date, the comma and the time read in the locale's direction, which
// React Aria's arrow keys follow, whatever the page's: an en-US value keeps
// its date before its time in a right-to-left page. The dir attribute also
// isolates the row from the text around it. The field keeps the page's
// direction, so its calendar button ends it at the page's inline end, and
// the rules of every date and time field (input-group.css) keep the field's
// insets on the field's sides.
function DateTimeSegments({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const { direction } = useLocale();

  return (
    <div
      className="sp-date-time-picker-segments"
      data-slot="date-time-picker-segments"
      dir={direction}
    >
      {children}
    </div>
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

type TimeOfDay = DateTimePickerValue["time"];

/** The times of a day, every `step` minutes from midnight. */
function daySlots(step: number): TimeOfDay[] {
  const minutes = Math.min(Math.max(Math.trunc(step) || 30, 1), 60);
  return Array.from({ length: Math.ceil((24 * 60) / minutes) }, (_, index) => ({
    hour: Math.floor((index * minutes) / 60),
    minute: (index * minutes) % 60,
  }));
}

/** The key of a time in the list of times: `HH:mm`. */
function timeKey({ hour, minute }: TimeOfDay): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/**
 * A time as the button and the list of times write it: "9:00 AM" on a
 * 12-hour clock in en-US, "09:00" on the 24-hour clock.
 */
function useTimeFormatter(
  hourCycle: TimeFieldHourCycle,
): (time: TimeOfDay) => string {
  const { locale } = useLocale();
  return React.useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, {
      hour: hourCycle === 12 ? "numeric" : "2-digit",
      hourCycle: hourCycle === 12 ? "h12" : "h23",
      minute: "2-digit",
    });
    // The time on any day: the kit builds no native date from parts
    // (field.test.tsx), so a day's time is set on an existing date.
    return ({ hour, minute }) => {
      const at = new Date(0);
      at.setHours(hour, minute, 0, 0);
      return normalizeFormattedText(formatter.format(at));
    };
  }, [hourCycle, locale]);
}

/**
 * The button of `trigger="button"`: the date as the locale writes it,
 * "Nov 2, 2026" in en-US, and the time after it in the tertiary text, or the
 * placeholder.
 */
function DateTimeButton({
  disabled,
  hourCycle,
  invalid,
  placeholder,
  size,
  state,
  textSize,
}: {
  disabled: boolean;
  hourCycle: TimeFieldHourCycle;
  invalid: boolean;
  placeholder: React.ReactNode;
  size: SiteplaneControlSize | undefined;
  state: DatePickerState;
  textSize: FormControlTextSize | undefined;
}): React.ReactElement {
  const { locale } = useLocale();
  const dateFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    [locale],
  );
  const formatTime = useTimeFormatter(hourCycle);
  const value = state.value && "hour" in state.value ? state.value : null;

  return (
    <DatePickerTrigger
      data-slot="date-time-picker-button"
      disabled={disabled}
      empty={value === null}
      invalid={invalid}
      size={size}
      textSize={textSize}
      valueSlot="date-time-picker-value"
    >
      {value ? (
        <>
          {normalizeFormattedText(dateFormatter.format(toNativeDate(value)))}{" "}
          <span
            className="sp-date-time-picker-value-time"
            data-slot="date-time-picker-value-time"
          >
            {formatTime(value)}
          </span>
        </>
      ) : (
        placeholder
      )}
    </DatePickerTrigger>
  );
}

/**
 * The panel of `trigger="button"`: the
 * calendar beside a list of times, and in the footer the date to type, Today,
 * and Cancel and Apply. It holds the date and the time picked apart from the
 * picker's own until Apply sets them, so Cancel, or the panel closed any
 * other way, keeps the value as it was; they start as the picker's each time
 * the panel opens. Apply waits for a date; without a time it takes midnight.
 */
function DateTimePanel({
  calendarProps,
  fieldAriaLabel,
  hourCycle,
  labelledBy,
  size,
  slots,
  state,
}: {
  calendarProps: CalendarOptions | undefined;
  fieldAriaLabel: string | undefined;
  hourCycle: TimeFieldHourCycle;
  labelledBy: string | undefined;
  size: SiteplaneControlSize;
  slots: readonly TimeOfDay[];
  state: DatePickerState;
}): React.ReactElement {
  const calendarMessages = useSiteplaneMessages("calendar");
  const messages = useSiteplaneMessages("dateTimePicker");
  // The picker hands its calendar its date, its bounds and the focus on open
  // through React Aria's calendar context; the panel keeps all of it but the
  // date, which it holds itself until Apply.
  const pickerCalendar = useSlottedContext(CalendarContext);
  const initial = state.value && "hour" in state.value ? state.value : null;
  const [date, setDate] = React.useState<CalendarDate | null>(
    initial ? toCalendarDate(initial) : null,
  );
  const [time, setTime] = React.useState<TimeOfDay | null>(
    initial ? { hour: initial.hour, minute: initial.minute } : null,
  );
  // The month a typed date or Today shows; unset, the calendar shows the
  // date's.
  const [month, setMonth] = React.useState<Date | undefined>(undefined);
  const formatTime = useTimeFormatter(hourCycle);
  const options = slots.map(timeKey);
  const optionLabels = Object.fromEntries(
    slots.map((slot) => [timeKey(slot), formatTime(slot)]),
  );
  const bounds = calendarMonthBounds(calendarProps ?? {});
  const isDateAllowed = (day: CalendarDate) =>
    !isCalendarDayDisabled(toNativeDate(day), calendarProps?.disabled) &&
    !(bounds.minValue && day.compare(bounds.minValue) < 0) &&
    !(bounds.maxValue && day.compare(bounds.maxValue) > 0);
  const pick = (day: CalendarDate) => {
    if (!isDateAllowed(day)) return;
    setDate(day);
    setMonth(toNativeDate(day));
  };
  const todayValue = calendarProps?.todayDate
    ? fromNativeDate(calendarProps.todayDate)
    : today(getLocalTimeZone());

  return (
    <DatePickerPanel
      footer={
        <DatePickerFooter
          applyDisabled={date === null}
          onApply={() => {
            if (!date) return;
            state.setValue(
              toCalendarDateTimeAt(
                date,
                new Time(time?.hour ?? 0, time?.minute ?? 0),
              ),
            );
            state.setOpen(false);
          }}
          onCancel={() => state.setOpen(false)}
        >
          <DateInputGroup
            aria-label={calendarMessages.date}
            isDateUnavailable={(day) =>
              isCalendarDayDisabled(toNativeDate(day), calendarProps?.disabled)
            }
            {...bounds}
            onChange={(next) => {
              if (next) pick(toCalendarDate(next));
            }}
            size={size}
            value={date}
            width="fit"
          />
          <Button
            data-slot="date-time-picker-today"
            disabled={!isDateAllowed(todayValue)}
            onClick={() => pick(todayValue)}
            size={size}
          >
            {calendarMessages.today}
          </Button>
        </DatePickerFooter>
      }
    >
      <div
        className="sp-date-time-picker-panel-content"
        data-slot="date-time-picker-panel-content"
      >
        <CalendarContext.Provider
          value={{
            ...pickerCalendar,
            onChange: (next: DateValue | readonly DateValue[] | null) => {
              const day = Array.isArray(next) ? next[0] : next;
              if (day) setDate(toCalendarDate(day));
            },
            value: date,
          }}
        >
          <Calendar
            {...calendarProps}
            {...(fieldAriaLabel === undefined
              ? {}
              : { "aria-label": fieldAriaLabel })}
            {...(fieldAriaLabel || labelledBy === undefined
              ? {}
              : { "aria-labelledby": labelledBy })}
            data-slot="date-time-picker-calendar"
            month={month}
            onMonthChange={setMonth}
          />
        </CalendarContext.Provider>
        <TimeFieldOptionColumn
          fill
          label={messages.times}
          onValueChange={(key) => {
            const [hour, minute] = key.split(":").map(Number);
            setTime({ hour: hour ?? 0, minute: minute ?? 0 });
          }}
          open
          optionLabels={optionLabels}
          options={options}
          // The times are as tall as the picker's field, as the Time Field's
          // and a Select's options are as tall as their trigger.
          size={size}
          slot="date-time-picker-times"
          value={time ? timeKey(time) : undefined}
        />
      </div>
    </DatePickerPanel>
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
  hourCycle = 24,
  incompleteLabel: incompleteLabelProp,
  locale,
  minuteStep,
  name,
  onValueChange,
  openDatePickerLabel: openDatePickerLabelProp,
  placeholder: placeholderProp,
  readOnly,
  required,
  showInvalidIcon = true,
  size,
  textSize,
  timeSlots,
  tooltip,
  trigger = "field",
  value,
  variant = "default",
  width = "fit",
}: DateTimePickerProps): React.ReactElement {
  const dateFieldMessages = useSiteplaneMessages("dateField");
  const datePickerMessages = useSiteplaneMessages("datePicker");
  const incompleteLabel =
    incompleteLabelProp ?? dateFieldMessages.incompleteDateTime;
  const openDatePickerLabel =
    openDatePickerLabelProp ?? dateFieldMessages.openCalendar;
  const placeholder =
    placeholderProp === undefined
      ? datePickerMessages.placeholder
      : placeholderProp;
  const controlled = value !== undefined;
  const resolvedSize = useResolvedControlSize(size);
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
    incompleteMessage: incompleteLabel,
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
      className="sp-date-time-picker sp-base-date-time-picker contents"
      data-foundation="date-time-picker"
      data-slot="date-time-picker"
      {...(controlled
        ? { value: segmented.ownerValue as CalendarDateTime | null }
        : { defaultValue: toCalendarDateTime(defaultValue) })}
      granularity="minute"
      hourCycle={hourCycle}
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
      // Typed segments start from the calendar's today at midnight,
      // `todayDate` when set.
      {...(calendarProps?.todayDate === undefined
        ? {}
        : {
            placeholderValue: toCalendarDateTimeAt(
              fromNativeDate(calendarProps.todayDate),
            ),
          })}
      onChange={segmented.onOwnerChange}
      // The button's panel stays open until Apply.
      shouldCloseOnSelect={trigger !== "button"}
      shouldForceLeadingZeros
      validate={segmented.validate}
    >
      {({ isInvalid, state }) =>
        trigger === "button" ? (
          <>
            <DateTimeGroupPrimitive
              // As wide as the date and the time by default; width="full"
              // fills the container, like Input.
              className={cn(
                width === "full" ? "flex w-full" : "inline-flex",
                "max-w-full",
                className,
              )}
              ref={controlRef}
            >
              <DateTimeButton
                disabled={field.disabled}
                hourCycle={hourCycle}
                invalid={
                  (controlledInvalid ?? (isInvalid || field.valid === false)) ||
                  false
                }
                placeholder={placeholder}
                size={size}
                state={state}
                textSize={textSize}
              />
            </DateTimeGroupPrimitive>
            <DateTimePopoverPrimitive
              className={cn(
                surfaceClassNames.floatingOverlay,
                "sp-date-time-picker-calendar-popover",
              )}
              data-panel
              data-slot="date-time-picker-calendar-popover"
              offset={4}
              placement="bottom start"
            >
              <SiteplaneUIPortalScope>
                <DateTimeDialogPrimitive
                  className="sp-date-time-picker-calendar-dialog outline-none"
                  data-slot="date-time-picker-calendar-dialog"
                >
                  <DateTimePanel
                    calendarProps={calendarProps}
                    fieldAriaLabel={fieldAriaLabel}
                    hourCycle={hourCycle}
                    labelledBy={field.labelledBy}
                    size={resolvedSize}
                    slots={
                      timeSlots?.map(normalizeTime) ??
                      daySlots(minuteStep ?? 30)
                    }
                    state={state}
                  />
                </DateTimeDialogPrimitive>
              </SiteplaneUIPortalScope>
            </DateTimePopoverPrimitive>
            <DateTimeHiddenInput
              cleared={false}
              controlled={controlled}
              controlledInvalid={controlledInvalid}
              controlRef={controlRef}
              defaultValue={defaultValue}
              field={field}
              focusTarget={() =>
                controlRef.current?.querySelector<HTMLElement>(
                  ".sp-date-time-picker-button",
                ) ?? null
              }
              form={form}
              required={required}
              segmented={segmented}
              state={state}
            />
          </>
        ) : (
          <>
            <DateTimeGroupPrimitive
              // As wide as the date and the time by default, and never
              // narrower than them in a flex row; width="full" fills the
              // container, like Input. The root takes className, as in the
              // other pickers, so a width utility replaces either; the field
              // fills it.
              className={cn(
                width === "full" ? "flex w-full" : "inline-flex w-max shrink-0",
                "max-w-full",
                className,
              )}
            >
              <InputGroup
                aria-label={undefined}
                className="sp-date-time-picker-control w-full"
                data-invalid={
                  (controlledInvalid ?? (isInvalid || field.valid === false)) ||
                  undefined
                }
                data-readonly={(readOnly && !field.disabled) || undefined}
                data-slot="date-time-picker-control"
                ref={controlRef}
                // The group is the field of the size: its height, its padding,
                // its icons and its text, 14 px at sm and 16 px from md (the
                // field scale); textSize sets one text at every size. It shows
                // the help icon of `tooltip` and the alert icon of an invalid
                // value before the calendar button.
                showInvalidIcon={showInvalidIcon}
                size={resolvedSize}
                textSize={textSize}
                tooltip={tooltip}
                variant={variant}
              >
                <DateTimeSegments>
                  <DateTimeInputPrimitive
                    className="sp-date-time-picker-input sp-base-date-field contents"
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
                </DateTimeSegments>
                {/* The calendar's button is the field action at the end of
                    the field, where every field puts its actions
                    (design-rework.css). The date and the time before it read
                    as one value and are typed into its segments: the field
                    has no button for the time (Lukas, 4 November 2026; the
                    list of times stays in the panel of trigger="button"). */}
                <InputGroupAddon align="inline-end">
                  <Button
                    aria-label={openDatePickerLabel}
                    data-slot="date-time-picker-date-trigger"
                    disabled={field.disabled || readOnly}
                    render={<DateTimeButtonPrimitive />}
                    profile="field-action"
                    shape="square"
                  >
                    <CalendarBlankIcon aria-hidden="true" />
                  </Button>
                </InputGroupAddon>
              </InputGroup>
            </DateTimeGroupPrimitive>
            <DateTimePopoverPrimitive
              className={cn(
                surfaceClassNames.floatingOverlay,
                "sp-date-time-picker-calendar-popover",
              )}
              data-slot="date-time-picker-calendar-popover"
              offset={4}
              placement="bottom start"
            >
              <SiteplaneUIPortalScope>
                <DateTimeDialogPrimitive
                  className="sp-date-time-picker-calendar-dialog outline-none"
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
        )
      }
    </DateTimePickerPrimitive>
  );

  return locale ? (
    <SiteplaneLocaleProvider locale={locale}>{picker}</SiteplaneLocaleProvider>
  ) : (
    picker
  );
}
